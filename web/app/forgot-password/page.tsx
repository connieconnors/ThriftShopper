"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { getPasswordResetUrl } from "../../lib/authRedirect";
import { AuthWelcomeLayout } from "../../components/AuthWelcomeLayout";
import {
  authPrimaryButtonClass,
  authSecondaryButtonClass,
  authLinkClass,
} from "../../components/WelcomeBrandHeader";

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
        redirectTo: getPasswordResetUrl(),
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
      <AuthWelcomeLayout
        title="Check your email"
        subtitle={
          <>
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </>
        }
      >
        <p className="text-center text-sm text-gray-500 mb-6 font-system">
          Click the link in the email to reset your password. The link will expire in 1 hour.
        </p>

        <div className="space-y-3">
          <motion.button
            onClick={() => router.push("/login")}
            whileTap={{ scale: 0.98 }}
            className={authPrimaryButtonClass}
          >
            Back to Sign In
          </motion.button>
          <button
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            className={authSecondaryButtonClass}
          >
            Send another email
          </button>
        </div>
      </AuthWelcomeLayout>
    );
  }

  return (
    <AuthWelcomeLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a link to reset your password"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm font-system">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium font-system text-[var(--ink-primary)]">
            Email
          </label>
          <div className="relative">
            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--ink-primary)] outline-none transition-colors font-system"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className={`${authPrimaryButtonClass} mt-6`}
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
        <Link href="/login" className={`${authLinkClass} inline-flex items-center gap-1`}>
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    </AuthWelcomeLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--background)" }}
        >
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#16193a" }} />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
