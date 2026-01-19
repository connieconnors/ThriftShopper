"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "../../components/TSLogo";

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

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

            <h1 
              className="text-2xl font-bold text-center mb-2"
              style={{ 
                color: "#000080"
              }}
            >
              Check your email
            </h1>
            <p className="text-center mb-6 text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-center text-sm text-gray-500 mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>

            <div className="space-y-3">
              <motion.button
                onClick={() => router.push("/login")}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-white font-semibold shadow-lg"
                style={{ backgroundColor: "#191970" }}
              >
                Back to Sign In
              </motion.button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="w-full py-3 rounded-xl border-2 font-semibold"
                style={{ borderColor: "#191970", color: "#191970" }}
              >
                Send another email
              </button>
            </div>
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
              color: "#000080"
            }}
          >
            Reset Password
          </h1>
          <p className="text-center mb-8 text-gray-600">
            Enter your email and we'll send you a link to reset your password
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
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-sm hover:underline inline-flex items-center gap-1"
              style={{ color: "#191970" }}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}

