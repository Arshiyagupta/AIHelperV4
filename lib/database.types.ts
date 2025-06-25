export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string
          email: string
          name: string | null
          partner_code: string
          connected_user_id: string | null
          fcm_token: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          name?: string | null
          partner_code?: string
          connected_user_id?: string | null
          fcm_token?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          name?: string | null
          partner_code?: string
          connected_user_id?: string | null
          fcm_token?: string | null
          created_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          partner_a_id: string
          partner_b_id: string
          status: 'in_progress' | 'proposal_sent' | 'resolved' | 'halted'
          summary: string
          red_flagged: boolean
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          partner_a_id: string
          partner_b_id: string
          status?: 'in_progress' | 'proposal_sent' | 'resolved' | 'halted'
          summary?: string
          red_flagged?: boolean
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          partner_a_id?: string
          partner_b_id?: string
          status?: 'in_progress' | 'proposal_sent' | 'resolved' | 'halted'
          summary?: string
          red_flagged?: boolean
          created_at?: string
          resolved_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          issue_id: string
          sender_type: 'user' | 'ai'
          sender_id: string | null
          content: string
          is_flagged: boolean
          created_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          sender_type: 'user' | 'ai'
          sender_id?: string | null
          content: string
          is_flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          sender_type?: 'user' | 'ai'
          sender_id?: string | null
          content?: string
          is_flagged?: boolean
          created_at?: string
        }
      }
      mediator_logs: {
        Row: {
          id: string
          issue_id: string
          version: number
          content: string
          internal_score: number
          accepted_by_a: boolean
          accepted_by_b: boolean
          created_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          version?: number
          content: string
          internal_score?: number
          accepted_by_a?: boolean
          accepted_by_b?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          version?: number
          content?: string
          internal_score?: number
          accepted_by_a?: boolean
          accepted_by_b?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'new_issue' | 'proposal_ready' | 'issue_resolved'
          is_read: boolean
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'new_issue' | 'proposal_ready' | 'issue_resolved'
          is_read?: boolean
          payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'new_issue' | 'proposal_ready' | 'issue_resolved'
          is_read?: boolean
          payload?: Json
          created_at?: string
        }
      }
      ai_events: {
        Row: {
          id: string
          issue_id: string | null
          agent: 'partner_ai' | 'mediator_ai'
          input: string
          output: string
          created_at: string
        }
        Insert: {
          id?: string
          issue_id?: string | null
          agent: 'partner_ai' | 'mediator_ai'
          input: string
          output: string
          created_at?: string
        }
        Update: {
          id?: string
          issue_id?: string | null
          agent?: 'partner_ai' | 'mediator_ai'
          input?: string
          output?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_partner_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      issue_status: 'in_progress' | 'proposal_sent' | 'resolved' | 'halted'
      sender_type: 'user' | 'ai'
      notification_type: 'new_issue' | 'proposal_ready' | 'issue_resolved'
      ai_agent_type: 'partner_ai' | 'mediator_ai'
    }
  }
}