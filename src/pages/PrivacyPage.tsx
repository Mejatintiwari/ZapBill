import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
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
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-600">Last updated: December 2024</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              Your privacy is important to us. This Privacy Policy explains how ZapBill collects, uses, and protects your information when you use our service.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 space-y-8">
            {/* Section 1 */}
            <section>
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you create an account with ZapBill, we collect information that identifies you, such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Name and email address</li>
                  <li>Phone number (optional)</li>
                  <li>Business information (company name, address)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Profile information you choose to provide</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We automatically collect certain information when you use our service:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Log data (IP address, browser type, pages visited)</li>
                  <li>Device information (device type, operating system)</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Service Provision:</strong> To provide, maintain, and improve our invoicing services</li>
                  <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
                  <li><strong>Communication:</strong> To send you service-related notifications, updates, and marketing communications (with your consent)</li>
                  <li><strong>Analytics:</strong> To understand how our service is used and improve user experience</li>
                  <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">3. Information Sharing</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We work with trusted third-party service providers who assist us in operating our service:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li>Payment processors (Stripe, PayPal) for handling transactions</li>
                  <li>Cloud hosting providers (AWS, Google Cloud) for data storage</li>
                  <li>Email service providers for sending notifications</li>
                  <li>Analytics providers for understanding service usage</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may disclose your information if required by law or in response to valid legal requests, such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Court orders or subpoenas</li>
                  <li>Government investigations</li>
                  <li>Protection of our rights and property</li>
                  <li>Prevention of fraud or illegal activities</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center mb-4">
                <Lock className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">4. Data Security</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li><strong>Encryption:</strong> All data is encrypted in transit using TLS 1.3 and at rest using AES-256</li>
                  <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms</li>
                  <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
                  <li><strong>Secure Infrastructure:</strong> Hosting on secure, compliant cloud platforms</li>
                  <li><strong>Employee Training:</strong> Regular security training for all team members</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. 
                  We cannot guarantee absolute security but are committed to protecting your data using industry best practices.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
                  <li><strong>Invoice Data:</strong> Retained for 7 years for tax and legal compliance purposes</li>
                  <li><strong>Usage Logs:</strong> Retained for 12 months for security and analytics purposes</li>
                  <li><strong>Marketing Data:</strong> Retained until you unsubscribe or request deletion</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                  <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                  <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  To exercise these rights, please contact us at privacy@ZapBill.com. We will respond to your request within 30 days.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                  <li><strong>Essential Cookies:</strong> Required for the service to function properly</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our service.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">8. International Transfers</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws through:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Adequacy decisions by relevant authorities</li>
                  <li>Standard contractual clauses approved by regulatory bodies</li>
                  <li>Certification schemes and codes of conduct</li>
                  <li>Binding corporate rules for intra-group transfers</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
                  If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                  For significant changes, we may also send you an email notification.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@ZapBill.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> 123 Business Street, Suite 100, Business City, BC 12345</p>
                <p><strong>Data Protection Officer:</strong> dpo@ZapBill.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;