/*
  # Create AI Events Table (Optional - for debugging/telemetry)

  1. New Tables
    - `ai_events`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `agent` (enum: partner_ai, mediator_ai)
      - `input` (text, prompt input)
      - `output` (text, AI response)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `ai_events` table
    - Restrict access to system/admin level only
*/

CREATE TABLE IF NOT EXISTS ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  agent ai_agent_type NOT NULL,
  input text NOT NULL,
  output text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_ai_events_issue_created ON ai_events(issue_id, created_at DESC);
CREATE INDEX idx_ai_events_agent ON ai_events(agent, created_at DESC);

-- Enable RLS
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Restrictive - only for system/admin access)
CREATE POLICY "System only access to AI events"
  ON ai_events
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Note: In production, you might want to create a separate service role
-- for AI event logging that bypasses RLS