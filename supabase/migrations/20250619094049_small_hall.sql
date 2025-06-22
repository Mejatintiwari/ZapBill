/*
  # Add Email Settings and Admin Features

  1. New Tables
    - `email_settings` - Store SMTP configuration for Agency users
    - `admin_settings` - Store system-wide admin settings
    - `user_sessions` - Track user login sessions for security

  2. Updates to existing tables
    - Add email configuration fields

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Email settings table for Agency users
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('gmail', 'sendinblue', 'hostinger', 'custom')),
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL,
  smtp_secure boolean DEFAULT true,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  from_name text NOT NULL,
  from_email text NOT NULL,
  reply_to text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User sessions table for security tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  login_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Enable RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_settings (Agency plan only)
CREATE POLICY "Agency users can view email settings"
  ON email_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

CREATE POLICY "Agency users can manage email settings"
  ON email_settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

-- RLS Policies for admin_settings (Admin only)
CREATE POLICY "Admins can view admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

CREATE POLICY "Admins can manage admin settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

-- Create triggers for updating timestamps
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
  ('default_currency', '"USD"', 'Default currency for new users'),
  ('default_tax_rate', '0', 'Default tax rate percentage'),
  ('default_discount', '0', 'Default discount percentage'),
  ('available_currencies', '["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"]', 'Available currencies'),
  ('features_enabled', '{"qr_codes": true, "crypto_payments": true, "recurring_invoices": true}', 'Feature toggles'),
  ('support_email', '"help@getallscripts.com"', 'Support contact email'),
  ('company_name', '"ZapBill"', 'Company name for branding')
ON CONFLICT (setting_key) DO NOTHING;