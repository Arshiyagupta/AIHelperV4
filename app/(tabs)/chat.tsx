import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Brain, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { api } from '@/lib/api';
import { utils } from '@/lib/utils';
import { validation } from '@/lib/validation';
import { CONSTANTS } from '@/lib/constants';
import { SafetyCheck } from '@/components/SafetyCheck';

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'ai';
  created_at: string;
  is_flagged?: boolean;
}

export default function PersonalChatScreen() {
  const { user } = useAuth();
  const { userData, refreshData } = useRealTimeData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentIssue = userData?.currentIssue;

  // Load messages when issue changes
  useEffect(() => {
    if (userData?.recentMessages) {
      setMessages(userData.recentMessages.reverse());
    }
  }, [userData?.recentMessages]);

  // Redirect if no active issue
  useEffect(() => {
    if (userData && !currentIssue) {
      router.replace('/(tabs)');
    }
  }, [currentIssue, userData]);

  // Check if issue is halted
  useEffect(() => {
    if (currentIssue?.status === 'halted' || currentIssue?.red_flagged) {
      router.replace('/red-flag');
    }
  }, [currentIssue?.status, currentIssue?.red_flagged]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentIssue || isSending) return;

    const content = validation.sanitizeMessage(inputText);
    
    // Check for harmful content
    if (validation.containsHarmfulContent(content)) {
      setShowSafetyCheck(true);
      return;
    }

    setIsSending(true);
    const tempMessage: Message = {
      id: utils.generateId(),
      content,
      sender_type: 'user',
      created_at: new Date().toISOString(),
    };

    // Add message optimistically
    setMessages(prev => [...prev, tempMessage]);
    setInputText('');

    try {
      const result = await api.sendMessage(currentIssue.id, content);
      
      if (result.error) {
        if (result.isRedFlagged) {
          router.replace('/red-flag');
          return;
        }
        Alert.alert('Error', result.error);
        // Remove the optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      } else {
        // Replace optimistic message with real one and add AI response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempMessage.id),
          result.userMessage,
          result.aiResponse
        ]);
        
        // Refresh data to get updated issue status
        refreshData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || CONSTANTS.ERRORS.UNKNOWN_ERROR);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleSafetyContinue = () => {
    setShowSafetyCheck(false);
    // Continue with sending the message
    sendMessage();
  };

  const handleSafetyGetHelp = () => {
    setShowSafetyCheck(false);
    router.push('/red-flag');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender_type === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender_type === 'user' ? styles.userBubble : styles.aiBubble
      ]}>
        {item.is_flagged && (
          <View style={styles.flaggedIndicator}>
            <AlertTriangle size={16} color="#EF4444" />
            <Text style={styles.flaggedText}>Content flagged</Text>
          </View>
        )}
        <Text style={[
          styles.messageText,
          item.sender_type === 'user' ? styles.userMessageText : styles.aiMessageText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.timestamp,
          item.sender_type === 'user' ? styles.userTimestamp : styles.aiTimestamp
        ]}>
          {utils.formatTime(item.created_at)}
        </Text>
      </View>
    </View>
  );

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (showSafetyCheck) {
    return (
      <SafetyCheck 
        onContinue={handleSafetyContinue}
        onGetHelp={handleSafetyGetHelp}
      />
    );
  }

  if (!currentIssue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noIssueContainer}>
          <Text style={styles.noIssueText}>No active issue found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Brain size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Talk to Your AI</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Footer Notice */}
        <View style={styles.footerNotice}>
          <Text style={styles.footerText}>
            You are not messaging your co-parent. This is a private space.
          </Text>
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={CONSTANTS.MAX_MESSAGE_LENGTH}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
          >
            <Send size={20} color={inputText.trim() && !isSending ? "#FFFFFF" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  noIssueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noIssueText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  flaggedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  flaggedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  footerNotice: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#92400E',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});