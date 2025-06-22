/*
  # Add Admin Tables for Support and Feedback

  1. New Tables
    - `support_tickets` - Store support requests
    - `feedback_submissions` - Store user feedback
    - `admin_activity_logs` - Track admin actions
    - `email_logs` - Track email delivery status

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('billing', 'technical', 'feature', 'account', 'general')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to text,
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feedback submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  type text NOT NULL CHECK (type IN ('general', 'feature', 'bug', 'improvement', 'compliment')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin activity logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text, -- 'user', 'invoice', 'ticket', etc.
  target_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('invoice', 'welcome', 'password_reset', 'notification')),
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending', 'bounced')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_id ON feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at ON feedback_submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user_id ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

CREATE POLICY "Users can create support tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update support tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

-- RLS Policies for feedback_submissions
CREATE POLICY "Users can view own feedback"
  ON feedback_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

CREATE POLICY "Users can create feedback"
  ON feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update feedback"
  ON feedback_submissions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

-- RLS Policies for admin_activity_logs
CREATE POLICY "Admins can view activity logs"
  ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

CREATE POLICY "Admins can create activity logs"
  ON admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

-- RLS Policies for email_logs
CREATE POLICY "Admins can view email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@invoiceapp.com'));

CREATE POLICY "System can create email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create triggers for updating timestamps
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_submissions_updated_at
  BEFORE UPDATE ON feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();