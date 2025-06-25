import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CircleCheck as CheckCircle, X, Brain } from 'lucide-react-native';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { api } from '@/lib/api';
import { CONSTANTS } from '@/lib/constants';

export default function SolutionProposalScreen() {
  const { userData, refreshData } = useRealTimeData();
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const currentProposal = userData?.currentProposal;
  const currentIssue = userData?.currentIssue;

  useEffect(() => {
    // Redirect if no proposal or issue
    if (userData && (!currentProposal || !currentIssue || currentIssue.status !== 'proposal_sent')) {
      router.replace('/(tabs)');
    }
  }, [currentProposal, currentIssue, userData]);

  useEffect(() => {
    // Check if user has already voted
    if (currentProposal && userData?.user) {
      const isPartnerA = currentIssue?.partner_a_id === userData.user.id;
      const userVote = isPartnerA ? currentProposal.accepted_by_a : currentProposal.accepted_by_b;
      setHasVoted(userVote !== null);
    }
  }, [currentProposal, userData?.user, currentIssue]);

  const handleVote = async (accept: boolean) => {
    if (!currentProposal || isVoting || hasVoted) return;

    setIsVoting(true);
    try {
      const result = await api.submitSolutionVote(currentProposal.id, accept);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setHasVoted(true);
        
        if (result.bothVoted && result.bothAccepted) {
          // Both accepted - go to success screen
          router.replace('/resolution-success');
        } else if (result.bothVoted && !result.bothAccepted) {
          // At least one rejected - back to chat
          Alert.alert(
            'Proposal Not Accepted', 
            'The mediator will create a new proposal based on your feedback.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/chat') }]
          );
        } else {
          // Waiting for other partner
          Alert.alert(
            'Vote Recorded', 
            'Your vote has been recorded. Waiting for your co-parent to vote.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        }
        
        refreshData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || CONSTANTS.ERRORS.UNKNOWN_ERROR);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAccept = () => handleVote(true);
  const handleReject = () => handleVote(false);

  if (!currentProposal || !currentIssue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading proposal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPartnerA = currentIssue.partner_a_id === userData?.user?.id;
  const userVote = isPartnerA ? currentProposal.accepted_by_a : currentProposal.accepted_by_b;
  const partnerVote = isPartnerA ? currentProposal.accepted_by_b : currentProposal.accepted_by_a;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Brain size={32} color="#2563EB" />
          <Text style={styles.headerTitle}>Your Mediator AI has a Proposal</Text>
          <Text style={styles.headerSubtitle}>
            Please review the proposed solution carefully
          </Text>
        </View>

        {/* Proposal Card */}
        <View style={styles.proposalCard}>
          <View style={styles.proposalHeader}>
            <Text style={styles.proposalTitle}>Proposed Solution</Text>
            <Text style={styles.proposalSubtitle}>{currentIssue.summary}</Text>
          </View>
          
          <View style={styles.solutionContainer}>
            <Text style={styles.solutionText}>{currentProposal.content}</Text>
          </View>

          {/* Voting Status */}
          {hasVoted && (
            <View style={styles.votingStatus}>
              <Text style={styles.votingStatusTitle}>Voting Status:</Text>
              <View style={styles.voteItem}>
                <Text style={styles.voteLabel}>Your vote:</Text>
                <View style={[
                  styles.voteBadge, 
                  userVote ? styles.acceptBadge : styles.rejectBadge
                ]}>
                  <Text style={[
                    styles.voteText,
                    userVote ? styles.acceptText : styles.rejectText
                  ]}>
                    {userVote ? 'Accepted' : 'Rejected'}
                  </Text>
                </View>
              </View>
              <View style={styles.voteItem}>
                <Text style={styles.voteLabel}>Co-parent's vote:</Text>
                <View style={[
                  styles.voteBadge,
                  partnerVote === null ? styles.pendingBadge : 
                  partnerVote ? styles.acceptBadge : styles.rejectBadge
                ]}>
                  <Text style={[
                    styles.voteText,
                    partnerVote === null ? styles.pendingText :
                    partnerVote ? styles.acceptText : styles.rejectText
                  ]}>
                    {partnerVote === null ? 'Pending' : partnerVote ? 'Accepted' : 'Rejected'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {!hasVoted && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.acceptButton, isVoting && styles.disabledButton]} 
              onPress={handleAccept}
              disabled={isVoting}
            >
              <CheckCircle size={24} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>
                {isVoting ? 'Submitting...' : 'Yes, I Accept'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.rejectButton, isVoting && styles.disabledButton]} 
              onPress={handleReject}
              disabled={isVoting}
            >
              <X size={24} color="#EF4444" />
              <Text style={styles.rejectButtonText}>No, Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footerNotice}>
          <Text style={styles.footerText}>
            Both parents must accept to resolve the issue. 
            {hasVoted ? ' You have voted. ' : ' '}
            {partnerVote === null ? 'Waiting for your co-parent to vote.' : 
             'Your co-parent has also voted.'}
          </Text>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  proposalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  proposalHeader: {
    marginBottom: 20,
  },
  proposalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  proposalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  solutionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  solutionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  votingStatus: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
  },
  votingStatusTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  voteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voteLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  voteBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptBadge: {
    backgroundColor: '#D1FAE5',
  },
  rejectBadge: {
    backgroundColor: '#FEE2E2',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  voteText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  acceptText: {
    color: '#065F46',
  },
  rejectText: {
    color: '#991B1B',
  },
  pendingText: {
    color: '#92400E',
  },
  actionButtons: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  rejectButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footerNotice: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});