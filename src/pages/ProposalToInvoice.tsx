import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, Plus, Trash2, GripVertical, FileText, ArrowRight, Lock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCIES, Client } from '../types';
import toast from 'react-hot-toast';

interface ProposalItem {
  id: string;
  title: string;
  description: string;
  hours: number;
  rate: number;
  subtotal: number;
}

interface ProposalData {
  title: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  client_business_name: string;
  currency: string;
  items: ProposalItem[];
  tax_enabled: boolean;
  tax_rate: number;
  discount_enabled: boolean;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  notes: string;
  terms: string;
  estimated_completion: string;
  valid_until: string;
  hours_enabled: boolean;
}

const ProposalToInvoice: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [step, setStep] = useState<'proposal' | 'review' | 'convert'>('proposal');

  const [proposalData, setProposalData] = useState<ProposalData>({
    title: '',
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
    valid_until: '',
    hours_enabled: true,
  });

  // Check if user has Pro or Agency plan
  const hasAccess = profile?.plan === 'pro' || profile?.plan === 'agency';

  useEffect(() => {
    if (user && hasAccess) {
      fetchClients();
    }
  }, [user, hasAccess]);

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

  const selectClient = (client: Client) => {
    setProposalData(prev => ({
      ...prev,
      client_name: client.name,
      client_email: client.email,
      client_address: client.address || '',
      client_phone: client.phone,
      client_business_name: client.business_name,
    }));
  };

  const addItem = () => {
    const newItem: ProposalItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      hours: 1,
      rate: 0,
      subtotal: 0,
    };
    setProposalData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    if (proposalData.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setProposalData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, field: keyof ProposalItem, value: any) => {
    setProposalData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'hours' || field === 'rate') {
            if (proposalData.hours_enabled) {
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

    const items = Array.from(proposalData.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setProposalData(prev => ({ ...prev, items }));
  };

  const calculateTotals = () => {
    const subtotal = proposalData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = proposalData.tax_enabled ? (subtotal * proposalData.tax_rate) / 100 : 0;
    
    let discountAmount = 0;
    if (proposalData.discount_enabled) {
      if (proposalData.discount_type === 'percentage') {
        discountAmount = (subtotal * proposalData.discount_value) / 100;
      } else {
        discountAmount = proposalData.discount_value;
      }
    }

    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, total };
  };

  const convertToInvoice = async () => {
    if (!proposalData.client_name || !proposalData.client_email) {
      toast.error('Please select a client or add client information');
      return;
    }

    if (proposalData.items.some(item => !item.title || item.rate <= 0)) {
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
          invoice_number: `INV-${Date.now()}`,
          client_name: proposalData.client_name,
          client_email: proposalData.client_email,
          client_address: proposalData.client_address,
          client_phone: proposalData.client_phone,
          client_business_name: proposalData.client_business_name,
          status: 'draft',
          currency: proposalData.currency,
          subtotal,
          tax_enabled: proposalData.tax_enabled,
          tax_rate: proposalData.tax_rate,
          tax_amount: taxAmount,
          discount_enabled: proposalData.discount_enabled,
          discount_type: proposalData.discount_type,
          discount_value: proposalData.discount_value,
          discount_amount: discountAmount,
          total,
          notes: proposalData.notes,
          terms: proposalData.terms,
          estimated_completion: proposalData.estimated_completion,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = proposalData.items.map((item, index) => ({
        invoice_id: invoice.id,
        title: item.title,
        description: item.description,
        hours: proposalData.hours_enabled ? item.hours : null,
        rate: item.rate,
        subtotal: item.subtotal,
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Proposal converted to invoice successfully!');
      navigate(`/invoices/${invoice.id}/edit`);
    } catch (error) {
      console.error('Error converting proposal:', error);
      toast.error('Failed to convert proposal to invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();
  const selectedCurrency = CURRENCIES.find(c => c.code === proposalData.currency);

  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pro Plan Required</h3>
          <p className="text-gray-500 mb-6">
            This feature is only available for Pro and Agency plan users.
          </p>
          <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Pro Plan Features:</h4>
            <ul className="text-blue-800 text-sm space-y-2">
              <li>• Unlimited invoices</li>
              <li>• Unlimited client profiles</li>
              <li>• Email invoices to clients via SMTP</li>
              <li>• Save default services/rates</li>
              <li>• Enable/disable Tax, Discounts, Hours</li>
              <li>• Customize invoice number formats</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upgrade to Pro Plan
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Proposal to Invoice</h1>
            <p className="text-gray-600">Create a proposal and convert it to an invoice</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {step === 'proposal' && (
            <button
              onClick={() => setStep('review')}
              disabled={!proposalData.title || !proposalData.client_name}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Review Proposal
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          )}
          {step === 'review' && (
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('proposal')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Edit Proposal
              </button>
              <button
                onClick={convertToInvoice}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Convert to Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'proposal' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Create Proposal</span>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Review & Convert</span>
        </div>
      </div>

      {step === 'proposal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    value={proposalData.title}
                    onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Website Development Proposal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={proposalData.currency}
                    onChange={(e) => setProposalData(prev => ({ ...prev, currency: e.target.value }))}
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
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={proposalData.valid_until}
                    onChange={(e) => setProposalData(prev => ({ ...prev, valid_until: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion
                  </label>
                  <input
                    type="text"
                    value={proposalData.estimated_completion}
                    onChange={(e) => setProposalData(prev => ({ ...prev, estimated_completion: e.target.value }))}
                    placeholder="e.g., 2-3 weeks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>

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
                    value={proposalData.client_name}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_name: e.target.value }))}
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
                    value={proposalData.client_business_name}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_business_name: e.target.value }))}
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
                    value={proposalData.client_email}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={proposalData.client_phone}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Address
                  </label>
                  <textarea
                    value={proposalData.client_address}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Proposal Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Proposal Items</h2>
                <button
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="proposal-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {proposalData.items.map((item, index) => (
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
                                      placeholder="e.g., Website Design"
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

                                  {proposalData.hours_enabled && (
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

                                  <div className={`md:col-span-${proposalData.hours_enabled ? '2' : '3'}`}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {proposalData.hours_enabled ? `Rate (${selectedCurrency?.symbol})` : `Total (${selectedCurrency?.symbol})`}
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
                    Proposal Notes
                  </label>
                  <textarea
                    value={proposalData.notes}
                    onChange={(e) => setProposalData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about the proposal..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={proposalData.terms}
                    onChange={(e) => setProposalData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Terms and conditions for this proposal..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Proposal Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{selectedCurrency?.symbol}{subtotal.toFixed(2)}</span>
                </div>
                
                {proposalData.tax_enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({proposalData.tax_rate}%):</span>
                    <span className="font-medium">{selectedCurrency?.symbol}{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {proposalData.discount_enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Discount ({proposalData.discount_type === 'percentage' ? `${proposalData.discount_value}%` : selectedCurrency?.symbol + proposalData.discount_value}):
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
                    <span>{proposalData.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span>{proposalData.currency}</span>
                  </div>
                  {proposalData.valid_until && (
                    <div className="flex justify-between">
                      <span>Valid Until:</span>
                      <span>{new Date(proposalData.valid_until).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Review</h2>
            <p className="text-gray-600">Review your proposal before converting to invoice</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="border rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{proposalData.title}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Client</h4>
                  <p className="text-gray-700">{proposalData.client_business_name}</p>
                  <p className="text-gray-700">{proposalData.client_name}</p>
                  <p className="text-gray-700">{proposalData.client_email}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
                  <p className="text-gray-700">Total: {selectedCurrency?.symbol}{total.toFixed(2)}</p>
                  <p className="text-gray-700">Items: {proposalData.items.length}</p>
                  {proposalData.estimated_completion && (
                    <p className="text-gray-700">Timeline: {proposalData.estimated_completion}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {proposalData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{selectedCurrency?.symbol}{item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{selectedCurrency?.symbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Converting this proposal will create a new invoice with the same details.
              </p>
              <button
                onClick={convertToInvoice}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Convert to Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalToInvoice;