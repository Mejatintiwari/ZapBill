/*
  # Add Email Settings Table

  1. New Table
    - `email_settings` - Store SMTP configuration for Agency users

  2. Security
    - Enable RLS on the table
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);

-- Enable RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updating timestamp
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();