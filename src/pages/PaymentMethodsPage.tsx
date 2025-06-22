import React, { useEffect, useState } from 'react';
import { Plus, CreditCard, Smartphone, Bitcoin, Link, Settings, Edit, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank' | 'crypto' | 'payment_link' | 'custom';
  name: string;
  details: Record<string, any>;
  is_active: boolean;
  order_index: number;
}

const PaymentMethodsPage: React.FC = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [newMethod, setNewMethod] = useState({
    type: 'upi' as const,
    name: '',
    details: {} as Record<string, any>,
  });

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user!.id)
        .order('order_index');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const savePaymentMethod = async () => {
    if (!newMethod.name) {
      toast.error('Payment method name is required');
      return;
    }

    try {
      const methodData = {
        user_id: user!.id,
        type: newMethod.type,
        name: newMethod.name,
        details: newMethod.details,
        is_active: true,
        order_index: paymentMethods.length,
      };

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(methodData)
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('Payment method updated successfully');
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert(methodData);

        if (error) throw error;
        toast.success('Payment method added successfully');
      }

      await fetchPaymentMethods();
      resetForm();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method');
    }
  };

  const deletePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      toast.success('Payment method deleted successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      setPaymentMethods(prev => prev.map(method => 
        method.id === id ? { ...method, is_active: isActive } : method
      ));
      toast.success(`Payment method ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(paymentMethods);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updates = items.map((item, index) => ({
      id: item.id,
      order_index: index,
    }));

    setPaymentMethods(items);

    try {
      for (const update of updates) {
        await supabase
          .from('payment_methods')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      await fetchPaymentMethods(); // Revert on error
    }
  };

  const resetForm = () => {
    setNewMethod({
      type: 'upi',
      name: '',
      details: {},
    });
    setEditingMethod(null);
    setShowAddModal(false);
  };

  const editMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setNewMethod({
      type: method.type,
      name: method.name,
      details: method.details,
    });
    setShowAddModal(true);
  };

  const generateQRCode = async (data: string) => {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'upi': return <Smartphone className="h-5 w-5" />;
      case 'bank': return <CreditCard className="h-5 w-5" />;
      case 'crypto': return <Bitcoin className="h-5 w-5" />;
      case 'payment_link': return <Link className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'upi': return 'bg-green-100 text-green-600';
      case 'bank': return 'bg-blue-100 text-blue-600';
      case 'crypto': return 'bg-yellow-100 text-yellow-600';
      case 'payment_link': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const renderMethodDetails = (method: PaymentMethod) => {
    switch (method.type) {
      case 'upi':
        return (
          <div className="text-sm text-gray-600">
            <p><strong>UPI ID:</strong> {method.details.upi_id}</p>
            {method.details.merchant_name && (
              <p><strong>Merchant:</strong> {method.details.merchant_name}</p>
            )}
          </div>
        );
      case 'bank':
        return (
          <div className="text-sm text-gray-600">
            <p><strong>Account:</strong> {method.details.account_number}</p>
            <p><strong>Bank:</strong> {method.details.bank_name}</p>
            <p><strong>IFSC:</strong> {method.details.ifsc_code}</p>
          </div>
        );
      case 'crypto':
        return (
          <div className="text-sm text-gray-600">
            <p><strong>Currency:</strong> {method.details.currency}</p>
            <p><strong>Address:</strong> {method.details.wallet_address}</p>
            {method.details.network && (
              <p><strong>Network:</strong> {method.details.network}</p>
            )}
          </div>
        );
      case 'payment_link':
        return (
          <div className="text-sm text-gray-600">
            <p><strong>Provider:</strong> {method.details.provider}</p>
            <p><strong>Link:</strong> {method.details.payment_url}</p>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            {Object.entries(method.details).map(([key, value]) => (
              <p key={key}><strong>{key}:</strong> {value}</p>
            ))}
          </div>
        );
    }
  };

  const renderMethodForm = () => {
    switch (newMethod.type) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID *
              </label>
              <input
                type="text"
                value={newMethod.details.upi_id || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, upi_id: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-upi@bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant Name
              </label>
              <input
                type="text"
                value={newMethod.details.merchant_name || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, merchant_name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Business Name"
              />
            </div>
          </div>
        );
      case 'bank':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={newMethod.details.account_holder || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, account_holder: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Account holder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={newMethod.details.account_number || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, account_number: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={newMethod.details.bank_name || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, bank_name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bank name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code *
              </label>
              <input
                type="text"
                value={newMethod.details.ifsc_code || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, ifsc_code: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="IFSC code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={newMethod.details.branch || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, branch: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Branch name"
              />
            </div>
          </div>
        );
      case 'crypto':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cryptocurrency *
              </label>
              <select
                value={newMethod.details.currency || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, currency: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select cryptocurrency</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDT">Tether (USDT)</option>
                <option value="USDC">USD Coin (USDC)</option>
                <option value="BNB">Binance Coin (BNB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address *
              </label>
              <input
                type="text"
                value={newMethod.details.wallet_address || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, wallet_address: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Wallet address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network
              </label>
              <input
                type="text"
                value={newMethod.details.network || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, network: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., ERC-20, TRC-20"
              />
            </div>
          </div>
        );
      case 'payment_link':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider *
              </label>
              <select
                value={newMethod.details.provider || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, provider: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select provider</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Stripe">Stripe</option>
                <option value="PayPal">PayPal</option>
                <option value="Paytm">Paytm</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Google Pay">Google Pay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment URL *
              </label>
              <input
                type="url"
                value={newMethod.details.payment_url || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, payment_url: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>
        );
      case 'custom':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                value={newMethod.details.instructions || ''}
                onChange={(e) => setNewMethod(prev => ({
                  ...prev,
                  details: { ...prev.details, instructions: e.target.value }
                }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Payment instructions for clients..."
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Configure how clients can pay you</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="payment-methods">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <Draggable key={method.id} draggableId={method.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white p-6 rounded-lg shadow-sm border"
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          
                          <div className={`p-2 rounded-lg ${getMethodColor(method.type)}`}>
                            {getMethodIcon(method.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                              <div className="flex items-center space-x-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={method.is_active}
                                    onChange={(e) => toggleActive(method.id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <button
                                  onClick={() => editMethod(method)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deletePaymentMethod(method.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-500 mb-3 capitalize">
                              {method.type.replace('_', ' ')} Payment
                            </div>
                            
                            {renderMethodDetails(method)}
                          </div>
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
      ) : (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods configured</h3>
          <p className="text-gray-500 mb-6">
            Add payment methods to help clients pay you easily
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </button>
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <select
                  value={newMethod.type}
                  onChange={(e) => setNewMethod(prev => ({ 
                    ...prev, 
                    type: e.target.value as any,
                    details: {} 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="upi">UPI Payment</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="payment_link">Payment Link</option>
                  <option value="custom">Custom Method</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newMethod.name}
                  onChange={(e) => setNewMethod(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Primary UPI, Business Account"
                />
              </div>

              {renderMethodForm()}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePaymentMethod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingMethod ? 'Update' : 'Add'} Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsPage;