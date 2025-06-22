import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, Plus, Trash2, GripVertical, Users, CreditCard, Smartphone, Bitcoin, Link as LinkIcon, Settings } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCIES, Client } from '../types';
import { sendInvoiceEmail, generateInvoiceEmailTemplate } from '../lib/emailService';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  hours: number;
  rate: number;
  subtotal: number;
}

interface InvoiceData {
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  client_business_name: string;
  currency: string;
  items: InvoiceItem[];
  tax_enabled: boolean;
  tax_rate: number;
  discount_enabled: boolean;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  notes: string;
  terms: string;
  estimated_completion: string;
  due_date: string;
  hours_enabled: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank' | 'crypto' | 'payment_link' | 'custom';
  name: string;
  details: Record<string, any>;
  is_active: boolean;
}

const CreateInvoice: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    business_name: '',
    phone: '',
    address: '',
  });

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoice_number: `INV-${Date.now()}`,
    client_name: '',
    client_email: '',
    client_address: '',
    client_phone: '',
    client_business_name: '',
    currency: profile?.default_currency || 'USD',
    items: [
      {
        id: '1',
        title: '',
        description: '',
        hours: 1,
        rate: 0,
        subtotal: 0,
      },
    ],
    tax_enabled: false,
    tax_rate: profile?.default_tax_rate || 0,
    discount_enabled: false,
    discount_type: 'flat',
    discount_value: profile?.default_discount || 0,
    notes: '',
    terms: '',
    estimated_completion: '',
    due_date: '',
    hours_enabled: true,
  });

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchPaymentMethods();
      fetchCompanyInfo();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
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
      toast.error('Failed to fetch payment methods');
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCompanyInfo(data);
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const addClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.business_name || !newClient.phone) {
      toast.error('Name, email, business name, and phone are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user!.id,
          name: newClient.name,
          email: newClient.email,
          business_name: newClient.business_name,
          phone: newClient.phone,
          address: newClient.address,
        })
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
      
      setInvoiceData(prev => ({
        ...prev,
        client_name: data.name,
        client_email: data.email,
        client_address: data.address || '',
        client_phone: data.phone,
        client_business_name: data.business_name,
      }));

      setNewClient({
        name: '',
        email: '',
        business_name: '',
        phone: '',
        address: '',
      });
      setShowAddClientModal(false);
      toast.success('Client added successfully');
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    }
  };

  const selectClient = (client: Client) => {
    setInvoiceData(prev => ({
      ...prev,
      client_name: client.name,
      client_email: client.email,
      client_address: client.address || '',
      client_phone: client.phone,
      client_business_name: client.business_name,
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      hours: 1,
      rate: 0,
      subtotal: 0,
    };
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    if (invoiceData.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'hours' || field === 'rate') {
            if (invoiceData.hours_enabled) {
              updatedItem.subtotal = (updatedItem.hours || 1) * updatedItem.rate;
            } else {
              updatedItem.subtotal = updatedItem.rate;
            }
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(invoiceData.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setInvoiceData(prev => ({ ...prev, items }));
  };

  const calculateTotals = () => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = invoiceData.tax_enabled ? (subtotal * invoiceData.tax_rate) / 100 : 0;
    
    let discountAmount = 0;
    if (invoiceData.discount_enabled) {
      if (invoiceData.discount_type === 'percentage') {
        discountAmount = (subtotal * invoiceData.discount_value) / 100;
      } else {
        discountAmount = invoiceData.discount_value;
      }
    }

    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, total };
  };

  const generatePDF = async (invoiceId: string) => {
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals();
    const pdf = new jsPDF();
    
    // Company Header
    pdf.setFontSize(24);
    pdf.setTextColor(59, 130, 246);
    pdf.text('INVOICE', 20, 30);
    
    // Company Information
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const companyName = companyInfo?.business_name || profile?.name || 'Your Business';
    const companyEmail = companyInfo?.company_email || user?.email || '';
    const companyPhone = companyInfo?.phone || '';
    
    pdf.text(companyName, 20, 50);
    if (companyEmail) pdf.text(companyEmail, 20, 60);
    if (companyPhone) pdf.text(companyPhone, 20, 70);
    
    if (companyInfo) {
      let yPos = 80;
      if (companyInfo.address_line_1) {
        pdf.text(companyInfo.address_line_1, 20, yPos);
        yPos += 10;
      }
      if (companyInfo.address_line_2) {
        pdf.text(companyInfo.address_line_2, 20, yPos);
        yPos += 10;
      }
      if (companyInfo.city && companyInfo.state) {
        pdf.text(`${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip_code}`, 20, yPos);
        yPos += 10;
      }
      if (companyInfo.country) {
        pdf.text(companyInfo.country, 20, yPos);
      }
    }

    // Invoice Details (Right side)
    pdf.text(`Invoice #: ${invoiceData.invoice_number}`, 120, 50);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 120, 60);
    if (invoiceData.due_date) {
      pdf.text(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, 120, 70);
    }

    // Client Information
    let clientYPos = 120;
    pdf.setFontSize(14);
    pdf.text('Bill To:', 20, clientYPos);
    clientYPos += 10;
    
    pdf.setFontSize(12);
    if (invoiceData.client_business_name) {
      pdf.text(invoiceData.client_business_name, 20, clientYPos);
      clientYPos += 10;
    }
    pdf.text(invoiceData.client_name, 20, clientYPos);
    clientYPos += 10;
    pdf.text(invoiceData.client_email, 20, clientYPos);
    clientYPos += 10;
    
    if (invoiceData.client_phone) {
      pdf.text(invoiceData.client_phone, 20, clientYPos);
      clientYPos += 10;
    }
    
    if (invoiceData.client_address) {
      const addressLines = invoiceData.client_address.split('\n');
      addressLines.forEach((line) => {
        pdf.text(line, 20, clientYPos);
        clientYPos += 10;
      });
    }

    // Items Table
    let itemsYPos = clientYPos + 20;
    pdf.setFontSize(14);
    pdf.text('Items:', 20, itemsYPos);
    itemsYPos += 15;

    // Table headers
    pdf.setFontSize(10);
    pdf.text('Description', 20, itemsYPos);
    if (invoiceData.hours_enabled) {
      pdf.text('Hours', 100, itemsYPos);
      pdf.text('Rate', 130, itemsYPos);
      pdf.text('Amount', 160, itemsYPos);
    } else {
      pdf.text('Amount', 160, itemsYPos);
    }
    itemsYPos += 10;

    // Table items
    invoiceData.items.forEach((item) => {
      pdf.text(item.title, 20, itemsYPos);
      if (invoiceData.hours_enabled && item.hours) {
        pdf.text(item.hours.toString(), 100, itemsYPos);
        pdf.text(`${invoiceData.currency}${item.rate.toFixed(2)}`, 130, itemsYPos);
      }
      pdf.text(`${invoiceData.currency}${item.subtotal.toFixed(2)}`, 160, itemsYPos);
      itemsYPos += 10;
      
      if (item.description) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(item.description, 20, itemsYPos);
        itemsYPos += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
      }
    });

    // Totals
    itemsYPos += 10;
    pdf.text(`Subtotal: ${invoiceData.currency}${subtotal.toFixed(2)}`, 130, itemsYPos);
    itemsYPos += 10;

    if (invoiceData.tax_enabled) {
      pdf.text(`Tax (${invoiceData.tax_rate}%): ${invoiceData.currency}${taxAmount.toFixed(2)}`, 130, itemsYPos);
      itemsYPos += 10;
    }

    if (invoiceData.discount_enabled) {
      pdf.text(`Discount: -${invoiceData.currency}${discountAmount.toFixed(2)}`, 130, itemsYPos);
      itemsYPos += 10;
    }

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Total: ${invoiceData.currency}${total.toFixed(2)}`, 130, itemsYPos + 5);

    // Payment Methods
    const selectedMethods = paymentMethods.filter(method => 
      selectedPaymentMethods.includes(method.id)
    );

    if (selectedMethods.length > 0) {
      itemsYPos += 25;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Payment Methods:', 20, itemsYPos);
      itemsYPos += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      selectedMethods.forEach((method) => {
        pdf.setFont(undefined, 'bold');
        pdf.text(`${method.name}:`, 20, itemsYPos);
        pdf.setFont(undefined, 'normal');
        itemsYPos += 8;

        switch (method.type) {
          case 'upi':
            pdf.text(`UPI ID: ${method.details.upi_id}`, 25, itemsYPos);
            if (method.details.merchant_name) {
              itemsYPos += 6;
              pdf.text(`Merchant: ${method.details.merchant_name}`, 25, itemsYPos);
            }
            break;
          case 'bank':
            pdf.text(`Account: ${method.details.account_number}`, 25, itemsYPos);
            itemsYPos += 6;
            pdf.text(`Bank: ${method.details.bank_name}`, 25, itemsYPos);
            itemsYPos += 6;
            pdf.text(`IFSC: ${method.details.ifsc_code}`, 25, itemsYPos);
            break;
          case 'crypto':
            pdf.text(`${method.details.currency}: ${method.details.wallet_address}`, 25, itemsYPos);
            if (method.details.network) {
              itemsYPos += 6;
              pdf.text(`Network: ${method.details.network}`, 25, itemsYPos);
            }
            break;
          default:
            if (method.details.instructions) {
              pdf.text(method.details.instructions,  25, itemsYPos);
            }
        }
        itemsYPos += 12;
      });
    }

    // Notes and Terms
    if (invoiceData.notes || invoiceData.terms) {
      itemsYPos += 10;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      if (invoiceData.notes) {
        pdf.setFont(undefined, 'bold');
        pdf.text('Notes:', 20, itemsYPos);
        pdf.setFont(undefined, 'normal');
        itemsYPos += 8;
        const noteLines = pdf.splitTextToSize(invoiceData.notes, 170);
        pdf.text(noteLines, 20, itemsYPos);
        itemsYPos += noteLines.length * 6;
      }
      
      if (invoiceData.terms) {
        itemsYPos += 10;
        pdf.setFont(undefined, 'bold');
        pdf.text('Terms & Conditions:', 20, itemsYPos);
        pdf.setFont(undefined, 'normal');
        itemsYPos += 8;
        const termLines = pdf.splitTextToSize(invoiceData.terms, 170);
        pdf.text(termLines, 20, itemsYPos);
      }
    }

    // Save PDF
    const pdfOutput = pdf.output('datauristring');
    const pdfBase64 = pdfOutput.split(',')[1];
    
    return {
      filename: `${invoiceData.invoice_number}.pdf`,
      content: pdfBase64,
      encoding: 'base64'
    };
  };

  const saveInvoice = async (status: string = 'draft') => {
    if (!invoiceData.client_name || !invoiceData.client_email) {
      toast.error('Please select a client or add client information');
      return;
    }

    if (invoiceData.items.some(item => !item.title || item.rate <= 0)) {
      toast.error('All items must have a title and rate');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user!.id,
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          client_email: invoiceData.client_email,
          client_address: invoiceData.client_address,
          client_phone: invoiceData.client_phone,
          client_business_name: invoiceData.client_business_name,
          status,
          currency: invoiceData.currency,
          subtotal,
          tax_enabled: invoiceData.tax_enabled,
          tax_rate: invoiceData.tax_rate,
          tax_amount: taxAmount,
          discount_enabled: invoiceData.discount_enabled,
          discount_type: invoiceData.discount_type,
          discount_value: invoiceData.discount_value,
          discount_amount: discountAmount,
          total,
          notes: invoiceData.notes,
          terms: invoiceData.terms,
          estimated_completion: invoiceData.estimated_completion,
          due_date: invoiceData.due_date || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = invoiceData.items.map((item, index) => ({
        invoice_id: invoice.id,
        title: item.title,
        description: item.description,
        hours: invoiceData.hours_enabled ? item.hours : null,
        rate: item.rate,
        subtotal: item.subtotal,
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // If status is 'sent', send email with PDF
      if (status === 'sent') {
        const pdfAttachment = await generatePDF(invoice.id);
        
        // Get selected payment methods
        const selectedMethods = paymentMethods.filter(method => 
          selectedPaymentMethods.includes(method.id)
        );
        
        // Generate email template
        const emailTemplate = generateInvoiceEmailTemplate(
          invoiceData.invoice_number,
          invoiceData.client_name,
          total.toFixed(2),
          invoiceData.currency,
          companyInfo?.business_name || profile?.name || 'Your Business',
          companyInfo?.company_email || user?.email || '',
          companyInfo?.phone || '',
          selectedMethods
        );

        // Send email
        const emailSent = await sendInvoiceEmail({
          to: invoiceData.client_email,
          subject: `Invoice ${invoiceData.invoice_number} from ${companyInfo?.business_name || profile?.name || 'Your Business'}`,
          html: emailTemplate,
          attachments: [pdfAttachment]
        });

        if (emailSent) {
          toast.success('Invoice sent successfully!');
        } else {
          toast.error('Failed to send invoice email');
        }
      }

      toast.success(`Invoice ${status === 'draft' ? 'saved' : 'created'} successfully!`);
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'upi': return <Smartphone className="h-4 w-4" />;
      case 'bank': return <CreditCard className="h-4 w-4" />;
      case 'crypto': return <Bitcoin className="h-4 w-4" />;
      case 'payment_link': return <LinkIcon className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();
  const selectedCurrency = CURRENCIES.find(c => c.code === invoiceData.currency);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/invoices')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-gray-600">Generate a professional invoice for your client</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => saveInvoice('draft')}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </button>
          <button
            onClick={() => saveInvoice('sent')}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4 mr-2" />
            Create & Send
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceData.invoice_number}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={invoiceData.currency}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoiceData.due_date}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Completion
                </label>
                <input
                  type="text"
                  value={invoiceData.estimated_completion}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, estimated_completion: e.target.value }))}
                  placeholder="e.g., 3 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-1" />
                Add Client
              </button>
            </div>

            {/* Client Selection */}
            {clients.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Existing Client
                </label>
                <select
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    if (client) selectClient(client);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.business_name} - {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={invoiceData.client_name}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={invoiceData.client_business_name}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_business_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={invoiceData.client_email}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={invoiceData.client_phone}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Address
                </label>
                <textarea
                  value={invoiceData.client_address}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_address: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
              <button
                onClick={() => setShowPaymentMethodsModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Select Methods
              </button>
            </div>

            {selectedPaymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods
                  .filter(method => selectedPaymentMethods.includes(method.id))
                  .map(method => (
                    <div key={method.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded mr-3">
                          {getMethodIcon(method.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No payment methods selected</p>
                <p className="text-sm">Click "Select Methods" to add payment options for your client</p>
              </div>
            )}
          </div>

          {/* Global Toggles */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Hours Tracking</label>
                  <p className="text-xs text-gray-500">Track hours for hourly billing or use fixed cost</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceData.hours_enabled}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, hours_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Tax</label>
                  <p className="text-xs text-gray-500">Add tax to invoice total</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceData.tax_enabled}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, tax_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {invoiceData.tax_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={invoiceData.tax_rate}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Discount</label>
                  <p className="text-xs text-gray-500">Apply discount to invoice</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceData.discount_enabled}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {invoiceData.discount_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={invoiceData.discount_type}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_type: e.target.value as 'flat' | 'percentage' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="flat">Flat Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={invoiceData.discount_value}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
              <button
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="invoice-items">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {invoiceData.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex items-start space-x-4">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Service Title *
                                  </label>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Logo Design"
                                  />
                                </div>
                                
                                <div className="md:col-span-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                  </label>
                                  <textarea
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Service details..."
                                  />
                                </div>

                                {invoiceData.hours_enabled && (
                                  <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Hours
                                    </label>
                                    <input
                                      type="number"
                                      value={item.hours}
                                      onChange={(e) => updateItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                                      min="0"
                                      step="0.25"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                )}

                                <div className={`md:col-span-${invoiceData.hours_enabled ? '2' : '3'}`}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {invoiceData.hours_enabled ? `Rate (${selectedCurrency?.symbol})` : `Total (${selectedCurrency?.symbol})`}
                                  </label>
                                  <input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>

                                <div className="md:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subtotal
                                  </label>
                                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                                    {selectedCurrency?.symbol}{item.subtotal.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="mt-6 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Additional Fields */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Notes
                </label>
                <textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Please pay within 7 days"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={invoiceData.terms}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Payment terms and conditions..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{selectedCurrency?.symbol}{subtotal.toFixed(2)}</span>
              </div>
              
              {invoiceData.tax_enabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoiceData.tax_rate}%):</span>
                  <span className="font-medium">{selectedCurrency?.symbol}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              {invoiceData.discount_enabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Discount ({invoiceData.discount_type === 'percentage' ? `${invoiceData.discount_value}%` : selectedCurrency?.symbol + invoiceData.discount_value}):
                  </span>
                  <span className="font-medium text-red-600">-{selectedCurrency?.symbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-blue-600">{selectedCurrency?.symbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{invoiceData.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>{invoiceData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Methods:</span>
                  <span>{selectedPaymentMethods.length}</span>
                </div>
                {invoiceData.due_date && (
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{new Date(invoiceData.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Client</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={newClient.business_name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Corporation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Business St, City, State 12345"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddClientModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentMethodsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Methods</h2>
            
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <label key={method.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPaymentMethods.includes(method.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPaymentMethods(prev => [...prev, method.id]);
                        } else {
                          setSelectedPaymentMethods(prev => prev.filter(id => id !== method.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded mr-3">
                        {getMethodIcon(method.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No payment methods configured</p>
                <p className="text-sm text-gray-400">Go to Payment Methods page to add payment options</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentMethodsModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPaymentMethodsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;