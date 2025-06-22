import React, { useState } from 'react';
import { Check, Star, Zap, Users, Crown, CreditCard, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRICING_PLANS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createOxaPayPayment } from '../lib/oxapay';
import toast from 'react-hot-toast';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to purchase a plan');
      navigate('/login');
      return;
    }

    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) return;

    setLoading(planId);
    
    try {
      const planType = planId.includes('free') ? 'free' : 
                      planId.includes('pro') ? 'pro' : 'agency';

      // If it's a free plan, activate immediately
      if (planType === 'free') {
        const { error } = await supabase
          .from('users')
          .update({ 
            plan: planType,
            plan_expires_at: null
          })
          .eq('id', user.id);

        if (error) throw error;
        
        toast.success('Free plan activated successfully!');
        navigate('/dashboard');
        return;
      }

      // For paid plans, create OxaPay payment
      const price = getPrice(plan);
      const amount = price.usd; // Use USD for OxaPay
      
      // Check if amount is valid
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      // Generate a short order ID (max 50 characters)
      const timestamp = Date.now().toString();
      const userIdShort = user.id.substring(0, 8); // First 8 chars of UUID
      const shortOrderId = `${planType}-${billingCycle}-${userIdShort}-${timestamp}`.substring(0, 50);
      
      const paymentData = {
        amount: amount,
        currency: 'USD',
        orderId: shortOrderId,
        description: `${plan.name} - ${billingCycle} subscription`,
        callbackUrl: `${window.location.origin}/payment/callback`,
        returnUrl: `${window.location.origin}/payment/success?plan=${planType}&billing=${billingCycle}`,
        email: user.email || '',
      };

      console.log('Creating payment with order ID:', shortOrderId, 'Length:', shortOrderId.length);

      const paymentResult = await createOxaPayPayment(paymentData);
      
      if (paymentResult.success && paymentResult.paymentUrl) {
        // Store pending plan info in localStorage for after payment
        localStorage.setItem('pendingPlan', JSON.stringify({
          planType,
          billingCycle,
          userId: user.id,
          orderId: shortOrderId,
          trackId: paymentResult.trackId
        }));
        
        toast.success('Redirecting to payment gateway...');
        
        // Redirect to OxaPay payment page
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error(paymentResult.error || 'Payment creation failed');
      }
      
    } catch (error: any) {
      console.error('Error processing plan selection:', error);
      
      // Show user-friendly error messages
      if (error.message?.includes('Invalid merchant API key')) {
        toast.error('Payment system configuration error. Please contact support.');
      } else if (error.message?.includes('Network error')) {
        toast.error('Unable to connect to payment gateway. Please check your internet connection and try again.');
      } else if (error.message?.includes('Invalid amount')) {
        toast.error('Invalid payment amount. Please try again or contact support.');
      } else if (error.message?.includes('order id field')) {
        toast.error('Order processing error. Please try again or contact support.');
      } else {
        toast.error(error.message || 'Failed to process payment. Please try again or contact support.');
      }
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (plan: any) => {
    if (billingCycle === 'yearly') {
      return {
        inr: plan.price_yearly_inr,
        usd: plan.price_yearly_usd,
        period: 'year'
      };
    }
    return {
      inr: plan.price_monthly_inr,
      usd: plan.price_monthly_usd,
      period: 'month'
    };
  };

  const getSavings = (plan: any) => {
    if (plan.price_yearly_inr > 0) {
      const monthlyCost = plan.price_monthly_inr * 12;
      const yearlyCost = plan.price_yearly_inr;
      return monthlyCost - yearlyCost;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Choose Your Perfect Plan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Start with our free plan and upgrade as your business grows. All plans include our core invoicing features.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                  Save 30%
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => {
            const price = getPrice(plan);
            const savings = getSavings(plan);
            const isLoading = loading === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:scale-105 ${
                  plan.is_popular 
                    ? 'border-blue-500 ring-2 ring-blue-100 transform scale-105' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className="mb-3">
                      {plan.id === 'free' && (
                        <div className="bg-gray-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Zap className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                      {plan.id === 'pro' && (
                        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                      {plan.id === 'agency' && (
                        <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Crown className="h-8 w-8 text-purple-600" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    
                    {plan.trial_days && billingCycle === 'monthly' && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mb-3 inline-block">
                        {plan.trial_days}-Day Free Trial
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-3xl font-bold text-gray-900">₹{price.inr}</span>
                        <span className="text-gray-500 ml-1">/{price.period}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        or ${price.usd}/{price.period}
                      </div>
                      {billingCycle === 'yearly' && savings > 0 && (
                        <div className="mt-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full inline-block">
                          Save ₹{savings} yearly
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      {plan.id === 'free' && 'Perfect for getting started'}
                      {plan.id === 'pro' && 'Ideal for growing freelancers'}
                      {plan.id === 'agency' && 'Perfect for teams & agencies'}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-xs text-gray-500 mt-2">
                        +{plan.features.length - 6} more features
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                      plan.is_popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.id === 'free' ? 'Get Started Free' : 'Choose Plan'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>

                  {price.inr > 0 && billingCycle === 'monthly' && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => {
                          setBillingCycle('yearly');
                          setTimeout(() => handleSelectPlan(`${plan.id}-yearly`), 100);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium underline"
                      >
                        Or pay yearly and save ₹{getSavings(plan)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Security Notice */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xl mx-auto">
            <div className="flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">Secure Crypto Payments</h3>
            </div>
            <p className="text-blue-800 mb-3">
              We use OxaPay for secure cryptocurrency payments. All major cryptocurrencies are supported including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-sm text-blue-700">
              <span>• Bitcoin (BTC)</span>
              <span>• Ethereum (ETH)</span>
              <span>• USDT</span>
              <span>• USDC</span>
              <span>• Binance Coin (BNB)</span>
              <span>• Cardano (ADA)</span>
              <span>• Polygon (MATIC)</span>
              <span>• And 40+ more</span>
            </div>
            <p className="text-blue-700 text-sm mt-3">
              Payments are processed securely through OxaPay's enterprise-grade infrastructure.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-500 mr-2" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Secure Payments</div>
                <div className="text-sm text-gray-600">256-bit SSL encryption</div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-500 mr-2" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Money Back Guarantee</div>
                <div className="text-sm text-gray-600">30-day refund policy</div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-500 mr-2" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">24/7 Support</div>
                <div className="text-sm text-gray-600">Always here to help</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate the billing.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major cryptocurrencies through OxaPay including Bitcoin, Ethereum, USDT, USDC, and 40+ more coins.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No setup fees or hidden charges. You only pay for your chosen plan. Start with our free trial today.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl shadow-xl max-w-xl mx-auto text-white">
            <h3 className="text-xl font-bold mb-3">
              Need a Custom Solution?
            </h3>
            <p className="mb-4 opacity-90">
              For enterprise needs or custom requirements, we'd love to discuss a tailored solution for your business.
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;