import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Zap, 
  Shield, 
  Users, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Star,
  Globe,
  Smartphone,
  Mail,
  Crown
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Professional Invoices",
      description: "Create stunning, professional invoices in minutes with our intuitive interface."
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Multiple Payment Methods",
      description: "Accept payments via UPI, bank transfers, cryptocurrency, and payment links."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Analytics & Tracking",
      description: "Monitor your revenue, client relationships, and business growth with detailed analytics."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Reliable",
      description: "Bank-level security with 256-bit SSL encryption and secure data storage."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Client Management",
      description: "Organize and manage your clients with detailed profiles and communication history."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Multi-Currency Support",
      description: "Work with clients globally with support for 15+ currencies and automatic conversion."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelance Designer",
      content: "InvoiceFlow has transformed how I handle billing. I've reduced my invoicing time by 80% and get paid faster than ever.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Digital Agency Owner",
      content: "The team features and client portal are game-changers. Our clients love being able to view and download their invoices anytime.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Consultant",
      content: "Simple, powerful, and professional. Everything I need to run my business efficiently in one place.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Up to 5 invoices per month",
        "Basic client management",
        "PDF export",
        "Email support"
      ],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Pro",
      price: "₹299",
      period: "per month",
      description: "Ideal for growing freelancers",
      features: [
        "Unlimited invoices",
        "Unlimited client profiles",
        "Email invoices to clients",
        "Proposal to invoice conversion",
        "Multiple payment methods",
        "Priority support"
      ],
      cta: "Try Pro Plan",
      highlight: true
    },
    {
      name: "Agency",
      price: "₹699",
      period: "per month",
      description: "For teams and agencies",
      features: [
        "Everything in Pro Plan",
        "Team access (up to 5 users)",
        "Client portal access",
        "Recurring invoices",
        "Branded emails",
        "White-label options"
      ],
      cta: "Try Agency Plan",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">InvoiceFlow</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Features</a>
              <a href="#pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Pricing</a>
              <a href="#testimonials" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Testimonials</a>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Login</Link>
              <Link to="/signup" className="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                Professional Invoicing <span className="text-blue-600">Made Simple</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Create stunning invoices, manage clients, track payments, and grow your business with our comprehensive invoicing platform.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a href="#features" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg">
                  Learn More
                </a>
              </div>
              <div className="mt-8 flex items-center">
                <div className="flex -space-x-1 overflow-hidden">
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=60" alt="" />
                </div>
                <div className="ml-3 text-sm text-gray-600">
                  Trusted by 10,000+ freelancers and agencies
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Invoice Dashboard" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Powerful Features for Your Business
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Everything you need to manage your invoicing workflow efficiently
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 inline-flex p-3 rounded-lg text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-blue-50 rounded-2xl p-8 lg:p-12">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Streamline Your Invoicing Process
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Our platform helps you create professional invoices in minutes, not hours. Focus on your work, not your paperwork.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <span className="text-gray-700">Create branded invoices with your logo and colors</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <span className="text-gray-700">Send invoices directly to clients via email</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <span className="text-gray-700">Track payment status and send reminders</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <span className="text-gray-700">Generate detailed reports for financial planning</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 lg:mt-0">
                <img 
                  src="https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Invoice Creation" 
                  className="rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Loved by Freelancers and Agencies
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Don't just take our word for it. Here's what our customers have to say.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Start with our free plan and upgrade as your business grows
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-xl shadow-sm border p-8 hover:shadow-md transition-shadow ${
                  plan.highlight ? 'border-blue-500 ring-2 ring-blue-100 transform scale-105' : ''
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="ml-1 text-gray-500">/{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/signup" 
                  className={`w-full inline-flex justify-center items-center px-4 py-3 rounded-lg font-medium ${
                    plan.highlight 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to streamline your invoicing?
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Join thousands of freelancers and agencies who have transformed their billing process with InvoiceFlow.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:text-lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700 md:text-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <Smartphone className="h-6 w-6 text-white mb-2" />
                    <p className="text-white font-medium">Mobile Friendly</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <Shield className="h-6 w-6 text-white mb-2" />
                    <p className="text-white font-medium">Secure & Private</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <Mail className="h-6 w-6 text-white mb-2" />
                    <p className="text-white font-medium">Email Integration</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <Crown className="h-6 w-6 text-white mb-2" />
                    <p className="text-white font-medium">Premium Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">InvoiceFlow</span>
              </div>
              <p className="mt-4 text-gray-400">
                Professional invoicing software for freelancers and agencies.
              </p>
              <div className="mt-6 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Product</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Updates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Support</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/support" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link to="/support" className="text-gray-400 hover:text-white">Contact Us</Link></li>
                <li><Link to="/feedback" className="text-gray-400 hover:text-white">Feedback</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/refund-policy" className="text-gray-400 hover:text-white">Refund Policy</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm text-center">
              &copy; {new Date().getFullYear()} InvoiceFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;