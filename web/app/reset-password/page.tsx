"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { AuthWelcomeLayout } from "../../components/AuthWelcomeLayout";
import { authPrimaryButtonClass, authLinkClass } from "../../components/WelcomeBrandHeader";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const establishRecoverySession = async () => {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(
              sessionError.message ||
                "Invalid or expired reset link. Please request a new one."
            );
            setIsValidating(false);
            return;
          }

          window.history.replaceState(null, "", window.location.pathname);
          setCanReset(true);
          setIsValidating(false);
          return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        const tokenHash =
          hashParams.get("token_hash") || searchParams.get("token_hash");
        const type = hashParams.get("type") || searchParams.get("type");

        if (tokenHash && type === "recovery") {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });

          if (verifyError) {
            setError(
              verifyError.message ||
                "Invalid or expired reset link. Please request a new one."
            );
            setIsValidating(false);
            return;
          }

          if (data.session) {
            window.history.replaceState(null, "", window.location.pathname);
            setCanReset(true);
            setIsValidating(false);
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setCanReset(true);
        } else {
          setError("Invalid or expired reset link. Please request a new one.");
        }
      } catch (err) {
        console.error("Reset link validation error:", err);
        setError("Invalid or expired reset link. Please request a new one.");
      }

      setIsValidating(false);
    };

    establishRecoverySession();
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
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "#16193a" }} />
          <p className="text-gray-600 font-system">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <AuthWelcomeLayout title="Password Reset" subtitle="Your password has been successfully reset!">
        <div className="flex justify-center mb-4">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <p className="text-center text-sm text-gray-500 font-system">Redirecting to sign in...</p>
      </AuthWelcomeLayout>
    );
  }

  return (
    <AuthWelcomeLayout title="Set New Password" subtitle="Enter your new password below">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
          <p className="text-red-600 text-sm font-system">{error}</p>
          <Link href="/forgot-password" className={`${authLinkClass} text-sm`}>
            Request a new reset link
          </Link>
        </div>
      )}

      {canReset && (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium font-system text-[var(--ink-primary)]">
            New Password
          </label>
          <div className="relative">
            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--ink-primary)] outline-none transition-colors font-system"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium font-system text-[var(--ink-primary)]">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[var(--ink-primary)] outline-none transition-colors font-system"
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
          className={`${authPrimaryButtonClass} mt-6`}
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
      )}

      <div className="text-center mt-6">
        <Link href="/login" className={authLinkClass}>
          Back to Sign In
        </Link>
      </div>
    </AuthWelcomeLayout>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
