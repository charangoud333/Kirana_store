import { useState, FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/LoadingSkeleton';

interface Purchase {
  id: string;
  product_name: string;
  supplier_name: string | null;
  quantity: number;
  cost_price: number;
  total_amount: number;
  invoice_number: string | null;
  purchase_date: string;
  notes: string | null;
}

export const PurchasesNew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    supplier_name: '',
    quantity: 1,
    cost_price: 0,
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchase_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Purchase[];
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First, look up the product by name
      const { data: product, error: productError } = await (supabase
        .from('products') as any)
        .select('id, quantity')
        .ilike('name', data.product_name)
        .maybeSingle();

      if (productError) throw productError;

      if (!product) {
        throw new Error(`Product "${data.product_name}" not found. Please add it first.`);
      }

      // Look up supplier by name if provided
      let supplierId = null;
      if (data.supplier_name && data.supplier_name.trim()) {
        const { data: supplier } = await (supabase
          .from('suppliers') as any)
          .select('id')
          .ilike('name', data.supplier_name)
          .maybeSingle();
        
        supplierId = supplier?.id || null;
      }

      const totalAmount = data.quantity * data.cost_price;

      // Insert purchase record with valid product_id
      const { error: purchaseError } = await (supabase
        .from('purchases') as any)
        .insert({
          product_id: product.id,
          product_name: data.product_name,
          supplier_id: supplierId,
          quantity: data.quantity,
          cost_price: data.cost_price,
          total_amount: totalAmount,
          invoice_number: data.invoice_number || null,
          purchase_date: data.purchase_date,
          notes: data.notes || null,
          created_by: user?.id,
        });

      if (purchaseError) throw purchaseError;

      // Update product stock and buying price
      await (supabase
        .from('products') as any)
        .update({ 
          quantity: product.quantity + data.quantity,
          buying_price: data.cost_price
        })
        .eq('id', product.id);

      return { product_name: data.product_name, quantity: data.quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Purchase recorded successfully!');
      
      setFormData({
        product_name: '',
        supplier_name: '',
        quantity: 1,
        cost_price: 0,
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record purchase');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_name.trim()) {
      toast.error('Please enter product name');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    if (formData.cost_price < 0) {
      toast.error('Cost price cannot be negative');
      return;
    }

    purchaseMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <TableSkeleton rows={8} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-500 mt-1">Record inventory purchases from suppliers</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Purchase
        </button>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Supplier</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cost Price</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{purchase.product_name}</td>
                  <td className="py-3 px-4 text-gray-600">{purchase.supplier_name || '-'}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{purchase.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ₹{Number(purchase.cost_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    ₹{Number(purchase.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                    {purchase.invoice_number || '-'}
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No purchases recorded yet. Click "New Purchase" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Purchase</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Type product name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Stock will auto-update if product exists</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    placeholder="Type supplier name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes about this purchase"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    ₹{(formData.quantity * formData.cost_price).toFixed(2)}
                  </span>
                </div>
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
                  disabled={purchaseMutation.isPending}
                  className="flex-1 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                >
                  {purchaseMutation.isPending ? 'Recording...' : 'Record Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
