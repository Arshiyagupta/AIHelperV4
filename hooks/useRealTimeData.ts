import { useEffect, useState, useCallback } from 'react';
import { api, subscriptions } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export function useRealTimeData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.getUserData();
      if (data.error) {
        setError(data.error);
        setUserData(null);
      } else {
        setUserData(data);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !userData) return;

    const subscriptionsList: any[] = [];

    try {
      // Subscribe to issue updates
      const issuesSub = subscriptions.subscribeToIssues(user.id, (payload) => {
        setUserData((prev: any) => {
          if (!prev) return prev;
          
          if (payload.eventType === 'UPDATE' && prev.currentIssue?.id === payload.new.id) {
            return {
              ...prev,
              currentIssue: payload.new
            };
          }
          return prev;
        });
      });
      subscriptionsList.push(issuesSub);

      // Subscribe to messages if there's an active issue
      if (userData.currentIssue) {
        const messagesSub = subscriptions.subscribeToMessages(
          userData.currentIssue.id,
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setUserData((prev: any) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  recentMessages: [payload.new, ...prev.recentMessages].slice(0, 10)
                };
              });
            }
          }
        );
        subscriptionsList.push(messagesSub);

        // Subscribe to proposals
        const proposalsSub = subscriptions.subscribeToProposals(
          userData.currentIssue.id,
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setUserData((prev: any) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  currentProposal: payload.new
                };
              });
            }
          }
        );
        subscriptionsList.push(proposalsSub);
      }
    } catch (err) {
      console.error('Failed to set up subscriptions:', err);
    }

    return () => {
      subscriptionsList.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (err) {
          console.error('Failed to unsubscribe:', err);
        }
      });
    };
  }, [user, userData?.currentIssue?.id]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    userData,
    loading,
    error,
    refreshData,
  };
}