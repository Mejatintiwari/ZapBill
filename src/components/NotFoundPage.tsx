import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, FileText, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="bg-blue-100 p-4 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Search className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-8xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Oops! The page you're looking for seems to have wandered off. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium text-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Quick Links</h3>
              <div className="space-y-1 text-sm">
                <Link to="/invoices" className="block text-blue-600 hover:text-blue-500">View Invoices</Link>
                <Link to="/clients" className="block text-blue-600 hover:text-blue-500">Manage Clients</Link>
                <Link to="/analytics" className="block text-blue-600 hover:text-blue-500">Analytics</Link>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Need help? <Link to="/support" className="text-blue-600 hover:text-blue-500 font-medium">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;