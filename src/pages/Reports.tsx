import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    salesByDay: [] as any[],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const salesRes = (await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .gte('sale_date', dateRange.start)
        .lte('sale_date', dateRange.end)) as { data: { total_amount: number; sale_date: string }[] | null };
      
      const purchasesRes = (await supabase
        .from('purchases')
        .select('total_amount')
        .gte('purchase_date', dateRange.start)
        .lte('purchase_date', dateRange.end)) as { data: { total_amount: number }[] | null };
      
      const expensesRes = (await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', dateRange.start)
        .lte('expense_date', dateRange.end)) as { data: { amount: number }[] | null };

      const totalSales = salesRes.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalPurchases = purchasesRes.data?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
      const totalExpenses = expensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const salesByDate = salesRes.data?.reduce((acc: any, sale) => {
        const date = sale.sale_date;
        if (!acc[date]) acc[date] = 0;
        acc[date] += Number(sale.total_amount);
        return acc;
      }, {});

      const salesByDay = Object.entries(salesByDate || {}).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        sales: amount,
      }));

      setReportData({
        totalSales,
        totalPurchases,
        totalExpenses,
        netProfit: totalSales - totalPurchases - totalExpenses,
        salesByDay,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">View business performance and insights</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">₹{reportData.totalSales.toFixed(2)}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-gray-900">₹{reportData.totalPurchases.toFixed(2)}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">₹{reportData.totalExpenses.toFixed(2)}</p>
          </div>

          <div className={`${reportData.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'} rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className={`w-8 h-8 ${reportData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{reportData.netProfit.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.salesByDay}>
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
              <Bar dataKey="sales" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue (Sales)</span>
              <span className="font-semibold text-green-600">+₹{reportData.totalSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cost of Goods (Purchases)</span>
              <span className="font-semibold text-red-600">-₹{reportData.totalPurchases.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operating Expenses</span>
              <span className="font-semibold text-red-600">-₹{reportData.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
              <span className="text-gray-900 font-semibold text-lg">Net Profit/Loss</span>
              <span
                className={`font-bold text-xl ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                ₹{reportData.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
