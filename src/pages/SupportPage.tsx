import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Mail, MessageSquare, User, Phone, HelpCircle, FileText, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SupportFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
}

const SupportPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportFormData>({
    defaultValues: {
      name: profile?.name || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data: SupportFormData) => {
    setLoading(true);
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id || null,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject,
          category: data.category,
          priority: data.priority,
          message: data.message,
          status: 'open',
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setSubmitted(true);
      toast.success('Support ticket submitted successfully!');
      reset();
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error('Failed to submit support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-xl border text-center">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ticket Submitted!</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Thank you for contacting us. We've received your support ticket and will get back to you within 24 hours.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 font-medium">What happens next?</p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Our support team will review your request</li>
                <li>• We'll respond within 24 hours (usually much faster!)</li>
              </ul>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Submit Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <HelpCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Need help? We're here to assist you. Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-xl border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Ticket</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      {...register('category', { required: 'Please select a category' })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select category</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="technical">Technical Issues</option>
                      <option value="feature">Feature Request</option>
                      <option value="account">Account Management</option>
                      <option value="general">General Inquiry</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <select
                      id="priority"
                      {...register('priority', { required: 'Please select priority' })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register('subject', {
                      required: 'Subject is required',
                      minLength: {
                        value: 5,
                        message: 'Subject must be at least 5 characters',
                      },
                    })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Brief description of your issue"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="message"
                      rows={6}
                      {...register('message', {
                        required: 'Message is required',
                        minLength: {
                          value: 20,
                          message: 'Message must be at least 20 characters',
                        },
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                      placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce the problem, and what you expected to happen."
                    />
                  </div>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="h-5 w-5 mr-2" />
                      Submit Ticket
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Response Times
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgent:</span>
                  <span className="font-medium text-red-600">2-4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">High:</span>
                  <span className="font-medium text-orange-600">4-8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medium:</span>
                  <span className="font-medium text-blue-600">8-24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Low:</span>
                  <span className="font-medium text-green-600">24-48 hours</span>
                </div>
              </div>
            </div>

            {/* Common Issues */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Common Issues
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Invoice not sending?</h4>
                  <p className="text-gray-600">Check your email settings and SMTP configuration.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Payment not received?</h4>
                  <p className="text-gray-600">Verify your payment gateway settings and webhook URLs.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Can't access account?</h4>
                  <p className="text-gray-600">Try resetting your password or contact support.</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>support@invoiceflow.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Mon-Fri, 9 AM - 6 PM EST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;