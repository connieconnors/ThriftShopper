"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "../../components/TSLogo";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Sign up directly with Supabase to get full response
      // Use the current origin for email redirect (works for both localhost and Vercel)
      const emailRedirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : undefined;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirectTo,
        },
      });
      
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required (session will be null)
      const requiresEmailConfirmation = !signUpData.session && signUpData.user;
      
      // Check if seller=true in URL
      const urlParams = new URLSearchParams(window.location.search);
      const isSeller = urlParams.get('seller') === 'true';
      
      if (requiresEmailConfirmation) {
        // Profile will be created by trigger, but update it with additional info
        if (signUpData.user) {
          const displayName = email.split("@")[0];
          
          // Wait for trigger to create profile
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Update profile with additional fields
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              display_name: displayName,
              accepts_marketing: acceptsMarketing,
              is_seller: isSeller, // Set based on URL param
            })
            .eq("user_id", signUpData.user.id);
          
          if (profileError) {
            console.error("Error updating profile:", profileError);
            // Try upsert as fallback
            await supabase
              .from("profiles")
              .upsert({
                user_id: signUpData.user.id,
                display_name: displayName,
                is_seller: isSeller, // Set based on URL param
                accepts_marketing: acceptsMarketing,
                ts_badge: "false",
                created_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id'
              });
          }
        }
        
        // Show success message and redirect to login
        setError(null);
        alert("Account created! Please check your email to confirm your account, then log in.");
        router.push("/login");
        return;
      }

      // If no email confirmation required, proceed with auto-login
      if (signUpData.session && signUpData.user) {
        const displayName = email.split("@")[0];
        
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if seller=true in URL
        const urlParams = new URLSearchParams(window.location.search);
        const isSeller = urlParams.get('seller') === 'true';
        
        // Update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: signUpData.user.id,
            display_name: displayName,
            is_seller: isSeller, // Set based on URL param
            accepts_marketing: acceptsMarketing,
            ts_badge: "false",
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
        
        if (profileError) {
          console.error("Error upserting profile:", profileError);
        }
        
        if (isSeller) {
          router.push("/seller/onboarding");
        } else {
          router.push("/browse");
        }
      } else {
        setError("Account created but unable to establish session. Please try logging in.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa', fontFamily: 'Merriweather, serif' }}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between" style={{ backgroundColor: '#191970' }}>
        <Link href="/browse" className="flex items-center gap-2">
          <TSLogo size={32} primaryColor="#ffffff" accentColor="#efbf04" />
          <span className="text-white font-semibold">ThriftShopper</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-white/80 hover:text-white transition-colors"
        >
          Already have an account? <span className="font-semibold" style={{ color: '#efbf04' }}>Log in</span>
        </Link>
      </header>

      {/* Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#191970' }}>
              <TSLogo size={48} primaryColor="#ffffff" accentColor="#efbf04" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#191970' }}>Create your account</h1>
            <p className="text-gray-600">Join ThriftShopper and start discovering unique finds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#191970' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#191970] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#191970' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#191970] transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#191970' }}>Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#191970] transition-colors"
                placeholder="Confirm your password"
              />
            </div>

            {/* Marketing opt-in checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="accepts-marketing"
                checked={acceptsMarketing}
                onChange={(e) => setAcceptsMarketing(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-2 cursor-pointer"
                style={{ accentColor: '#191970' }}
              />
              <label 
                htmlFor="accepts-marketing" 
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                I want to receive promotional emails and updates
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 font-bold text-lg rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              style={{ backgroundColor: '#191970' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </main>
  );
}

