"use client";

import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithMagicLink: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug: Log when AuthProvider is mounted
  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Provide user-friendly error messages
        let userMessage = "Failed to create account. Please try again.";

        if (error.message.includes("User already registered")) {
          userMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes("Password should be at least")) {
          userMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("Invalid email")) {
          userMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Too many requests")) {
          userMessage =
            "Too many sign-up attempts. Please wait a few minutes before trying again.";
        } else if (error.message.includes("Invalid redirect URL")) {
          userMessage = "Configuration error. Please contact support.";
        } else if (error.message.includes("Email rate limit exceeded")) {
          userMessage =
            "Too many email requests. Please wait before trying again.";
        }

        return { success: false, error: userMessage };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          "Network error. Please check your internet connection and try again.",
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide user-friendly error messages
        let userMessage = "Failed to sign in. Please try again.";

        if (error.message.includes("Invalid login credentials")) {
          userMessage =
            "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          userMessage =
            "Please check your email and confirm your account before signing in.";
        } else if (error.message.includes("Too many requests")) {
          userMessage =
            "Too many sign-in attempts. Please wait a few minutes before trying again.";
        }

        return { success: false, error: userMessage };
      }

      // Force a page reload to trigger data loading for the authenticated user
      if (data.user) {
        setTimeout(() => {
          window.location.reload();
        }, 1500); // Give user time to see success message
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          "Network error. Please check your internet connection and try again.",
      };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Provide user-friendly error messages
        let userMessage = "Failed to send magic link. Please try again.";

        if (error.message.includes("Invalid email")) {
          userMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Too many requests")) {
          userMessage =
            "Too many magic link requests. Please wait a few minutes before trying again.";
        } else if (error.message.includes("User not found")) {
          userMessage =
            "No account found with this email. Please sign up first.";
        } else if (error.message.includes("Email rate limit exceeded")) {
          userMessage =
            "Too many email requests. Please wait before trying again.";
        } else if (error.message.includes("Invalid redirect URL")) {
          userMessage = "Configuration error. Please contact support.";
        } else if (error.message.includes("Email not confirmed")) {
          userMessage = "Please confirm your email before using magic link.";
        }

        return { success: false, error: userMessage };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          "Network error. Please check your internet connection and try again.",
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
