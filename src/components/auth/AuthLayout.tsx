import React from 'react';
import { FileText, Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <div className="flex items-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">InvoiceFlow</h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-6 leading-tight">
            Professional Invoicing Made Simple
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Create stunning invoices, manage clients, track payments, and grow your business with our comprehensive invoicing platform.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-300 mr-3" />
              <span className="text-blue-100">Lightning-fast invoice generation</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-300 mr-3" />
              <span className="text-blue-100">Multiple payment methods</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-300 mr-3" />
              <span className="text-blue-100">Real-time analytics & tracking</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4 lg:hidden">
                <div className="bg-blue-600 p-2 rounded-xl mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">InvoiceFlow</h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;