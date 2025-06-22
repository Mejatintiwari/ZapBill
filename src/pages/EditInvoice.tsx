import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCIES } from '../types';
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
  status: string;
}

const EditInvoice: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchInvoice();
    }
  }, [id, user]);

  const fetchInvoice = async () => {
    try {
      // Fetch invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (invoiceError) throw invoiceError;

      // Fetch invoice items
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('order_index');

      if (itemsError) throw itemsError;

      const formattedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        hours: item.hours || 1,
        rate: item.rate,
        subtotal: item.subtotal,
      }));

      setInvoiceData({
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_address: invoice.client_address || '',
        currency: invoice.currency,
        items: formattedItems,
        tax_enabled: invoice.tax_enabled,
        tax_rate: invoice.tax_rate,
        discount_enabled: invoice.discount_enabled,
        discount_type: invoice.discount_type,
        discount_value: invoice.discount_value,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        estimated_completion: invoice.estimated_completion || '',
        due_date: invoice.due_date || '',
        hours_enabled: items.some(item => item.hours !== null),
        status: invoice.status,
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to fetch invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!invoiceData) return;
    
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      hours: 1,
      rate: 0,
      subtotal: 0,
    };
    setInvoiceData(prev => prev ? ({
      ...prev,
      items: [...prev.items, newItem]
    }) : null);
  };

  const removeItem = (itemId: string) => {
    if (!invoiceData || invoiceData.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setInvoiceData(prev => prev ? ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }) : null);
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    if (!invoiceData) return;
    
    setInvoiceData(prev => prev ? ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'hours' || field === 'rate') {
            updatedItem.subtotal = (updatedItem.hours || 1) * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    }) : null);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !invoiceData) return;

    const items = Array.from(invoiceData.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setInvoiceData(prev => prev ? ({ ...prev, items }) : null);
  };

  const calculateTotals = () => {
    if (!invoiceData) return { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 };
    
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

  const saveInvoice = async (status?: string) => {
    if (!invoiceData) return;
    
    if (!invoiceData.client_name || !invoiceData.client_email) {
      toast.error('Client name and email are required');
      return;
    }

    if (invoiceData.items.some(item => !item.title || item.rate <= 0)) {
      toast.error('All items must have a title and rate');
      return;
    }

    setSaving(true);
    try {
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          client_email: invoiceData.client_email,
          client_address: invoiceData.client_address,
          status: status || invoiceData.status,
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) throw deleteError;

      // Insert updated items
      const itemsToInsert = invoiceData.items.map((item, index) => ({
        invoice_id: id,
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

      toast.success('Invoice updated successfully');
      navigate('/invoices');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice not found</h1>
          <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-gray-600">Update invoice details and items</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => saveInvoice()}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
          {invoiceData.status === 'draft' && (
            <button
              onClick={() => saveInvoice('sent')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              Save & Send
            </button>
          )}
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
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, invoice_number: e.target.value }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={invoiceData.currency}
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, currency: e.target.value }) : null)}
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
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, due_date: e.target.value }) : null)}
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
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, estimated_completion: e.target.value }) : null)}
                  placeholder="e.g., 3 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={invoiceData.client_name}
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, client_name: e.target.value }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={invoiceData.client_email}
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, client_email: e.target.value }) : null)}
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
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, client_address: e.target.value }) : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Global Toggles */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Hours Tracking</label>
                  <p className="text-xs text-gray-500">Track hours for hourly billing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceData.hours_enabled}
                    onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, hours_enabled: e.target.checked }) : null)}
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
                    onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, tax_enabled: e.target.checked }) : null)}
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
                    onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }) : null)}
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
                    onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, discount_enabled: e.target.checked }) : null)}
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
                      onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, discount_type: e.target.value as 'flat' | 'percentage' }) : null)}
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
                      onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }) : null)}
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
                                    Rate ({selectedCurrency?.symbol})
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
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
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
                  onChange={(e) => setInvoiceData(prev => prev ? ({ ...prev, terms: e.target.value }) : null)}
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
                  <span>Status:</span>
                  <span className="capitalize font-medium">{invoiceData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{invoiceData.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>{invoiceData.currency}</span>
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
    </div>
  );
};

export default EditInvoice;