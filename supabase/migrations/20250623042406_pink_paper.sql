/*
  # SafeTalk Initial Database Setup

  1. Create custom types and enums
  2. Enable necessary extensions
  3. Set up initial configuration

  This migration sets up the foundation for SafeTalk's database schema.
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE issue_status AS ENUM ('in_progress', 'proposal_sent', 'resolved', 'halted');
CREATE TYPE sender_type AS ENUM ('user', 'ai');
CREATE TYPE notification_type AS ENUM ('new_issue', 'proposal_ready', 'issue_resolved');
CREATE TYPE ai_agent_type AS ENUM ('partner_ai', 'mediator_ai');

-- Function to generate partner codes
CREATE OR REPLACE FUNCTION generate_partner_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;