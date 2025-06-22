import React from 'react';
import { ArrowLeft, FileText, Shield, Users, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
                <p className="text-gray-600">Last updated: December 2024</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Please read these Terms and Conditions carefully before using InvoiceFlow. 
              By accessing or using our service, you agree to be bound by these terms.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 space-y-8">
            {/* Section 1 */}
            <section>
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using InvoiceFlow ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These Terms and Conditions may be updated from time to time. We will notify you of any changes by posting the new Terms and Conditions on this page. 
                  You are advised to review these Terms and Conditions periodically for any changes.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">2. Use License</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Permission is granted to temporarily download one copy of InvoiceFlow per device for personal, non-commercial transitory viewing only. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
                  <li>attempt to decompile or reverse engineer any software contained in InvoiceFlow</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time. 
                  Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">3. User Accounts</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                  You are responsible for safeguarding the password and for all activities that occur under your account.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to refuse service, terminate accounts, or cancel orders in our sole discretion.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center mb-4">
                <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">4. Billing and Payments</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. 
                  Billing cycles are set on a monthly or annual basis, depending on the type of subscription plan you select.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  A valid payment method, including credit card or other payment method, is required to process the payment for your subscription. 
                  You shall provide accurate and complete billing information.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By providing your payment information, you automatically authorize us to charge all subscription fees incurred through your account to any such payment instruments.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Refunds</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We offer a 30-day money-back guarantee for all paid subscriptions. If you are not satisfied with the service, 
                  you may request a full refund within 30 days of your initial purchase.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Refund requests must be submitted through our support system. Refunds will be processed within 5-10 business days 
                  and will be credited to the original payment method.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  You may not use our service:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                  <li>To upload or transmit viruses or any other type of malicious code</li>
                  <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                  <li>For any obscene or immoral purpose</li>
                  <li>To interfere with or circumvent the security features of the Service</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Protection</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We are committed to protecting your privacy and personal data. All data is encrypted in transit and at rest. 
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of all data you input into the system. We may use aggregated, anonymized data for improving our services.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain 99.9% uptime, but we do not guarantee that the service will be available at all times. 
                  The service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify or discontinue the service at any time with reasonable notice to users.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  In no event shall InvoiceFlow, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                  be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                  loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which our company is incorporated, 
                  without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>Email: legal@invoiceflow.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Business Street, Suite 100, Business City, BC 12345</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;