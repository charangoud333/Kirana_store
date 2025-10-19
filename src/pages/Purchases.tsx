import { useEffect, useState, FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Purchase {
  id: string;
  product_id: string;
  supplier_id: string | null;
  quantity: number;
  cost_price: number;
  total_amount: number;
  invoice_number: string | null;
  purchase_date: string;
  notes: string | null;
  products: { name: string };
  suppliers: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  buying_price: number;
}

interface Supplier {
  id: string;
  name: string;
}

export const Purchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    supplier_id: '',
    quantity: 1,
    cost_price: 0,
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          products (name),
          suppliers (name)
        `)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, buying_price')
      .order('name');
    setProducts(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name');
    setSuppliers(data || []);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      cost_price: product?.buying_price || 0,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.product_id) {
      alert('Please select a product');
      return;
    }

    try {
      const totalAmount = formData.quantity * formData.cost_price;

      const { error: purchaseError } = await (supabase.from('purchases') as any).insert({
        product_id: formData.product_id,
        supplier_id: formData.supplier_id || null,
        quantity: formData.quantity,
        cost_price: formData.cost_price,
        total_amount: totalAmount,
        invoice_number: formData.invoice_number || null,
        purchase_date: formData.purchase_date,
        notes: formData.notes || null,
        created_by: user?.id,
      });

      if (purchaseError) throw purchaseError;

      const { error: updateError } = await (supabase as any).rpc('increment', {
        table_name: 'products',
        row_id: formData.product_id,
        column_name: 'quantity',
        increment_value: formData.quantity,
      });

      if (updateError) {
        const { data: product } = (await supabase
          .from('products')
          .select('quantity')
          .eq('id', formData.product_id)
          .single()) as { data: { quantity: number } | null };

        if (product) {
          await (supabase
            .from('products') as any)
            .update({ quantity: Number(product.quantity) + formData.quantity })
            .eq('id', formData.product_id);
        }
      }

      setModalOpen(false);
      setFormData({
        product_id: '',
        supplier_id: '',
        quantity: 1,
        cost_price: 0,
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchPurchases();
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('Failed to add purchase');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalAmount = formData.quantity * formData.cost_price;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Entry</h1>
          <p className="text-gray-500 mt-1">Record new stock purchases</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Add Purchase
        </button>
      </div>

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
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No purchases recorded yet
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{purchase.products.name}</td>
                    <td className="py-3 px-4 text-gray-600">{purchase.suppliers?.name || '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{purchase.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-900">₹{Number(purchase.cost_price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ₹{Number(purchase.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{purchase.invoice_number || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Purchase</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
