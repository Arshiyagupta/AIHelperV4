/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `auth_id` (uuid, references auth.users)
      - `email` (text, unique)
      - `name` (text, optional)
      - `partner_code` (text, unique, auto-generated)
      - `connected_user_id` (uuid, nullable, self-reference)
      - `fcm_token` (text, nullable, for push notifications)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read/write their own data only
    - Add trigger to auto-generate partner codes
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  partner_code text UNIQUE NOT NULL DEFAULT generate_partner_code(),
  connected_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  fcm_token text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

-- Trigger to ensure partner code uniqueness
CREATE OR REPLACE FUNCTION ensure_unique_partner_code()
RETURNS TRIGGER AS $$
BEGIN
  WHILE EXISTS (SELECT 1 FROM users WHERE partner_code = NEW.partner_code AND id != NEW.id) LOOP
    NEW.partner_code := generate_partner_code();
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_unique_partner_code
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unique_partner_code();