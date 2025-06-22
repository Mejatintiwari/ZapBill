import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Eye, Edit, Trash2, Send, Download, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { sendInvoiceEmail, generateInvoiceEmailTemplate } from '../lib/emailService';
import type { Invoice } from '../types';

const InvoicesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status } : inv
      ));
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const sendInvoiceByEmail = async (invoice: Invoice) => {
    try {
      // Fetch company info
      const { data: companyInfo, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      const emailTemplate = generateInvoiceEmailTemplate(
        invoice.invoice_number,
        invoice.client_name,
        invoice.total.toFixed(2),
        invoice.currency,
        companyInfo?.business_name || profile?.name || 'Your Business',
        companyInfo?.company_email || '',
        companyInfo?.phone || '',
        paymentMethods
      );

      const emailSent = await sendInvoiceEmail({
        to: invoice.client_email,
        subject: `Invoice ${invoice.invoice_number} from ${companyInfo?.business_name || profile?.name || 'Your Business'}`,
        html: emailTemplate,
      }, profile);

      if (emailSent) {
        // Update invoice status to sent
        await updateInvoiceStatus(invoice.id, 'sent');
        toast.success('Invoice sent successfully!');
      } else {
        toast.error('Failed to send invoice email');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Fetch invoice items
      const { data: items, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('order_index');

      if (error) throw error;

      // Fetch company info
      const { data: companyInfo, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Create PDF content
      const pdf = new jsPDF();
      
      // Add invoice content
      pdf.setFontSize(20);
      pdf.text('INVOICE', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Invoice Number: ${invoice.invoice_number}`, 20, 50);
      pdf.text(`Date: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`, 20, 60);
      
      // Company info
      if (companyInfo) {
        pdf.text(`From: ${companyInfo.business_name}`, 20, 70);
        pdf.text(`Email: ${companyInfo.company_email}`, 20, 80);
        pdf.text(`Phone: ${companyInfo.phone}`, 20, 90);
        pdf.text(`Address: ${companyInfo.address_line_1}, ${companyInfo.city}, ${companyInfo.state}`, 20, 100);
      } else {
        pdf.text(`From: ${profile?.name || 'Your Business'}`, 20, 70);
      }
      
      // Client info
      pdf.text(`To: ${invoice.client_business_name || invoice.client_name}`, 120, 70);
      pdf.text(`Email: ${invoice.client_email}`, 120, 80);
      if (invoice.client_phone) {
        pdf.text(`Phone: ${invoice.client_phone}`, 120, 90);
      }
      if (invoice.client_address) {
        pdf.text(`Address: ${invoice.client_address}`, 120, 100);
      }

      // Add items
      let yPosition = 120;
      pdf.text('Items:', 20, yPosition);
      yPosition += 10;

      items?.forEach((item, index) => {
        pdf.text(`${index + 1}. ${item.title} - ${invoice.currency}${item.subtotal.toFixed(2)}`, 25, yPosition);
        yPosition += 10;
        
        if (item.description) {
          pdf.setFontSize(10);
          pdf.text(`   ${item.description}`, 25, yPosition);
          yPosition += 10;
          pdf.setFontSize(12);
        }
      });

      // Add totals
      yPosition += 10;
      pdf.text(`Subtotal: ${invoice.currency}${invoice.subtotal.toFixed(2)}`, 20, yPosition);
      yPosition += 10;

      if (invoice.tax_enabled) {
        pdf.text(`Tax (${invoice.tax_rate}%): ${invoice.currency}${invoice.tax_amount.toFixed(2)}`, 20, yPosition);
        yPosition += 10;
      }

      if (invoice.discount_enabled) {
        pdf.text(`Discount: -${invoice.currency}${invoice.discount_amount.toFixed(2)}`, 20, yPosition);
        yPosition += 10;
      }

      pdf.setFontSize(14);
      pdf.text(`Total: ${invoice.currency}${invoice.total.toFixed(2)}`, 20, yPosition + 10);

      // Add notes and terms if available
      if (invoice.notes || invoice.terms) {
        yPosition += 30;
        
        if (invoice.notes) {
          pdf.setFontSize(12);
          pdf.text('Notes:', 20, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const noteLines = pdf.splitTextToSize(invoice.notes, 170);
          pdf.text(noteLines, 20, yPosition);
          yPosition += (noteLines.length * 5) + 10;
        }
        
        if (invoice.terms) {
          pdf.setFontSize(12);
          pdf.text('Terms & Conditions:', 20, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const termLines = pdf.splitTextToSize(invoice.terms, 170);
          pdf.text(termLines, 20, yPosition);
        }
      }

      // Add payment methods if available
      if (paymentMethods.length > 0) {
        yPosition += 30;
        pdf.setFontSize(12);
        pdf.text('Payment Methods:', 20, yPosition);
        yPosition += 10;
        
        paymentMethods.forEach((method, index) => {
          pdf.setFontSize(10);
          pdf.text(`${index + 1}. ${method.name}`, 20, yPosition);
          yPosition += 5;
          
          switch (method.type) {
            case 'upi':
              pdf.text(`   UPI ID: ${method.details.upi_id}`, 20, yPosition);
              break;
            case 'bank':
              pdf.text(`   Bank: ${method.details.bank_name}`, 20, yPosition);
              yPosition += 5;
              pdf.text(`   Account: ${method.details.account_number}`, 20, yPosition);
              break;
            case 'crypto':
              pdf.text(`   ${method.details.currency}: ${method.details.wallet_address}`, 20, yPosition);
              break;
          }
          
          yPosition += 10;
        });
      }

      // Save PDF
      pdf.save(`${invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const exportUserData = () => {
    try {
      const data = {
        invoices: invoices,
        exportDate: new Date().toISOString(),
        user: {
          name: profile?.name,
          email: user?.email,
        }
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.client_business_name && invoice.client_business_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'overdue': return <Clock className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage your invoices and track payments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportUserData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <Link
            to="/invoices/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </div>
                          {invoice.payment_gateway_url && (
                            <div className="text-xs text-blue-600">Payment Link Available</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.client_business_name || invoice.client_name}
                      </div>
                      <div className="text-sm text-gray-500">{invoice.client_email}</div>
                      {invoice.client_phone && (
                        <div className="text-xs text-gray-500">{invoice.client_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.currency}{invoice.total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </span>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, invoice.status === 'paid' ? 'sent' : 'paid')}
                            className="ml-2 p-1 text-green-600 hover:text-green-800"
                            title="Mark as Paid"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => sendInvoiceByEmail(invoice)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Send Invoice"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadInvoicePDF(invoice)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/invoices/${invoice.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first invoice'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/invoices/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;