/*
  # Add plan fields to users table

  1. Changes
    - Add plan field to users table
    - Add plan_expires_at field to users table
    - Add is_banned field to users table

  2. Security
    - Maintain existing RLS policies
*/

-- Add plan-related fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan'
  ) THEN
    ALTER TABLE users ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN plan_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
END $$;