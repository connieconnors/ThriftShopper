"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

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
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Auto sign in after signup
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        // If auto-login fails, still redirect (email confirmation might be required)
        console.log("Auto sign-in note:", signInError.message);
      }

      // Get the user ID from the session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create display name from email (before the @)
        const displayName = email.split("@")[0];
        
        // Create profile record
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: displayName,
            is_seller: false,
            accepts_marketing: acceptsMarketing,
            ts_badge: "false",
            created_at: new Date().toISOString(),
          });
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't block signup if profile creation fails
        }
      }

      router.push("/browse");
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link href="/browse" className="text-xl font-bold tracking-tight">
          RetroThrifter
        </Link>
        <Link
          href="/login"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Already have an account? <span className="font-semibold text-white">Log in</span>
        </Link>
      </header>

      {/* Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-white/60">Join RetroThrifter and start discovering unique finds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
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
                className="mt-1 w-4 h-4 rounded border-white/20 bg-slate-900/50 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
              />
              <label 
                htmlFor="accepts-marketing" 
                className="text-sm text-white/60 cursor-pointer select-none"
              >
                I want to receive promotional emails and updates
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white text-black font-bold text-lg rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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

          <p className="text-center text-xs text-white/40 mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </main>
  );
}

