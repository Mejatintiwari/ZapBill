import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('Supabase connection test successful');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created on next sign up');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }
      
      console.log('Profile fetched successfully:', data);
      setProfile(data);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setLoading(false);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          console.error('Network connectivity issue. Please check your internet connection and Supabase configuration.');
        }
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check for admin credentials
      if (email === 'admin@invoiceapp.com' && password === 'admin123') {
        // Try to sign in with admin credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'admin@invoiceapp.com',
          password: 'admin123',
        });
        
        if (error && error.message.includes('Invalid login credentials')) {
          // Admin user doesn't exist, create it
          try {
            await createAdminUser();
            // After creating admin user, try to sign in again
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: 'admin@invoiceapp.com',
              password: 'admin123',
            });
            if (signInError && signInError.message.includes('Invalid login credentials')) {
              throw new Error('Admin user was created but requires email confirmation. Please either:\n1. Disable email confirmation in your Supabase project settings (Authentication > Settings > Enable email confirmations = OFF)\n2. Or manually confirm the admin email in your Supabase dashboard (Authentication > Users)');
            } else if (signInError) {
              throw signInError;
            }
          } catch (createError) {
            throw createError;
          }
        } else if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const createAdminUser = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@invoiceapp.com',
        password: 'admin123',
      });

      if (error) throw error;

      if (data.user) {
        // Create admin profile - use upsert to handle potential conflicts
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: 'admin@invoiceapp.com',
            name: 'Admin User',
            default_currency: 'USD',
            default_tax_rate: 0,
            default_discount: 0,
            plan: 'agency',
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error('Error creating admin profile:', profileError);
          // Don't throw here as the auth user was created successfully
        }
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data.user) {
        // Create user profile - use upsert to handle potential conflicts
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email,
            name,
            default_currency: 'USD',
            default_tax_rate: 0,
            default_discount: 0,
            plan: 'free',
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw here as the auth user was created successfully
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setProfile(null);
      
      // Clear any stored data
      localStorage.clear();
      
      // Force page reload to ensure clean state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};