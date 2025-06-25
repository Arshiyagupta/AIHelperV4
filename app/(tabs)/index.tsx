import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, MessageCircle, Clock } from 'lucide-react-native';
import { useAuth } from '@/components/AuthProvider';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { api } from '@/lib/api';
import { utils } from '@/lib/utils';
import { CONSTANTS } from '@/lib/constants';

export default function HomeScreen() {
  const { user } = useAuth();
  const { userData, loading, error, refreshData } = useRealTimeData();
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);

  const startNewIssue = async () => {
    setIsCreatingIssue(true);
    try {
      const result = await api.createIssue();
      if (result.error) {
        alert(result.error);
      } else {
        router.push('/(tabs)/chat');
      }
    } catch (error: any) {
      alert(error.message || CONSTANTS.ERRORS.UNKNOWN_ERROR);
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const continueIssue = () => {
    if (userData?.currentIssue?.status === 'proposal_sent') {
      router.push('/solution-proposal');
    } else {
      router.push('/(tabs)/chat');
    }
  };

  const viewHistory = () => {
    router.push('/(tabs)/history');
  };

  const getStatusColor = (status: string) => {
    return utils.getStatusColor(status);
  };

  const getStatusText = (status: string) => {
    return utils.getStatusText(status);
  };

  if (loading && !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentIssue = userData?.currentIssue;
  const partnerName = userData?.user?.connected_partner?.name || 
                     userData?.user?.connected_partner?.email || 
                     'Your Co-Parent';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {userData?.user?.name || 'there'}</Text>
          <Text style={styles.connection}>Connected with: {partnerName}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {currentIssue ? (
            <View style={styles.currentIssueCard}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueTitle}>Current Issue</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentIssue.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(currentIssue.status) }]}>
                    {getStatusText(currentIssue.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.issueDescription}>{currentIssue.summary}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={continueIssue}>
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {currentIssue.status === 'proposal_sent' ? 'View Proposal' : 'Continue Talking to AI'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noIssueCard}>
              <Text style={styles.noIssueTitle}>No Active Issue</Text>
              <Text style={styles.noIssueDescription}>
                Start a new conversation with your AI to resolve parenting issues.
              </Text>
              <TouchableOpacity 
                style={[styles.primaryButton, isCreatingIssue && styles.disabledButton]} 
                onPress={startNewIssue}
                disabled={isCreatingIssue}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {isCreatingIssue ? 'Creating...' : 'Start New Issue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={viewHistory}>
            <Clock size={20} color="#2563EB" />
            <Text style={styles.secondaryButtonText}>View Past Issues</Text>
          </TouchableOpacity>

          {/* Unread Notifications */}
          {userData?.unreadNotifications && userData.unreadNotifications.length > 0 && (
            <View style={styles.notificationsCard}>
              <Text style={styles.notificationsTitle}>Recent Updates</Text>
              {userData.unreadNotifications.slice(0, 3).map((notification) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <Text style={styles.notificationText}>
                    {notification.payload?.message || 'New notification'}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {utils.formatDate(notification.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  connection: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
  },
  currentIssueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  issueDescription: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 20,
  },
  noIssueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  noIssueTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  noIssueDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  notificationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
});