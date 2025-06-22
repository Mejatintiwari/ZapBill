import React from 'react';
import { ArrowLeft, DollarSign, Clock, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex items-center mb-6">
            <Link
              to="/"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Refund Policy</h1>
                <p className="text-gray-600">Last updated: December 2024</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              We want you to be completely satisfied with your purchase. This Refund Policy outlines when and how you can request a refund for InvoiceFlow services.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 space-y-8">
            {/* Section 1 */}
            <section>
              <div className="flex items-center mb-4">
                <Clock className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">1. Refund Eligibility</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">30-Day Money-Back Guarantee</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We offer a 30-day money-back guarantee for all paid subscriptions (Pro and Agency plans). If you are not satisfied with our service for any reason, you may request a full refund within 30 days of your initial purchase.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Eligibility Criteria</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To be eligible for a refund, you must meet the following criteria:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>The refund request must be made within 30 days of the initial purchase</li>
                  <li>The request must be submitted through our official support channels</li>
                  <li>Your account must be in good standing (not suspended or terminated for violations)</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center mb-4">
                <CreditCard className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">2. Refund Process</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Request a Refund</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To request a refund, please follow these steps:
                </p>
                <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Log in to your InvoiceFlow account</li>
                  <li>Navigate to the Support section</li>
                  <li>Submit a refund request ticket with the subject "Refund Request"</li>
                  <li>Include your order/transaction ID and the reason for your refund request</li>
                </ol>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Time</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Refund requests are typically processed within 5-10 business days. Once approved, the refund will be credited back to the original payment method used for the purchase.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Please note that depending on your payment provider, it may take additional time for the refunded amount to appear in your account.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">3. Non-Refundable Items</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The following items are not eligible for refunds:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Subscriptions that have been active for more than 30 days</li>
                  <li>Partial refunds for unused portions of a subscription period after the 30-day window</li>
                  <li>Subscriptions that have been canceled and reactivated multiple times</li>
                  <li>Accounts that have violated our Terms of Service</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription Cancellations</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Canceling your subscription is different from requesting a refund:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>You can cancel your subscription at any time from your account settings</li>
                  <li>Cancellation will stop future billing but will not automatically issue a refund</li>
                  <li>After cancellation, you will continue to have access to your paid features until the end of your current billing period</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  If you cancel your subscription and also want a refund, you must separately request the refund as outlined in Section 2, provided you are within the 30-day refund window.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Special Circumstances</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We understand that special circumstances may arise. In the following cases, we may consider refund requests outside the standard 30-day window:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Service unavailability or technical issues that significantly impacted your ability to use InvoiceFlow</li>
                  <li>Billing errors or duplicate charges</li>
                  <li>Unauthorized transactions (subject to investigation)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  These cases will be evaluated on an individual basis, and we may request additional information to process your refund request.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes to This Policy</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to our website. 
                  We encourage you to review this Refund Policy periodically for any changes. Your continued use of InvoiceFlow after any changes to the Refund Policy constitutes your acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <HelpCircle className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Refund Policy or would like to request a refund, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> refunds@invoiceflow.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Support Ticket:</strong> Log in to your account and submit a support ticket</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;