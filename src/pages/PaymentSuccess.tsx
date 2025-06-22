import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Crown, Users, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [planActivated, setPlanActivated] = useState(false);

  const planType = searchParams.get('plan') as 'free' | 'pro' | 'agency';
  const billingCycle = searchParams.get('billing') as 'monthly' | 'yearly';

  useEffect(() => {
    if (user && planType) {
      activatePlan();
    }
  }, [user, planType]);

  const activatePlan = async () => {
    try {
      // Get pending plan info from localStorage
      const pendingPlan = localStorage.getItem('pendingPlan');
      if (pendingPlan) {
        const planInfo = JSON.parse(pendingPlan);
        
        // Calculate expiration date
        const expirationDate = billingCycle === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Update user's plan in the database
        const { error } = await supabase
          .from('users')
          .update({ 
            plan: planType,
            plan_expires_at: expirationDate.toISOString()
          })
          .eq('id', user!.id);

        if (error) throw error;

        // Clear pending plan info
        localStorage.removeItem('pendingPlan');
        
        setPlanActivated(true);
        toast.success('Payment successful! Your plan has been activated.');
      }
    } catch (error) {
      console.error('Error activating plan:', error);
      toast.error('Failed to activate plan. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const getPlanIcon = () => {
    switch (planType) {
      case 'pro': return <Users className="h-16 w-16 text-blue-600" />;
      case 'agency': return <Crown className="h-16 w-16 text-purple-600" />;
      default: return <Zap className="h-16 w-16 text-gray-600" />;
    }
  };

  const getPlanColor = () => {
    switch (planType) {
      case 'pro': return 'from-blue-500 to-blue-600';
      case 'agency': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Processing your payment...</h2>
          <p className="text-gray-600">Please wait while we activate your plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="bg-gray-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              {getPlanIcon()}
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your <span className="font-semibold capitalize">{planType} Plan</span> has been activated successfully.
            {billingCycle === 'yearly' ? ' You saved 30% with yearly billing!' : ''}
          </p>

          {/* Plan Benefits */}
          <div className={`bg-gradient-to-r ${getPlanColor()} p-4 rounded-lg text-white mb-6`}>
            <h3 className="font-semibold mb-2">What's included:</h3>
            <div className="text-sm space-y-1">
              {planType === 'pro' && (
                <>
                  <p>✓ Unlimited invoices</p>
                  <p>✓ Email invoices via SMTP</p>
                  <p>✓ Payment gateway integration</p>
                  <p>✓ Priority support</p>
                </>
              )}
              {planType === 'agency' && (
                <>
                  <p>✓ Everything in Pro Plan</p>
                  <p>✓ Team access (up to 5 users)</p>
                  <p>✓ Client portal access</p>
                  <p>✓ Branded email from your domain</p>
                  <p>✓ Advanced analytics</p>
                </>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Complete your company profile</p>
              <p>2. Set up your payment methods</p>
              <p>3. Create your first invoice</p>
              {planType === 'agency' && <p>4. Invite team members</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full bg-gradient-to-r ${getPlanColor()} text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center`}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Complete Profile Setup
            </button>
          </div>

          {/* Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help getting started? 
              <a href="/support" className="text-blue-600 hover:text-blue-500 ml-1">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;