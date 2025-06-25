import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/auth';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'fcm_token'>>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await auth.getCurrentUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await loadUserProfile();
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted && !initialized) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile, initialized]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await auth.signIn(email, password);
      // Profile will be loaded via auth state change
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      await auth.signUp(email, password, name);
      // Profile will be loaded via auth state change
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      // User state will be cleared via auth state change
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state on error
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'fcm_token'>>) => {
    const updatedUser = await auth.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}