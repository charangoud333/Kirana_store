import { useState, FormEvent } from 'react';
import { Plus, X, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TableSkeleton } from '../components/LoadingSkeleton';

interface SaleItem {
  product_name: string;
  quantity: number;
  sale_price: number;
}

interface Sale {
  id: string;
  bill_number: string;
  sale_date: string;
  payment_type: string;
  total_amount: number;
  sale_items?: { quantity: number }[];
}

export const SalesNew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [productInput, setProductInput] = useState('');
  const [formData, setFormData] = useState({
    payment_type: 'cash' as 'cash' | 'upi' | 'credit',
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, sale_items(quantity)`)
        .order('sale_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Sale[];
    },
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const { data, error } = await (supabase
        .from('sales') as any)
        .select('sale_date, total_amount')
        .gte('sale_date', last7Days[0])
        .order('sale_date');

      if (error) throw error;

      const grouped = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: (data || [])
          .filter((s: any) => s.sale_date === date)
          .reduce((sum: number, s: any) => sum + Number(s.total_amount), 0)
      }));

      return grouped;
    },
  });

  const addItem = () => {
    if (!productInput.trim()) {
      toast.error('Please enter product name');
      return;
    }

    const existing = saleItems.find(item => item.product_name.toLowerCase() === productInput.toLowerCase());
    if (existing) {
      setSaleItems(saleItems.map(item =>
        item.product_name.toLowerCase() === productInput.toLowerCase()
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSaleItems([...saleItems, {
        product_name: productInput,
        quantity: 1,
        sale_price: 0,
      }]);
    }
    setProductInput('');
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setSaleItems(saleItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const saleMutation = useMutation({
    mutationFn: async (data: typeof formData & { items: SaleItem[]; total: number }) => {
      // First, look up all products by name and validate they exist
      const productLookups = await Promise.all(
        data.items.map(async (item) => {
          const { data: product, error } = await (supabase
            .from('products') as any)
            .select('id, quantity, name')
            .ilike('name', item.product_name)
            .maybeSingle();

          if (error) throw error;
          if (!product) {
            throw new Error(`Product "${item.product_name}" not found. Please add it first.`);
          }
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product_name}`);
          }

          return { ...item, product_id: product.id, available_quantity: product.quantity };
        })
      );

      const billNumber = `BILL-${Date.now()}`;

      // Insert sale
      const { data: sale, error: saleError } = await (supabase
        .from('sales') as any)
        .insert({
          bill_number: billNumber,
          sale_date: data.sale_date,
          payment_type: data.payment_type,
          total_amount: data.total,
          notes: data.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items with valid product_id
      const saleItemsData = productLookups.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        sale_price: item.sale_price,
        total_amount: item.quantity * item.sale_price,
      }));

      const { error: itemsError } = await (supabase
        .from('sale_items') as any)
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of productLookups) {
        await (supabase
          .from('products') as any)
          .update({ quantity: item.available_quantity - item.quantity })
          .eq('id', item.product_id);
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sale recorded successfully!');
      
      setSaleItems([]);
      setFormData({
        payment_type: 'cash',
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record sale');
    },
  });

  const total = saleItems.reduce((sum, item) => sum + item.quantity * item.sale_price, 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    if (total <= 0) {
      toast.error('Total amount must be greater than zero');
      return;
    }

    saleMutation.mutate({ ...formData, items: saleItems, total });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-500 mt-1">Record customer transactions</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Sale
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Last 7 Days Sales</h2>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Sales (₹)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bill No.</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm text-gray-900">{sale.bill_number}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.sale_items?.length || 0} items</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full capitalize bg-blue-100 text-blue-700">
                      {sale.payment_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    ₹{Number(sale.total_amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Sale</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date</label>
                  <input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Product</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                    placeholder="Type product name and press Enter"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>

              {saleItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                        <th className="w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{item.product_name}</td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.sale_price}
                              onChange={(e) => updateItem(index, 'sale_price', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ₹{(item.quantity * item.sale_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-3xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saleMutation.isPending}
                  className="flex-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {saleMutation.isPending ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
