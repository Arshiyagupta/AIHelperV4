/*
  # Create Messages Table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `sender_type` (enum: user, ai)
      - `sender_id` (uuid, references users for user messages)
      - `content` (text, message content)
      - `is_flagged` (boolean, for red flag detection)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for users to access messages in their issues
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_messages_issue_created ON messages(issue_id, created_at);
CREATE INDEX idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read messages in their issues"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues 
      JOIN users ON (users.id = issues.partner_a_id OR users.id = issues.partner_b_id)
      WHERE issues.id = messages.issue_id 
      AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their issues"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues 
      JOIN users ON (users.id = issues.partner_a_id OR users.id = issues.partner_b_id)
      WHERE issues.id = messages.issue_id 
      AND users.auth_id = auth.uid()
    )
  );