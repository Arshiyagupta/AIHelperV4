/*
  # Create Mediator Logs Table

  1. New Tables
    - `mediator_logs`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `version` (integer, sequential version number)
      - `content` (text, AI-generated solution)
      - `internal_score` (float, 0.0-1.0 readiness score)
      - `accepted_by_a` (boolean, partner A acceptance)
      - `accepted_by_b` (boolean, partner B acceptance)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `mediator_logs` table
    - Add policies for partners to access proposals for their issues
*/

CREATE TABLE IF NOT EXISTS mediator_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  content text NOT NULL,
  internal_score float NOT NULL DEFAULT 0.0 CHECK (internal_score >= 0.0 AND internal_score <= 1.0),
  accepted_by_a boolean DEFAULT false,
  accepted_by_b boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique version per issue
  UNIQUE(issue_id, version)
);

-- Create index for efficient querying
CREATE INDEX idx_mediator_logs_issue_version ON mediator_logs(issue_id, version DESC);

-- Enable RLS
ALTER TABLE mediator_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can read proposals for their issues"
  ON mediator_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues 
      JOIN users ON (users.id = issues.partner_a_id OR users.id = issues.partner_b_id)
      WHERE issues.id = mediator_logs.issue_id 
      AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "System can insert proposals"
  ON mediator_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Partners can update acceptance status"
  ON mediator_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues 
      JOIN users ON (users.id = issues.partner_a_id OR users.id = issues.partner_b_id)
      WHERE issues.id = mediator_logs.issue_id 
      AND users.auth_id = auth.uid()
    )
  );