import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck as CheckCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { utils } from '@/lib/utils';

interface Issue {
  id: string;
  summary: string;
  resolved_at: string;
  status: 'resolved';
}

export default function IssueHistoryScreen() {
  const { userData, loading, refreshData } = useRealTimeData();
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (userData?.resolvedIssues) {
      setIssues(userData.resolvedIssues.map(issue => ({
        id: issue.id,
        summary: issue.summary,
        resolved_at: issue.resolved_at || issue.created_at,
        status: 'resolved' as const
      })));
    }
  }, [userData?.resolvedIssues]);

  const toggleExpanded = (issueId: string) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const renderIssue = ({ item }: { item: Issue }) => {
    const isExpanded = expandedIssue === item.id;
    
    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.issueHeader}>
          <View style={styles.issueInfo}>
            <Text style={styles.issueTitle}>{item.summary}</Text>
            <Text style={styles.resolvedDate}>
              Resolved on {utils.formatDate(item.resolved_at)}
            </Text>
          </View>
          <View style={styles.issueActions}>
            <View style={styles.statusBadge}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.statusText}>Resolved</Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.solutionContainer}>
            <Text style={styles.solutionLabel}>Issue Details:</Text>
            <Text style={styles.solutionText}>
              This issue was successfully resolved through AI-mediated discussion between both parents. 
              The agreed solution is now part of your shared parenting plan.
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CheckCircle size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Resolved Issues Yet</Text>
      <Text style={styles.emptyDescription}>
        Once you and your co-parent resolve issues together, they'll appear here for future reference.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Issue History</Text>
        <Text style={styles.headerSubtitle}>
          {issues.length} resolved issue{issues.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={issues}
        renderItem={renderIssue}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          issues.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  issueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    alignItems: 'flex-start',
  },
  issueInfo: {
    flex: 1,
    marginRight: 16,
  },
  issueTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  resolvedDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  issueActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#065F46',
  },
  solutionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  solutionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 22,
  },
});