import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TriangleAlert as AlertTriangle, Chrome as Home, Phone } from 'lucide-react-native';

export default function RedFlagScreen() {
  const handleReturnHome = () => {
    router.replace('/(tabs)');
  };

  const handleGetSupport = () => {
    // In a real app, this would open support resources
    console.log('Opening support resources...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <AlertTriangle size={64} color="#EF4444" />
        </View>

        {/* Warning Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Conversation Paused</Text>
          <Text style={styles.description}>
            Our AI detected high-conflict or potentially harmful language in this conversation. 
            Your safety and well-being are our priority.
          </Text>
          <Text style={styles.recommendation}>
            We recommend seeking support from a qualified therapist, family counselor, or legal advisor 
            who specializes in co-parenting and family dynamics.
          </Text>
        </View>

        {/* Support Resources */}
        <View style={styles.resourcesContainer}>
          <Text style={styles.resourcesTitle}>Immediate Support</Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleGetSupport}>
            <Phone size={20} color="#2563EB" />
            <Text style={styles.supportButtonText}>Find Local Support Resources</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.homeButton} onPress={handleReturnHome}>
            <Home size={20} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Crisis Information */}
        <View style={styles.crisisInfo}>
          <Text style={styles.crisisText}>
            If you are in immediate danger, please contact your local emergency services or call 911.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  recommendation: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  resourcesContainer: {
    width: '100%',
    marginBottom: 32,
  },
  resourcesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  crisisInfo: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  crisisText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 20,
  },
});