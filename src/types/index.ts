export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  default_currency: string;
  default_tax_rate: number;
  default_discount: number;
  plan?: 'free' | 'pro' | 'agency';
  plan_expires_at?: string;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyInfo {
  business_name: string;
  company_email: string;
  phone: string;
  website?: string;
  logo?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address?: string;
  client_phone?: string;
  client_business_name?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  currency: string;
  subtotal: number;
  tax_enabled: boolean;
  tax_rate: number;
  tax_amount: number;
  discount_enabled: boolean;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  discount_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  estimated_completion?: string;
  due_date?: string;
  payment_gateway_url?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  title: string;
  description?: string;
  hours?: number;
  rate: number;
  subtotal: number;
  order_index: number;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'upi' | 'bank' | 'crypto' | 'payment_link' | 'custom';
  name: string;
  details: Record<string, any>;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface Client {
  id?: string;
  name: string;
  email: string;
  business_name: string;
  phone: string;
  address?: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'inactive';
  invited_at: string;
  joined_at?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price_monthly_inr: number;
  price_monthly_usd: number;
  price_yearly_inr: number;
  price_yearly_usd: number;
  features: string[];
  is_popular?: boolean;
  trial_days?: number;
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price_monthly_inr: 0,
    price_monthly_usd: 0,
    price_yearly_inr: 0,
    price_yearly_usd: 0,
    features: [
      'Up to 5 invoices per month',
      'Basic client management',
      'PDF export',
      'Basic templates',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price_monthly_inr: 299,
    price_monthly_usd: 3.50,
    price_yearly_inr: 2499,
    price_yearly_usd: 29,
    features: [
      'Unlimited invoices',
      'Unlimited client profiles',
      'Email invoices to clients via SMTP',
      'Save default services/rates',
      'Enable/disable Tax, Discounts, Hours',
      'Customize invoice number formats',
      'Add UPI, Bank & Crypto Payment Details',
      'QR Code Generator',
      'Invoice notes, terms, delivery estimate',
      'Priority email support',
      '14-day free trial'
    ],
    trial_days: 14,
    is_popular: true
  },
  {
    id: 'agency',
    name: 'Agency Plan',
    price_monthly_inr: 699,
    price_monthly_usd: 8.17,
    price_yearly_inr: 5999,
    price_yearly_usd: 70,
    features: [
      'Everything in Pro Plan',
      'Team access (up to 5 users)',
      'Client portal (view/download invoices)',
      'Recurring invoices',
      'Branded email (from your domain)',
      'Proposal → Invoice conversion',
      'Priority support',
      'Custom invoice templates',
      'Activity log with export',
      'Advanced analytics & reporting',
      'White-label branding options',
      'API access for integrations'
    ]
  }
];