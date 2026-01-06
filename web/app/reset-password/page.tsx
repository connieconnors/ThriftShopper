"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "../../components/TSLogo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Check if we have a valid session (user clicked the reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    };
    checkSession();
  }, []);

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Password update error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "#191970" }} />
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
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
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#191970" }}
              >
                <TSLogo size={48} primaryColor="#ffffff" accentColor="#efbf04" showStar={true} />
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-green-500" />
            </div>

            <h1 
              className="text-2xl font-bold text-center mb-2"
              style={{ 
                color: "#000080", 
                fontFamily: "var(--font-playfair), Playfair Display, serif" 
              }}
            >
              Password Reset
            </h1>
            <p className="text-center mb-6 text-gray-600">
              Your password has been successfully reset!
            </p>
            <p className="text-center text-sm text-gray-500 mb-6">
              Redirecting to sign in...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

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
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#191970" }}
            >
              <TSLogo size={48} primaryColor="#ffffff" accentColor="#efbf04" showStar={true} />
            </div>
          </div>

          <h1 
            className="text-2xl font-bold text-center mb-2"
            style={{ 
              color: "#000080", 
              fontFamily: "var(--font-playfair), Playfair Display, serif" 
            }}
          >
            Set New Password
          </h1>
          <p className="text-center mb-8 text-gray-600">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#191970" }}
              >
                New Password
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
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label 
                className="block mb-2 text-sm font-medium"
                style={{ color: "#191970" }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-sm hover:underline"
              style={{ color: "#191970" }}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

