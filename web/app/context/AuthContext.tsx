"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's a refresh token error, clear the invalid session and localStorage
        if (error && (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token'))) {
          console.warn('Invalid refresh token detected, clearing session:', error.message);
          // Clear localStorage to remove invalid tokens
          if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
          }
          // Clear the invalid session
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting session:', error);
        // On any error, clear session and continue
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle refresh token errors in auth state changes too
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    // Use the current origin for email redirect (works for both localhost and Vercel)
    const emailRedirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : undefined;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectTo,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setSession(null);
      setUser(null);
      
      // Clear localStorage immediately
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Try to sign out from Supabase (ignore errors if session is already missing)
      try {
        const { error } = await supabase.auth.signOut();
        if (error && !error.message?.includes('session') && !error.message?.includes('AuthSessionMissing')) {
          console.error('Error signing out:', error);
        }
      } catch (signOutError: any) {
        // Ignore AuthSessionMissing errors - we've already cleared local state
        if (!signOutError?.message?.includes('session') && !signOutError?.message?.includes('AuthSessionMissing')) {
          console.error('Error in signOut:', signOutError);
        }
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      // Still clear state even if there's an error
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

