import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Eye, FileText, Calendar, DollarSign, User, Building, Mail, Phone, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface ClientInvoice {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_enabled: boolean;
  tax_rate: number;
  tax_amount: number;
  discount_enabled: boolean;
  discount_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  due_date?: string;
  created_at: string;
  client_name: string;
  client_email: string;
  client_address?: string;
  client_phone?: string;
  client_business_name?: string;
  payment_gateway_url?: string;
  items: Array<{
    title: string;
    description?: string;
    hours?: number;
    rate: number;
    subtotal: number;
  }>;
  company: {
    business_name: string;
    company_email: string;
    phone: string;
    website?: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    logo?: string;
  };
}

const ClientPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateAccess();
    }
  }, [token]);

  const validateAccess = async () => {
    try {
      // Validate the access token
      const { data: accessData, error: accessError } = await supabase
        .from('client_portal_access')
        .select(`
          *,
          users:user_id(id, name, email)
        `)
        .eq('access_token', token)
        .eq('is_active', true)
        .single();

      if (accessError) {
        setError('Invalid or expired access token');
        setLoading(false);
        return;
      }

      // Check if access has expired
      if (accessData.expires_at && new Date(accessData.expires_at) < new Date()) {
        setError('Your access has expired. Please contact the invoice sender for a new access link.');
        setLoading(false);
        return;
      }

      setAccessInfo(accessData);
      fetchInvoices(accessData.user_id, accessData.client_email);
    } catch (error) {
      console.error('Error validating access:', error);
      setError('Failed to validate access');
      setLoading(false);
    }
  };

  const fetchInvoices = async (userId: string, clientEmail: string) => {
    try {
      // Fetch all invoices for this client
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (invoiceError) throw invoiceError;

      // Fetch company info
      const { data: companyData, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      // Process each invoice to include items
      const processedInvoices = await Promise.all(invoiceData.map(async (invoice) => {
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('order_index');

        if (itemsError) throw itemsError;

        return {
          ...invoice,
          items: itemsData || [],
          company: companyData || {
            business_name: 'Your Business',
            company_email: 'contact@yourbusiness.com',
            phone: '+1 (555) 123-4567',
            address_line_1: '123 Business St',
            city: 'Business City',
            state: 'BC',
            zip_code: '12345',
            country: 'Country',
          }
        };
      }));

      setInvoices(processedInvoices);
      if (processedInvoices.length > 0) {
        setSelectedInvoice(processedInvoices[0]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoice: ClientInvoice) => {
    if (!invoice) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF();
      
      // Add logo if available
      if (invoice.company.logo) {
        try {
          // In a real app, you would handle image loading properly
          // For now, we'll skip this part
          console.log('Would add logo:', invoice.company.logo);
        } catch (logoError) {
          console.error('Error adding logo:', logoError);
        }
      }
      
      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('INVOICE', 20, 30);
      
      // Company Info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(invoice.company.business_name, 20, 50);
      pdf.text(invoice.company.company_email, 20, 60);
      pdf.text(invoice.company.phone, 20, 70);
      
      const companyAddress = [
        invoice.company.address_line_1,
        invoice.company.address_line_2,
        `${invoice.company.city}, ${invoice.company.state} ${invoice.company.zip_code}`,
        invoice.company.country
      ].filter(Boolean).join('\n');
      
      const addressLines = companyAddress.split('\n');
      addressLines.forEach((line, index) => {
        pdf.text(line, 20, 80 + (index * 10));
      });

      // Invoice Details
      pdf.text(`Invoice Number: ${invoice.invoice_number}`, 120, 50);
      pdf.text(`Date: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`, 120, 60);
      if (invoice.due_date) {
        pdf.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM d, yyyy')}`, 120, 70);
      }
      pdf.text(`Status: ${invoice.status.toUpperCase()}`, 120, 80);

      // Client Info
      let yPos = 120;
      pdf.setFontSize(14);
      pdf.text('Bill To:', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(12);
      if (invoice.client_business_name) {
        pdf.text(invoice.client_business_name, 20, yPos);
        yPos += 10;
      }
      pdf.text(invoice.client_name, 20, yPos);
      yPos += 10;
      pdf.text(invoice.client_email, 20, yPos);
      yPos += 10;
      
      if (invoice.client_phone) {
        pdf.text(invoice.client_phone, 20, yPos);
        yPos += 10;
      }
      
      if (invoice.client_address) {
        const clientAddressLines = invoice.client_address.split('\n');
        clientAddressLines.forEach((line) => {
          pdf.text(line, 20, yPos);
          yPos += 10;
        });
      }

      // Items
      yPos += 10;
      pdf.setFontSize(14);
      pdf.text('Items:', 20, yPos);
      yPos += 15;

      pdf.setFontSize(10);
      // Table header
      pdf.text('Description', 20, yPos);
      pdf.text('Hours', 100, yPos);
      pdf.text('Rate', 130, yPos);
      pdf.text('Amount', 160, yPos);
      yPos += 10;

      // Table items
      invoice.items.forEach((item) => {
        pdf.text(item.title, 20, yPos);
        if (item.hours) {
          pdf.text(item.hours.toString(), 100, yPos);
        }
        pdf.text(`${invoice.currency}${item.rate.toFixed(2)}`, 130, yPos);
        pdf.text(`${invoice.currency}${item.subtotal.toFixed(2)}`, 160, yPos);
        yPos += 10;
        
        if (item.description) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(item.description, 20, yPos);
          yPos += 8;
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
        }
      });

      // Totals
      yPos += 10;
      pdf.text(`Subtotal: ${invoice.currency}${invoice.subtotal.toFixed(2)}`, 130, yPos);
      yPos += 10;

      if (invoice.tax_enabled) {
        pdf.text(`Tax (${invoice.tax_rate}%): ${invoice.currency}${invoice.tax_amount.toFixed(2)}`, 130, yPos);
        yPos += 10;
      }

      if (invoice.discount_enabled) {
        pdf.text(`Discount: -${invoice.currency}${invoice.discount_amount.toFixed(2)}`, 130, yPos);
        yPos += 10;
      }

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Total: ${invoice.currency}${invoice.total.toFixed(2)}`, 130, yPos + 5);

      // Notes and Terms
      if (invoice.notes || invoice.terms) {
        yPos += 20;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        if (invoice.notes) {
          pdf.text('Notes:', 20, yPos);
          yPos += 10;
          const noteLines = pdf.splitTextToSize(invoice.notes, 170);
          pdf.text(noteLines, 20, yPos);
          yPos += noteLines.length * 5;
        }
        
        if (invoice.terms) {
          yPos += 5;
          pdf.text('Terms & Conditions:', 20, yPos);
          yPos += 10;
          const termLines = pdf.splitTextToSize(invoice.terms, 170);
          pdf.text(termLines, 20, yPos);
        }
      }

      pdf.save(`${invoice.invoice_number}.pdf`);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

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
      case 'paid': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'sent': return <Clock className="h-4 w-4 mr-1" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 mr-1" />;
      case 'draft': return <FileText className="h-4 w-4 mr-1" />;
      default: return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <FileText className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
          <p className="text-gray-500">There are no invoices available for your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              {accessInfo?.users?.name && (
                <div className="mr-4">
                  {accessInfo.users.logo ? (
                    <img 
                      src={accessInfo.users.logo} 
                      alt={accessInfo.users.name} 
                      className="h-12 w-auto"
                    />
                  ) : (
                    <div className="bg-blue-100 h-12 w-12 rounded-full flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Invoice Portal</h1>
                <p className="text-gray-600">
                  {accessInfo?.users?.name 
                    ? `Welcome to ${accessInfo.users.name}'s invoice portal` 
                    : 'View and download your invoices'}
                </p>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{accessInfo?.client_email}</span>
                </div>
                {accessInfo?.expires_at && (
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Access expires: {format(new Date(accessInfo.expires_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Your Invoices</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {invoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedInvoice?.id === invoice.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{invoice.currency}{invoice.total.toFixed(2)}</div>
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 capitalize whitespace-nowrap ${getStatusColor(invoice.status)}">
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="lg:col-span-2">
            {selectedInvoice ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Invoice {selectedInvoice.invoice_number}</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusIcon(selectedInvoice.status)}
                      {selectedInvoice.status}
                    </span>
                    <button
                      onClick={() => downloadPDF(selectedInvoice)}
                      disabled={downloading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {downloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Invoice Date</p>
                        <p className="font-medium">{format(new Date(selectedInvoice.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {selectedInvoice.due_date && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-medium">{format(new Date(selectedInvoice.due_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="font-medium text-lg">{selectedInvoice.currency}{selectedInvoice.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* From/To */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        From
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{selectedInvoice.company.business_name}</p>
                        <p>{selectedInvoice.company.company_email}</p>
                        <p>{selectedInvoice.company.phone}</p>
                        <p>{selectedInvoice.company.address_line_1}</p>
                        {selectedInvoice.company.address_line_2 && <p>{selectedInvoice.company.address_line_2}</p>}
                        <p>{selectedInvoice.company.city}, {selectedInvoice.company.state} {selectedInvoice.company.zip_code}</p>
                        <p>{selectedInvoice.company.country}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        To
                      </h3>
                      <div className="space-y-1 text-sm">
                        {selectedInvoice.client_business_name && <p className="font-medium">{selectedInvoice.client_business_name}</p>}
                        <p className="font-medium">{selectedInvoice.client_name}</p>
                        <p>{selectedInvoice.client_email}</p>
                        {selectedInvoice.client_phone && <p>{selectedInvoice.client_phone}</p>}
                        {selectedInvoice.client_address && (
                          <div>
                            {selectedInvoice.client_address.split('\n').map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice Items</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            {selectedInvoice.items.some(item => item.hours) && (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedInvoice.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                )}
                              </td>
                              {selectedInvoice.items.some(item => item.hours) && (
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.hours || '-'}
                                </td>
                              )}
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {selectedInvoice.currency}{item.rate.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {selectedInvoice.currency}{item.subtotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div>
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">{selectedInvoice.currency}{selectedInvoice.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {selectedInvoice.tax_enabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax ({selectedInvoice.tax_rate}%):</span>
                            <span className="font-medium">{selectedInvoice.currency}{selectedInvoice.tax_amount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {selectedInvoice.discount_enabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium text-red-600">-{selectedInvoice.currency}{selectedInvoice.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-lg font-semibold text-gray-900">Total:</span>
                            <span className="text-lg font-bold text-blue-600">{selectedInvoice.currency}{selectedInvoice.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment */}
                  {selectedInvoice.payment_gateway_url && selectedInvoice.status !== 'paid' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Make Payment</h3>
                      <p className="text-blue-700 mb-4">Click the button below to pay this invoice securely.</p>
                      <a
                        href={selectedInvoice.payment_gateway_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Pay {selectedInvoice.currency}{selectedInvoice.total.toFixed(2)}
                      </a>
                    </div>
                  )}

                  {/* Notes and Terms */}
                  {(selectedInvoice.notes || selectedInvoice.terms) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedInvoice.notes && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                        </div>
                      )}
                      
                      {selectedInvoice.terms && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions</h3>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedInvoice.terms}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Invoice</h3>
                <p className="text-gray-500">Choose an invoice from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;