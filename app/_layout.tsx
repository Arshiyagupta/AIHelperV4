import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/components/AuthProvider';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AuthRedirector() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Don't navigate while loading

    if (!user) {
      // User not authenticated, go to auth screen
      router.replace('/auth');
    } else if (!user.connected_user_id) {
      // User authenticated but not connected to partner
      router.replace('/partner-code');
    } else {
      // User authenticated and connected, go to main app
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  // This component only handles navigation logic, no UI
  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="partner-code" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="solution-proposal" options={{ headerShown: false }} />
        <Stack.Screen name="resolution-success" options={{ headerShown: false }} />
        <Stack.Screen name="red-flag" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <AuthRedirector />
    </AuthProvider>
  );
}