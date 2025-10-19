import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  quantity: number;
  buying_price: number;
  selling_price: number;
  supplier_name: string | null;
  reorder_level: number;
  expiry_date: string | null;
  sku: string | null;
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

const schema = yup.object({
  name: yup.string().required('Product name is required').min(2, 'Name must be at least 2 characters'),
  category: yup.string().nullable().default(null),
  brand: yup.string().nullable().default(null),
  unit: yup.string().required('Unit is required'),
  quantity: yup.number().required('Quantity is required').min(0, 'Quantity cannot be negative'),
  buying_price: yup.number().required('Buying price is required').min(0, 'Price cannot be negative'),
  selling_price: yup.number().required('Selling price is required').min(0, 'Price cannot be negative')
    .test('is-greater', 'Selling price should be greater than buying price', function(value) {
      const { buying_price } = this.parent;
      return !value || !buying_price || value >= buying_price;
    }),
  supplier_name: yup.string().nullable().default(null),
  reorder_level: yup.number().min(0, 'Cannot be negative').required('Reorder level is required'),
  expiry_date: yup.string().nullable().default(null),
  sku: yup.string().nullable().default(null),
}).required();

type FormData = yup.InferType<typeof schema>;

export const ProductModalNew = ({ product, onClose }: ProductModalProps) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: product?.name || '',
      category: product?.category || '',
      brand: product?.brand || '',
      unit: product?.unit || 'piece',
      quantity: product?.quantity || 0,
      buying_price: product?.buying_price || 0,
      selling_price: product?.selling_price || 0,
      supplier_name: product?.supplier_name || '',
      reorder_level: product?.reorder_level || 10,
      expiry_date: product?.expiry_date || '',
      sku: product?.sku || '',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category || '',
        brand: product.brand || '',
        unit: product.unit,
        quantity: product.quantity,
        buying_price: product.buying_price,
        selling_price: product.selling_price,
        supplier_name: product.supplier_name || '',
        reorder_level: product.reorder_level,
        expiry_date: product.expiry_date || '',
        sku: product.sku || '',
      });
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        category: data.category || null,
        brand: data.brand || null,
        unit: data.unit,
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        supplier_name: data.supplier_name || null,
        reorder_level: data.reorder_level,
        expiry_date: data.expiry_date || null,
        sku: data.sku || null,
      };

      if (product) {
        const { error } = await (supabase
          .from('products') as any)
          .update(payload)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('products') as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated successfully!' : 'Product added successfully!');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save product');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                {...register('sku')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Product code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                {...register('category')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Groceries, Snacks"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input
                {...register('brand')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                {...register('unit')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="liter">Liter (L)</option>
                <option value="ml">Milliliter (mL)</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buying Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('buying_price', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.buying_price && (
                <p className="mt-1 text-sm text-red-600">{errors.buying_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('selling_price', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.selling_price && (
                <p className="mt-1 text-sm text-red-600">{errors.selling_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
              <input
                {...register('supplier_name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
              <input
                type="number"
                {...register('reorder_level', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Alert when stock below this"
              />
              {errors.reorder_level && (
                <p className="mt-1 text-sm text-red-600">{errors.reorder_level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                {...register('expiry_date')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
