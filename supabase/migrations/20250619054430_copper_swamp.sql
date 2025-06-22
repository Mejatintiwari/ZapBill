/*
  # Add Agency Plan Features

  1. New Tables
    - `team_members` - Team access for Agency plan
    - `recurring_invoices` - Recurring invoice templates
    - `client_portal_access` - Client portal access tokens
    - `api_keys` - API access for integrations
    - `white_label_settings` - White-label branding options

  2. Updates to existing tables
    - Add recurring fields to invoices table
    - Add branding fields to company_info table

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Team members table for Agency plan
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Recurring invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_address text,
  client_phone text,
  client_business_name text,
  currency text DEFAULT 'USD',
  subtotal decimal(10,2) DEFAULT 0.00,
  tax_enabled boolean DEFAULT false,
  tax_rate decimal(5,2) DEFAULT 0.00,
  tax_amount decimal(10,2) DEFAULT 0.00,
  discount_enabled boolean DEFAULT false,
  discount_type text DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percentage')),
  discount_value decimal(10,2) DEFAULT 0.00,
  discount_amount decimal(10,2) DEFAULT 0.00,
  total decimal(10,2) DEFAULT 0.00,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  next_invoice_date date NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client portal access table
CREATE TABLE IF NOT EXISTS client_portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_email text NOT NULL,
  access_token text NOT NULL UNIQUE,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, client_email)
);

-- API keys table for integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_key text NOT NULL UNIQUE,
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- White-label settings table
CREATE TABLE IF NOT EXISTS white_label_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_domain text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  logo_url text,
  favicon_url text,
  custom_css text,
  hide_branding boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Add recurring fields to invoices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE invoices ADD COLUMN is_recurring boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'recurring_frequency'
  ) THEN
    ALTER TABLE invoices ADD COLUMN recurring_frequency text CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'recurring_end_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN recurring_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'parent_recurring_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN parent_recurring_id uuid REFERENCES recurring_invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add branding fields to company_info table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'custom_email_domain'
  ) THEN
    ALTER TABLE company_info ADD COLUMN custom_email_domain text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'email_signature'
  ) THEN
    ALTER TABLE company_info ADD COLUMN email_signature text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_date ON recurring_invoices(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_token ON client_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_white_label_settings_user_id ON white_label_settings(user_id);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members (Agency plan only)
CREATE POLICY "Agency users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

CREATE POLICY "Agency users can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

-- RLS Policies for recurring_invoices (Agency plan only)
CREATE POLICY "Agency users can view recurring invoices"
  ON recurring_invoices
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

CREATE POLICY "Agency users can manage recurring invoices"
  ON recurring_invoices
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

-- RLS Policies for client_portal_access (Agency plan only)
CREATE POLICY "Agency users can view client portal access"
  ON client_portal_access
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

CREATE POLICY "Agency users can manage client portal access"
  ON client_portal_access
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

-- RLS Policies for api_keys (Agency plan only)
CREATE POLICY "Agency users can view API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

CREATE POLICY "Agency users can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

-- RLS Policies for white_label_settings (Agency plan only)
CREATE POLICY "Agency users can view white label settings"
  ON white_label_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

CREATE POLICY "Agency users can manage white label settings"
  ON white_label_settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan = 'agency')
  );

-- Create triggers for updating timestamps
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_settings_updated_at
  BEFORE UPDATE ON white_label_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();