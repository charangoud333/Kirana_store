import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Package,
  Receipt,
  Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  todaySales: number;
  todayPurchases: number;
  todayProfit: number;
  lowStockCount: number;
}

interface RecentTransaction {
  id: string;
  type: 'sale' | 'purchase';
  amount: number;
  date: string;
}

interface SalesData {
  date: string;
  sales: number;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayPurchases: 0,
    todayProfit: 0,
    lowStockCount: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: salesToday } = (await supabase
        .from('sales')
        .select('total_amount')
        .eq('sale_date', today)) as { data: { total_amount: number }[] | null };

      const { data: purchasesToday } = (await supabase
        .from('purchases')
        .select('total_amount')
        .eq('purchase_date', today)) as { data: { total_amount: number }[] | null };

      const { data: expensesToday } = (await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today)) as { data: { amount: number }[] | null };

      const { data: allProducts } = (await supabase
        .from('products')
        .select('id, quantity, reorder_level')) as { data: { id: string; quantity: number; reorder_level: number }[] | null };
      
      const lowStock = allProducts?.filter(p => p.quantity < p.reorder_level) || [];

      const totalSales = salesToday?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalPurchases = purchasesToday?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
      const totalExpenses = expensesToday?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        todaySales: totalSales,
        todayPurchases: totalPurchases,
        todayProfit: totalSales - totalPurchases - totalExpenses,
        lowStockCount: lowStock?.length || 0,
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const { data: salesLast7Days } = (await supabase
        .from('sales')
        .select('sale_date, total_amount')
        .gte('sale_date', last7Days[0])) as { data: { sale_date: string; total_amount: number }[] | null };

      const salesByDate = last7Days.map((date) => ({
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        sales: salesLast7Days
          ?.filter((s) => s.sale_date === date)
          .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
      }));

      setSalesData(salesByDate);

      const { data: recentSales } = (await supabase
        .from('sales')
        .select('id, total_amount, sale_date')
        .order('created_at', { ascending: false })
        .limit(5)) as { data: { id: string; total_amount: number; sale_date: string }[] | null };

      const { data: recentPurchases } = (await supabase
        .from('purchases')
        .select('id, total_amount, purchase_date')
        .order('created_at', { ascending: false })
        .limit(5)) as { data: { id: string; total_amount: number; purchase_date: string }[] | null };

      const transactions: RecentTransaction[] = [
        ...(recentSales?.map((s) => ({
          id: s.id,
          type: 'sale' as const,
          amount: Number(s.total_amount),
          date: s.sale_date,
        })) || []),
        ...(recentPurchases?.map((p) => ({
          id: p.id,
          type: 'purchase' as const,
          amount: Number(p.total_amount),
          date: p.purchase_date,
        })) || []),
      ];

      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTransactions(transactions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Today\'s Sales',
      value: `₹${stats.todaySales.toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: '+12%',
    },
    {
      title: 'Today\'s Purchases',
      value: `₹${stats.todayPurchases.toFixed(2)}`,
      icon: TrendingDown,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: '+8%',
    },
    {
      title: 'Today\'s Profit',
      value: `₹${stats.todayProfit.toFixed(2)}`,
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: stats.todayProfit >= 0 ? '+' : '',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      change: 'Action needed',
    },
  ];

  const quickActions = [
    { label: 'Add Sale', icon: ShoppingCart, path: '/sales', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Add Purchase', icon: Package, path: '/purchases', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Add Expense', icon: Receipt, path: '/expenses', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'Add Product', icon: Plus, path: '/products', color: 'bg-gray-600 hover:bg-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 transition`}
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No recent transactions</p>
            ) : (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        txn.type === 'sale' ? 'bg-green-100' : 'bg-orange-100'
                      }`}
                    >
                      {txn.type === 'sale' ? (
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      ) : (
                        <Package className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{txn.type}</p>
                      <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${txn.type === 'sale' ? 'text-green-600' : 'text-orange-600'}`}>
                    {txn.type === 'sale' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <h3 className="text-center text-gray-500">made with ❤️ by charan</h3>
    </div>
  );
};
