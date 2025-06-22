import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoice from './pages/CreateInvoice';
import EditInvoice from './pages/EditInvoice';
import ClientsPage from './pages/ClientsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPanel from './pages/AdminPanel';
import SupportPage from './pages/SupportPage';
import FeedbackPage from './pages/FeedbackPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccess from './pages/PaymentSuccess';
import ClientPortal from './pages/ClientPortal';
import ProposalToInvoice from './pages/ProposalToInvoice';
import AgencyFeatures from './pages/AgencyFeatures';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPolicy from './pages/RefundPolicy';
import NotFoundPage from './components/NotFoundPage';
import LandingPage from './pages/LandingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
                    <LoginForm />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <AuthLayout title="Create Account" subtitle="Start your journey with us">
                    <SignupForm />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <AuthLayout title="Reset Password" subtitle="Enter your email to reset your password">
                    <ForgotPasswordForm />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/client/:token" element={<ClientPortal />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/new" element={<CreateInvoice />} />
              <Route path="invoices/:id/edit" element={<EditInvoice />} />
              <Route path="proposal-to-invoice" element={<ProposalToInvoice />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="payments" element={<PaymentMethodsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="agency" element={<AgencyFeatures />} />
              <Route path="admin" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;