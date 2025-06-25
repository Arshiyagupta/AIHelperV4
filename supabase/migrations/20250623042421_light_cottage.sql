/*
  # Create Issues Table

  1. New Tables
    - `issues`
      - `id` (uuid, primary key)
      - `partner_a_id` (uuid, references users)
      - `partner_b_id` (uuid, references users)
      - `status` (enum: in_progress, proposal_sent, resolved, halted)
      - `summary` (text, auto-generated short description)
      - `red_flagged` (boolean, default false)
      - `created_at` (timestamp)
      - `resolved_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `issues` table
    - Add policies for partners to access their issues
    - Add constraint to ensure only one active issue per partner pair
*/

CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status issue_status NOT NULL DEFAULT 'in_progress',
  summary text DEFAULT '',
  red_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  
  -- Ensure partners are different
  CONSTRAINT different_partners CHECK (partner_a_id != partner_b_id),
  
  -- Ensure only one active issue per partner pair
  CONSTRAINT unique_active_issue UNIQUE (partner_a_id, partner_b_id) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Create partial unique index for active issues only
CREATE UNIQUE INDEX unique_active_issue_per_pair 
ON issues (LEAST(partner_a_id, partner_b_id), GREATEST(partner_a_id, partner_b_id))
WHERE status IN ('in_progress', 'proposal_sent');

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can read their issues"
  ON issues
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (users.id = partner_a_id OR users.id = partner_b_id)
    )
  );

CREATE POLICY "Partners can create issues"
  ON issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (users.id = partner_a_id OR users.id = partner_b_id)
    )
  );

CREATE POLICY "Partners can update their issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND (users.id = partner_a_id OR users.id = partner_b_id)
    )
  );