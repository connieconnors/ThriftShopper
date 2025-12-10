"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "../../components/TSLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get("redirect");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Get user profile to determine where to redirect
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if there's an explicit redirect
        if (redirectTo) {
          router.push(redirectTo);
          return;
        }

        // Otherwise, check user's role and redirect accordingly
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_seller")
          .eq("id", user.id) // Use 'id' not 'user_id' - it's the primary key
          .single();

        // If profile exists and user is a seller, redirect to seller dashboard
        if (profile && profile.is_seller) {
          router.push("/seller-dashboard");
        } else {
          router.push("/browse");
        }
      } else {
        router.push("/browse");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#191970" }}
            >
              <TSLogo size={48} primaryColor="#ffffff" accentColor="#cfb53b" />
            </div>
          </div>

          {/* Header */}
          <h1 
            className="text-2xl font-bold text-center mb-2"
            style={{ 
              color: "#000080", 
              fontFamily: "var(--font-merriweather), Merriweather, serif" 
            }}
          >
            Welcome Back
          </h1>
          <p className="text-center mb-8 text-gray-600">
            Sign in to continue your journey
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#191970" }}
              >
                Email
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#191970" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl text-white font-semibold shadow-lg mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#191970" }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Links */}
          <p className="text-center text-sm text-gray-600">
            New to ThriftShopper?{" "}
            <Link
              href="/signup"
              className="font-semibold hover:underline"
              style={{ color: "#191970" }}
            >
              Create an account
            </Link>
          </p>

          <p className="text-center text-sm text-gray-600 mt-3">
            Want to sell?{" "}
            <Link
              href="/signup?seller=true"
              className="font-semibold hover:underline"
              style={{ color: "#cfb53b" }}
            >
              Become a seller
            </Link>
          </p>
        </div>

        {/* Back to browse */}
        <p className="text-center mt-6">
          <Link
            href="/browse"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Continue browsing
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
