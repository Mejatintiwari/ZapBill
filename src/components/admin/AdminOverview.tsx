import React from 'react';
import { Users, FileText, DollarSign, Activity, MessageSquare, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  totalInvoices: number;
  totalRevenue: number;
  activeUsers: number;
  supportTickets: number;
  feedbackSubmissions: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  users: { name: string };
}

interface SupportTicket {
  id: string;
  subject: string;
  name: string;
  status: string;
}

interface AdminOverviewProps {
  stats: AdminStats;
  recentInvoices: Invoice[];
  recentTickets: SupportTicket[];
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ stats, recentInvoices, recentTickets }) => {
  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
    { name: 'Total Invoices', value: stats.totalInvoices, icon: FileText, color: 'green' },
    { name: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'purple' },
    { name: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'yellow' },
    { name: 'Support Tickets', value: stats.supportTickets, icon: MessageSquare, color: 'red' },
    { name: 'Feedback', value: stats.feedbackSubmissions, icon: Mail, color: 'indigo' },
  ];

  const getStatColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'yellow': return 'bg-yellow-100 text-yellow-600';
      case 'red': return 'bg-red-100 text-red-600';
      case 'indigo': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'resolved': return 'bg-green-100 text-green-800';
      case 'sent': case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': case 'urgent': return 'bg-red-100 text-red-800';
      case 'draft': case 'open': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${getStatColor(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-4">
            {recentInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-xs text-gray-500">{invoice.users?.name || 'Unknown User'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{invoice.total?.toLocaleString() || 0}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
            {recentInvoices.length === 0 && (
              <p className="text-gray-500 text-center py-4">No invoices found</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Support Tickets</h3>
          <div className="space-y-4">
            {recentTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">{ticket.name}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <p className="text-gray-500 text-center py-4">No support tickets found</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Activity Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Sample activity logs - in a real app, these would come from the database */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User login</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Admin User</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(), 'MMM d, yyyy HH:mm')}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Updated user plan</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">user@example.com</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(Date.now() - 3600000), 'MMM d, yyyy HH:mm')}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Exported user data</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">All users</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(Date.now() - 86400000), 'MMM d, yyyy HH:mm')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;