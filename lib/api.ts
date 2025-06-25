import { supabase } from './supabase';

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'}/functions/v1`;

// Helper to get auth headers
async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token || 'placeholder-token'}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    return {
      'Authorization': 'Bearer placeholder-token',
      'Content-Type': 'application/json',
    };
  }
}

// API Functions
export const api = {
  // Connect with partner using partner code
  async connectPartner(partnerCode: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTIONS_URL}/connect-partner`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ partnerCode }),
      });
      return response.json();
    } catch (error) {
      console.error('Connect partner error:', error);
      return { error: 'Failed to connect with partner' };
    }
  },

  // Create a new issue
  async createIssue(title?: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTIONS_URL}/create-issue`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title }),
      });
      return response.json();
    } catch (error) {
      console.error('Create issue error:', error);
      return { error: 'Failed to create issue' };
    }
  },

  // Send a message in an issue
  async sendMessage(issueId: string, content: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTIONS_URL}/send-message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ issueId, content }),
      });
      return response.json();
    } catch (error) {
      console.error('Send message error:', error);
      return { error: 'Failed to send message' };
    }
  },

  // Submit vote on solution proposal
  async submitSolutionVote(proposalId: string, accept: boolean) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTIONS_URL}/submit-solution-vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposalId, accept }),
      });
      return response.json();
    } catch (error) {
      console.error('Submit vote error:', error);
      return { error: 'Failed to submit vote' };
    }
  },

  // Get comprehensive user data
  async getUserData() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTIONS_URL}/get-user-data`, {
        method: 'GET',
        headers,
      });
      return response.json();
    } catch (error) {
      console.error('Get user data error:', error);
      return { error: 'Failed to load user data' };
    }
  },

  // Send notification
  async sendNotification(userId: string, type: 'new_issue' | 'proposal_ready' | 'issue_resolved', payload: Record<string, any>) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${FUNCTIONS_URL}/send-notification`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, type, payload }),
      });
      return response.json();
    } catch (error) {
      console.error('Send notification error:', error);
      return { error: 'Failed to send notification' };
    }
  },

  // Mark notification as read
  async markNotificationRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      return { error: error?.message };
    } catch (error) {
      console.error('Mark notification read error:', error);
      return { error: 'Failed to mark notification as read' };
    }
  },

  // Update FCM token
  async updateFCMToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update({ fcm_token: token })
        .eq('auth_id', user.id);
      
      return { error: error?.message };
    } catch (error) {
      console.error('Update FCM token error:', error);
      return { error: 'Failed to update FCM token' };
    }
  }
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to messages for an issue
  subscribeToMessages(issueId: string, callback: (payload: any) => void) {
    try {
      return supabase
        .channel(`messages:${issueId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `issue_id=eq.${issueId}`
        }, callback)
        .subscribe();
    } catch (error) {
      console.error('Subscribe to messages error:', error);
      return { unsubscribe: () => {} };
    }
  },

  // Subscribe to notifications for current user
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    try {
      return supabase
        .channel(`notifications:${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, callback)
        .subscribe();
    } catch (error) {
      console.error('Subscribe to notifications error:', error);
      return { unsubscribe: () => {} };
    }
  },

  // Subscribe to issue updates
  subscribeToIssues(userId: string, callback: (payload: any) => void) {
    try {
      return supabase
        .channel(`issues:${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `or(partner_a_id.eq.${userId},partner_b_id.eq.${userId})`
        }, callback)
        .subscribe();
    } catch (error) {
      console.error('Subscribe to issues error:', error);
      return { unsubscribe: () => {} };
    }
  },

  // Subscribe to proposal updates
  subscribeToProposals(issueId: string, callback: (payload: any) => void) {
    try {
      return supabase
        .channel(`proposals:${issueId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mediator_logs',
          filter: `issue_id=eq.${issueId}`
        }, callback)
        .subscribe();
    } catch (error) {
      console.error('Subscribe to proposals error:', error);
      return { unsubscribe: () => {} };
    }
  }
};