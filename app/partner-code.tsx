import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Copy, Share } from 'lucide-react-native';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { validation } from '@/lib/validation';
import { CONSTANTS } from '@/lib/constants';

export default function PartnerCodeScreen() {
  const { user } = useAuth();
  const [partnerCode, setPartnerCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [userCode, setUserCode] = useState('');

  useEffect(() => {
    if (user?.partner_code) {
      setUserCode(user.partner_code);
    }
  }, [user]);

  useEffect(() => {
    // If user is already connected, redirect to main app
    if (user?.connected_user_id) {
      router.replace('/(tabs)');
    }
  }, [user?.connected_user_id]);

  const copyCode = async () => {
    if (userCode) {
      await Clipboard.setStringAsync(userCode);
      Alert.alert('Copied!', 'Your partner code has been copied to clipboard.');
    }
  };

  const shareCode = () => {
    if (userCode) {
      Alert.alert('Share Code', `Share this code with your co-parent: ${userCode}`);
    }
  };

  const connectWithPartner = async () => {
    if (!validation.isValidPartnerCode(partnerCode)) {
      Alert.alert('Error', 'Please enter a valid 6-character partner code.');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await api.connectPartner(partnerCode.toUpperCase());
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success!', CONSTANTS.SUCCESS.PARTNER_CONNECTED, [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || CONSTANTS.ERRORS.UNKNOWN_ERROR);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Connect with Your Co-Parent</Text>
        
        {/* Share Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Partner Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{userCode || 'Loading...'}</Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.secondaryButton, !userCode && styles.disabledButton]} 
              onPress={copyCode}
              disabled={!userCode}
            >
              <Copy size={20} color={userCode ? "#2563EB" : "#9CA3AF"} />
              <Text style={[styles.secondaryButtonText, !userCode && styles.disabledText]}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.secondaryButton, !userCode && styles.disabledButton]} 
              onPress={shareCode}
              disabled={!userCode}
            >
              <Share size={20} color={userCode ? "#2563EB" : "#9CA3AF"} />
              <Text style={[styles.secondaryButtonText, !userCode && styles.disabledText]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Enter Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Partner Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Partner Code"
            value={partnerCode}
            onChangeText={setPartnerCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity 
            style={[styles.primaryButton, (!partnerCode.trim() || isConnecting) && styles.disabledButton]}
            onPress={connectWithPartner}
            disabled={!partnerCode.trim() || isConnecting}
          >
            <Text style={styles.primaryButtonText}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 48,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#2563EB',
    letterSpacing: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    borderColor: '#9CA3AF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 32,
  },
});