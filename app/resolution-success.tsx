import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CircleCheck as CheckCircle, Chrome as Home } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withDelay 
} from 'react-native-reanimated';

export default function ResolutionSuccessScreen() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animate the success icon and content
    scale.value = withSequence(
      withSpring(1.2, { duration: 400 }),
      withSpring(1, { duration: 200 })
    );
    opacity.value = withDelay(200, withSpring(1, { duration: 600 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <CheckCircle size={80} color="#10B981" />
        </Animated.View>

        {/* Success Content */}
        <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
          <Text style={styles.title}>Issue Resolved!</Text>
          <Text style={styles.subtitle}>
            The solution has been accepted by both parties.
          </Text>
          <Text style={styles.description}>
            Congratulations! You and your co-parent have successfully worked through this issue. 
            The agreed solution is now part of your shared parenting plan.
          </Text>
        </Animated.View>

        {/* Action Button */}
        <Animated.View style={[styles.buttonContainer, contentAnimatedStyle]}>
          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Home size={24} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Celebration Background Elements */}
        <View style={styles.celebrationContainer}>
          <View style={[styles.celebrationDot, styles.dot1]} />
          <View style={[styles.celebrationDot, styles.dot2]} />
          <View style={[styles.celebrationDot, styles.dot3]} />
          <View style={[styles.celebrationDot, styles.dot4]} />
          <View style={[styles.celebrationDot, styles.dot5]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    padding: 20,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#047857',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
  },
  homeButton: {
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
  homeButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  celebrationDot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#10B981',
    opacity: 0.1,
  },
  dot1: {
    width: 20,
    height: 20,
    top: '20%',
    left: '15%',
  },
  dot2: {
    width: 16,
    height: 16,
    top: '30%',
    right: '20%',
  },
  dot3: {
    width: 24,
    height: 24,
    bottom: '30%',
    left: '10%',
  },
  dot4: {
    width: 18,
    height: 18,
    bottom: '25%',
    right: '15%',
  },
  dot5: {
    width: 14,
    height: 14,
    top: '15%',
    right: '45%',
  },
});