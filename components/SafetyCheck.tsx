import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { TriangleAlert as AlertTriangle, Phone, ExternalLink } from 'lucide-react-native';

interface SafetyCheckProps {
  onContinue: () => void;
  onGetHelp: () => void;
}

export function SafetyCheck({ onContinue, onGetHelp }: SafetyCheckProps) {
  const emergencyResources = [
    {
      name: 'National Domestic Violence Hotline',
      phone: '1-800-799-7233',
      website: 'https://www.thehotline.org'
    },
    {
      name: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      website: 'https://www.crisistextline.org'
    },
    {
      name: 'National Child Abuse Hotline',
      phone: '1-800-4-A-CHILD (1-800-422-4453)',
      website: 'https://www.childhelp.org'
    }
  ];

  const openWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={48} color="#EF4444" />
        <Text style={styles.title}>Safety Check</Text>
        <Text style={styles.subtitle}>
          Our AI detected concerning language in this conversation. Your safety is our priority.
        </Text>
      </View>

      <View style={styles.resourcesSection}>
        <Text style={styles.resourcesTitle}>Immediate Support Resources</Text>
        
        {emergencyResources.map((resource, index) => (
          <View key={index} style={styles.resourceCard}>
            <Text style={styles.resourceName}>{resource.name}</Text>
            <View style={styles.resourceActions}>
              <TouchableOpacity 
                style={styles.phoneButton}
                onPress={() => callNumber(resource.phone)}
              >
                <Phone size={16} color="#2563EB" />
                <Text style={styles.phoneText}>{resource.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.websiteButton}
                onPress={() => openWebsite(resource.website)}
              >
                <ExternalLink size={16} color="#6B7280" />
                <Text style={styles.websiteText}>Website</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.helpButton} onPress={onGetHelp}>
          <Text style={styles.helpButtonText}>I Need Help</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>I'm Safe, Continue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emergencyNotice}>
        <Text style={styles.emergencyText}>
          If you are in immediate danger, please call 911 or your local emergency services.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  resourcesSection: {
    marginBottom: 32,
  },
  resourcesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  resourceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  phoneText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  websiteText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  helpButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  emergencyNotice: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 20,
  },
});