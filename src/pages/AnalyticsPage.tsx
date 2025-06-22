import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, FileText, Users, Calendar, Download } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';

interface AnalyticsData {
  totalRevenue: number;
  totalInvoices: number;
  totalClients: number;
  averageInvoiceValue: number;
  monthlyRevenue: Array<{ month: string; revenue: number; invoices: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  topClients: Array<{ name: string; revenue: number; invoices: number }>;
  revenueGrowth: number;
  invoiceGrowth: number;
}

const AnalyticsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    try {
      const months = dateRange === '12months' ? 12 : 6;
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate basic metrics
      const totalRevenue = invoices?.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0) || 0;
      const totalInvoices = invoices?.length || 0;
      const uniqueClients = new Set(invoices?.map(inv => inv.client_email)).size;
      const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // Monthly revenue data
      const monthlyData = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(monthStart);
        
        const monthInvoices = invoices?.filter(inv => {
          const invoiceDate = new Date(inv.created_at);
          return invoiceDate >= monthStart && invoiceDate <= monthEnd;
        }) || [];

        const monthRevenue = monthInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.total, 0);

        monthlyData.push({
          month: format(monthStart, 'MMM yyyy'),
          revenue: monthRevenue,
          invoices: monthInvoices.length,
        });
      }

      // Status distribution
      const statusCounts = invoices?.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusDistribution = [
        { name: 'Paid', value: statusCounts.paid || 0, color: '#10B981' },
        { name: 'Sent', value: statusCounts.sent || 0, color: '#3B82F6' },
        { name: 'Draft', value: statusCounts.draft || 0, color: '#6B7280' },
        { name: 'Overdue', value: statusCounts.overdue || 0, color: '#EF4444' },
      ];

      // Top clients
      const clientRevenue = invoices?.reduce((acc, inv) => {
        if (inv.status === 'paid') {
          if (!acc[inv.client_email]) {
            acc[inv.client_email] = { name: inv.client_name, revenue: 0, invoices: 0 };
          }
          acc[inv.client_email].revenue += inv.total;
          acc[inv.client_email].invoices += 1;
        }
        return acc;
      }, {} as Record<string, { name: string; revenue: number; invoices: number }>) || {};

      const topClients = Object.values(clientRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Growth calculations (comparing last month to previous month)
      const lastMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      
      const revenueGrowth = previousMonth && previousMonth.revenue > 0 
        ? ((lastMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
        : 0;
      
      const invoiceGrowth = previousMonth && previousMonth.invoices > 0 
        ? ((lastMonth.invoices - previousMonth.invoices) / previousMonth.invoices) * 100 
        : 0;

      setAnalytics({
        totalRevenue,
        totalInvoices,
        totalClients: uniqueClients,
        averageInvoiceValue,
        monthlyRevenue: monthlyData,
        statusDistribution,
        topClients,
        revenueGrowth,
        invoiceGrowth,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!analytics) return;
    
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('Analytics Report', 20, 30);
    
    // Add date
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${format(new Date(), 'MMM d, yyyy')}`, 20, 45);
    pdf.text(`Business: ${profile?.name || 'Your Business'}`, 20, 55);
    
    // Add summary stats
    pdf.setFontSize(16);
    pdf.text('Summary', 20, 75);
    
    pdf.setFontSize(12);
    let yPosition = 90;
    
    const stats = [
      `Total Revenue: $${analytics.totalRevenue.toLocaleString()}`,
      `Total Invoices: ${analytics.totalInvoices}`,
      `Total Clients: ${analytics.totalClients}`,
      `Average Invoice Value: $${analytics.averageInvoiceValue.toLocaleString()}`,
      `Revenue Growth: ${analytics.revenueGrowth.toFixed(1)}%`,
      `Invoice Growth: ${analytics.invoiceGrowth.toFixed(1)}%`,
    ];
    
    stats.forEach(stat => {
      pdf.text(stat, 20, yPosition);
      yPosition += 10;
    });
    
    // Add monthly revenue data
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.text('Monthly Revenue', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    analytics.monthlyRevenue.forEach(month => {
      pdf.text(`${month.month}: $${month.revenue.toLocaleString()} (${month.invoices} invoices)`, 20, yPosition);
      yPosition += 10;
    });
    
    // Add top clients
    if (analytics.topClients.length > 0) {
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.text('Top Clients', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      analytics.topClients.forEach((client, index) => {
        pdf.text(`${index + 1}. ${client.name}: $${client.revenue.toLocaleString()} (${client.invoices} invoices)`, 20, yPosition);
        yPosition += 10;
      });
    }
    
    // Save PDF
    pdf.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportData = () => {
    if (!analytics) return;
    
    const data = {
      summary: {
        totalRevenue: analytics.totalRevenue,
        totalInvoices: analytics.totalInvoices,
        totalClients: analytics.totalClients,
        averageInvoiceValue: analytics.averageInvoiceValue,
      },
      monthlyRevenue: analytics.monthlyRevenue,
      statusDistribution: analytics.statusDistribution,
      topClients: analytics.topClients,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-500">Create some invoices to see analytics</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Revenue',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      growth: analytics.revenueGrowth,
    },
    {
      name: 'Total Invoices',
      value: analytics.totalInvoices.toLocaleString(),
      icon: FileText,
      color: 'blue',
      growth: analytics.invoiceGrowth,
    },
    {
      name: 'Total Clients',
      value: analytics.totalClients.toLocaleString(),
      icon: Users,
      color: 'purple',
    },
    {
      name: 'Avg Invoice Value',
      value: `$${analytics.averageInvoiceValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'yellow',
    },
  ];

  const getStatColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-600';
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'yellow': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your business performance and growth</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${getStatColor(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.growth !== undefined && (
                    <p className={`text-sm ${stat.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.growth >= 0 ? '+' : ''}{stat.growth.toFixed(1)}% from last month
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Count Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Count</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="invoices" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clients */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h2>
          <div className="space-y-4">
            {analytics.topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.invoices} invoices</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${client.revenue.toLocaleString()}</p>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(client.revenue / analytics.topClients[0]?.revenue) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {analytics.topClients.length === 0 && (
              <p className="text-gray-500 text-center py-8">No paid invoices yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;