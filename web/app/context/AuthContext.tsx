"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { getAuthCallbackUrl } from "../../lib/authRedirect";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    options?: { nextPath?: string }
  ) => Promise<{ error: Error | null }>;
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
        
        // Only clear session when refresh token is truly invalid — not transient network errors
        const refreshInvalid =
          error &&
          (error.message?.includes("Invalid Refresh Token") ||
            error.message?.includes("refresh_token_not_found") ||
            (error as { code?: string }).code === "refresh_token_not_found");

        if (refreshInvalid) {
          console.warn("Invalid refresh token detected, clearing session:", error.message);
          if (typeof window !== "undefined") {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
              if (key.includes("supabase") || key.includes("auth")) {
                localStorage.removeItem(key);
              }
            });
          }
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (error) {
          console.warn("getSession error (keeping existing client state if any):", error.message);
        }
        
        if (!session && typeof window !== "undefined") {
          const hasStoredAuth = Object.keys(localStorage).some(
            (key) => key.includes("supabase") && key.includes("auth")
          );
          if (hasStoredAuth) {
            const { data: { session: refreshed }, error: refreshError } =
              await supabase.auth.refreshSession();
            if (refreshed) {
              setSession(refreshed);
              setUser(refreshed.user ?? null);
              setIsLoading(false);
              return;
            }
            if (refreshError) {
              console.warn("Session refresh failed (keeping client state):", refreshError.message);
            }
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting session:", error);
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    options?: { nextPath?: string }
  ) => {
    const emailRedirectTo = getAuthCallbackUrl(options?.nextPath);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('invalid login credentials') ||
        msg.includes('invalid email or password')
      ) {
        return {
          error: new Error(
            "We couldn't sign you in. Please check your email/password, or reset your password."
          ),
        };
      }
    }
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
    // During SSR, return a safe default instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null,
        session: null,
        isLoading: true,
        signUp: async () => ({ error: new Error('Not available during SSR') }),
        signIn: async () => ({ error: new Error('Not available during SSR') }),
        signOut: async () => {},
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

