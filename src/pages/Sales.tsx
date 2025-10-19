import { useEffect, useState, FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  sale_price: number;
  available_stock: number;
}

export const Sales = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [formData, setFormData] = useState({
    payment_type: 'cash' as 'cash' | 'upi' | 'credit',
    customer_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, customersRes, salesRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('id, name').order('name'),
        supabase
          .from('sales')
          .select(`*, sale_items(*, products(name))`)
          .order('sale_date', { ascending: false })
          .limit(20),
      ]);

      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = saleItems.find((item) => item.product_id === productId);
    if (existing) {
      setSaleItems(
        saleItems.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSaleItems([
        ...saleItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          sale_price: Number(product.selling_price),
          available_stock: Number(product.quantity),
        },
      ]);
    }
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setSaleItems(
      saleItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setSaleItems(saleItems.filter((item) => item.product_id !== productId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    for (const item of saleItems) {
      if (item.quantity > item.available_stock) {
        alert(`Insufficient stock for ${item.product_name}`);
        return;
      }
    }

    try {
      const totalAmount = saleItems.reduce(
        (sum, item) => sum + item.quantity * item.sale_price,
        0
      );

      const billNumber = `BILL-${Date.now()}`;

      const { data: sale, error: saleError } = await (supabase
        .from('sales') as any)
        .insert({
          bill_number: billNumber,
          sale_date: formData.sale_date,
          payment_type: formData.payment_type,
          customer_id: formData.customer_id || null,
          total_amount: totalAmount,
          notes: formData.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItemsData = saleItems.map((item) => ({
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

      for (const item of saleItems) {
        const product = products.find((p) => p.id === item.product_id);
        if (product) {
          await (supabase
            .from('products') as any)
            .update({ quantity: Number(product.quantity) - item.quantity })
            .eq('id', item.product_id);
        }
      }

      setModalOpen(false);
      setSaleItems([]);
      setFormData({
        payment_type: 'cash',
        customer_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Failed to create sale');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const total = saleItems.reduce((sum, item) => sum + item.quantity * item.sale_price, 0);

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer (Optional)</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
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
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a product to add</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.quantity} - ₹{product.selling_price}
                    </option>
                  ))}
                </select>
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
                      {saleItems.map((item) => (
                        <tr key={item.product_id} className="border-t border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{item.product_name}</td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="1"
                              max={item.available_stock}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">₹{item.sale_price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            ₹{(item.quantity * item.sale_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.product_id)}
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
                  className="flex-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
