import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced validation with detailed error messages
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Supabase URL is not configured. Please check your .env file.');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Supabase Anon Key is not configured. Please check your .env file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.');
}

console.log('Supabase configuration:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone?: string;
          address?: string;
          default_currency: string;
          default_tax_rate: number;
          default_discount: number;
          plan: 'free' | 'pro' | 'agency';
          plan_expires_at?: string;
          is_banned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string;
          address?: string;
          default_currency?: string;
          default_tax_rate?: number;
          default_discount?: number;
          plan?: 'free' | 'pro' | 'agency';
          plan_expires_at?: string;
          is_banned?: boolean;
        };
        Update: {
          name?: string;
          phone?: string;
          address?: string;
          default_currency?: string;
          default_tax_rate?: number;
          default_discount?: number;
          plan?: 'free' | 'pro' | 'agency';
          plan_expires_at?: string;
          is_banned?: boolean;
          updated_at?: string;
        };
      };
      company_info: {
        Row: {
          id: string;
          user_id: string;
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
          custom_email_domain?: string;
          email_signature?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
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
          custom_email_domain?: string;
          email_signature?: string;
        };
        Update: {
          business_name?: string;
          company_email?: string;
          phone?: string;
          website?: string;
          logo?: string;
          address_line_1?: string;
          address_line_2?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          country?: string;
          custom_email_domain?: string;
          email_signature?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          business_name: string;
          phone: string;
          address?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          email: string;
          business_name: string;
          phone: string;
          address?: string;
        };
        Update: {
          name?: string;
          email?: string;
          business_name?: string;
          phone?: string;
          address?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
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
          is_recurring: boolean;
          recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          recurring_end_date?: string;
          parent_recurring_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          invoice_number: string;
          client_name: string;
          client_email: string;
          client_address?: string;
          client_phone?: string;
          client_business_name?: string;
          status?: string;
          currency?: string;
          subtotal: number;
          tax_enabled?: boolean;
          tax_rate?: number;
          tax_amount?: number;
          discount_enabled?: boolean;
          discount_type?: string;
          discount_value?: number;
          discount_amount?: number;
          total: number;
          notes?: string;
          terms?: string;
          estimated_completion?: string;
          due_date?: string;
          payment_gateway_url?: string;
          is_recurring?: boolean;
          recurring_frequency?: string;
          recurring_end_date?: string;
          parent_recurring_id?: string;
        };
        Update: {
          client_name?: string;
          client_email?: string;
          client_address?: string;
          client_phone?: string;
          client_business_name?: string;
          status?: string;
          currency?: string;
          subtotal?: number;
          tax_enabled?: boolean;
          tax_rate?: number;
          tax_amount?: number;
          discount_enabled?: boolean;
          discount_type?: string;
          discount_value?: number;
          discount_amount?: number;
          total?: number;
          notes?: string;
          terms?: string;
          estimated_completion?: string;
          due_date?: string;
          payment_gateway_url?: string;
          is_recurring?: boolean;
          recurring_frequency?: string;
          recurring_end_date?: string;
          parent_recurring_id?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          title: string;
          description?: string;
          hours?: number;
          rate: number;
          subtotal: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          invoice_id: string;
          title: string;
          description?: string;
          hours?: number;
          rate: number;
          subtotal: number;
          order_index: number;
        };
        Update: {
          title?: string;
          description?: string;
          hours?: number;
          rate?: number;
          subtotal?: number;
          order_index?: number;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          type: 'upi' | 'bank' | 'crypto' | 'payment_link' | 'custom';
          name: string;
          details: Record<string, any>;
          is_active: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          name: string;
          details: Record<string, any>;
          is_active?: boolean;
          order_index: number;
        };
        Update: {
          name?: string;
          details?: Record<string, any>;
          is_active?: boolean;
          order_index?: number;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id?: string;
          name: string;
          email: string;
          phone?: string;
          subject: string;
          category: 'billing' | 'technical' | 'feature' | 'account' | 'general';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          message: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          assigned_to?: string;
          admin_response?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          name: string;
          email: string;
          phone?: string;
          subject: string;
          category: string;
          priority: string;
          message: string;
          status?: string;
          assigned_to?: string;
          admin_response?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          subject?: string;
          category?: string;
          priority?: string;
          message?: string;
          status?: string;
          assigned_to?: string;
          admin_response?: string;
          updated_at?: string;
        };
      };
      feedback_submissions: {
        Row: {
          id: string;
          user_id?: string;
          name: string;
          email: string;
          type: 'general' | 'feature' | 'bug' | 'improvement' | 'compliment';
          rating?: number;
          message: string;
          status: 'new' | 'reviewed' | 'implemented' | 'rejected';
          admin_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          name: string;
          email: string;
          type: string;
          rating?: number;
          message: string;
          status?: string;
          admin_notes?: string;
        };
        Update: {
          name?: string;
          email?: string;
          type?: string;
          rating?: number;
          message?: string;
          status?: string;
          admin_notes?: string;
          updated_at?: string;
        };
      };
      admin_activity_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_type?: string;
          target_id?: string;
          details: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
          created_at: string;
        };
        Insert: {
          admin_user_id: string;
          action: string;
          target_type?: string;
          target_id?: string;
          details?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
        };
        Update: {
          action?: string;
          target_type?: string;
          target_id?: string;
          details?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          user_id?: string;
          invoice_id?: string;
          recipient_email: string;
          subject: string;
          email_type: 'invoice' | 'welcome' | 'password_reset' | 'notification';
          status: 'sent' | 'failed' | 'pending' | 'bounced';
          error_message?: string;
          sent_at?: string;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          invoice_id?: string;
          recipient_email: string;
          subject: string;
          email_type: string;
          status: string;
          error_message?: string;
          sent_at?: string;
        };
        Update: {
          recipient_email?: string;
          subject?: string;
          email_type?: string;
          status?: string;
          error_message?: string;
          sent_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string;
          role: 'admin' | 'member' | 'viewer';
          status: 'pending' | 'active' | 'inactive';
          invited_by: string;
          invited_at: string;
          joined_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          name: string;
          role?: string;
          status?: string;
          invited_by: string;
          invited_at?: string;
          joined_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: string;
          status?: string;
          invited_by?: string;
          invited_at?: string;
          joined_at?: string;
          updated_at?: string;
        };
      };
      recurring_invoices: {
        Row: {
          id: string;
          user_id: string;
          template_name: string;
          client_name: string;
          client_email: string;
          client_address?: string;
          client_phone?: string;
          client_business_name?: string;
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
          frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          start_date: string;
          end_date?: string;
          next_invoice_date: string;
          is_active: boolean;
          notes?: string;
          terms?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          template_name: string;
          client_name: string;
          client_email: string;
          client_address?: string;
          client_phone?: string;
          client_business_name?: string;
          currency?: string;
          subtotal?: number;
          tax_enabled?: boolean;
          tax_rate?: number;
          tax_amount?: number;
          discount_enabled?: boolean;
          discount_type?: string;
          discount_value?: number;
          discount_amount?: number;
          total?: number;
          frequency: string;
          start_date: string;
          end_date?: string;
          next_invoice_date: string;
          is_active?: boolean;
          notes?: string;
          terms?: string;
        };
        Update: {
          template_name?: string;
          client_name?: string;
          client_email?: string;
          client_address?: string;
          client_phone?: string;
          client_business_name?: string;
          currency?: string;
          subtotal?: number;
          tax_enabled?: boolean;
          tax_rate?: number;
          tax_amount?: number;
          discount_enabled?: boolean;
          discount_type?: string;
          discount_value?: number;
          discount_amount?: number;
          total?: number;
          frequency?: string;
          start_date?: string;
          end_date?: string;
          next_invoice_date?: string;
          is_active?: boolean;
          notes?: string;
          terms?: string;
          updated_at?: string;
        };
      };
      client_portal_access: {
        Row: {
          id: string;
          user_id: string;
          client_email: string;
          access_token: string;
          expires_at?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          client_email: string;
          access_token: string;
          expires_at?: string;
          is_active?: boolean;
        };
        Update: {
          client_email?: string;
          access_token?: string;
          expires_at?: string;
          is_active?: boolean;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          api_key: string;
          permissions: Record<string, any>;
          is_active: boolean;
          last_used_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          api_key: string;
          permissions?: Record<string, any>;
          is_active?: boolean;
          last_used_at?: string;
        };
        Update: {
          name?: string;
          api_key?: string;
          permissions?: Record<string, any>;
          is_active?: boolean;
          last_used_at?: string;
          updated_at?: string;
        };
      };
      white_label_settings: {
        Row: {
          id: string;
          user_id: string;
          custom_domain?: string;
          primary_color: string;
          secondary_color: string;
          logo_url?: string;
          favicon_url?: string;
          custom_css?: string;
          hide_branding: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          custom_domain?: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string;
          favicon_url?: string;
          custom_css?: string;
          hide_branding?: boolean;
        };
        Update: {
          custom_domain?: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string;
          favicon_url?: string;
          custom_css?: string;
          hide_branding?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};