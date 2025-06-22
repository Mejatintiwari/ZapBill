import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Mail, MessageSquare, Star, User, Lightbulb, Bug, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FeedbackFormData {
  name: string;
  email: string;
  type: string;
  rating: number;
  message: string;
}

const FeedbackPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    defaultValues: {
      name: profile?.name || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data: FeedbackFormData) => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('feedback_submissions')
        .insert({
          user_id: user?.id || null,
          name: data.name,
          email: data.email,
          type: data.type,
          rating: rating,
          message: data.message,
          status: 'new',
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      reset();
      setRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
    setValue('rating', value);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-xl border text-center">
            <div className="bg-pink-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Heart className="h-10 w-10 text-pink-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve ZapBill.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <p className="text-purple-800 font-medium">Your feedback matters!</p>
              <p className="text-purple-700 text-sm mt-1">
                We read every piece of feedback and use it to make ZapBill better for everyone.
              </p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Submit More Feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="bg-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">We Value Your Feedback</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us improve ZapBill by sharing your thoughts, suggestions, and experiences with us.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-xl border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Share Your Feedback</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="Your name"
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Type *
                  </label>
                  <select
                    id="type"
                    {...register('type', { required: 'Please select feedback type' })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select feedback type</option>
                    <option value="general">General Feedback</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="improvement">Improvement Suggestion</option>
                    <option value="compliment">Compliment</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Overall Rating *
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`p-1 rounded transition-colors ${
                          star <= (hoverRating || rating) 
                            ? 'text-yellow-400 hover:text-yellow-500' 
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <Star className="h-8 w-8 fill-current" />
                      </button>
                    ))}
                    <span className="ml-4 text-sm font-medium text-gray-700">
                      {rating > 0 && (
                        <>
                          {rating} star{rating !== 1 ? 's' : ''} - {getRatingText(rating)}
                        </>
                      )}
                    </span>
                  </div>
                  {rating === 0 && (
                    <p className="mt-1 text-sm text-red-600">Please select a rating</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="message"
                      rows={6}
                      {...register('message', {
                        required: 'Feedback message is required',
                        minLength: {
                          value: 10,
                          message: 'Feedback must be at least 10 characters',
                        },
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-colors"
                      placeholder="Share your thoughts about ZapBill. What do you love? What could be better? Any features you'd like to see?"
                    />
                  </div>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="h-5 w-5 mr-2" />
                      Submit Feedback
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What We're Looking For */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-purple-600" />
                What We're Looking For
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <div className="bg-purple-100 p-1 rounded mr-2 mt-0.5">
                    <Star className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>Feature requests and suggestions</span>
                </div>
                <div className="flex items-start">
                  <div className="bg-red-100 p-1 rounded mr-2 mt-0.5">
                    <Bug className="h-3 w-3 text-red-600" />
                  </div>
                  <span>Bug reports and issues you've encountered</span>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-1 rounded mr-2 mt-0.5">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>General thoughts about user experience</span>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 p-1 rounded mr-2 mt-0.5">
                    <Lightbulb className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Ideas for improving the invoice process</span>
                </div>
              </div>
            </div>

            {/* Recent Updates */}
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Recent Updates</h3>
              <div className="space-y-3 text-sm text-purple-800">
                <div>
                  <h4 className="font-medium">✨ New Features</h4>
                  <p>Added client portal and proposal conversion</p>
                </div>
                <div>
                  <h4 className="font-medium">🐛 Bug Fixes</h4>
                  <p>Improved invoice PDF generation</p>
                </div>
                <div>
                  <h4 className="font-medium">🚀 Performance</h4>
                  <p>Faster loading times across the app</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Have Questions?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you need immediate help or have specific questions, our support team is here for you.
              </p>
              <button className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;