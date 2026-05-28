"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { routeAfterAuth } from "@/lib/routeAfterAuth";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const next = searchParams.get("next");

        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");
        const hashToken = hashParams.get("token_hash");

        const queryTokenHash = searchParams.get("token_hash");
        const queryType = searchParams.get("type");
        const finalTokenHash = hashToken || queryTokenHash;
        const finalType = hashType || queryType;

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            setError(sessionError.message || "Failed to establish session.");
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 300));
          await routeAfterAuth(router, supabase, next);
          return;
        }

        if (finalTokenHash && finalType) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: finalType as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
            token_hash: finalTokenHash,
          });

          if (verifyError) {
            setError(
              verifyError.message ||
                "Email confirmation failed. Please try again."
            );
            return;
          }

          if (data.session) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            await routeAfterAuth(router, supabase, next);
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          await routeAfterAuth(router, supabase, next);
          return;
        }

        setError(
          "Missing confirmation token. Please open the link from your email again."
        );
      } catch (err) {
        console.error("Callback error:", err);
        setError("An unexpected error occurred. Please try again.");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center mx-4">
          <h1
            className="text-2xl font-bold mb-2 font-editorial"
            style={{ color: "var(--ink-primary)" }}
          >
            Confirmation Failed
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: "var(--ink-primary)" }}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="text-center">
        <Loader2
          className="w-12 h-12 animate-spin mx-auto mb-4"
          style={{ color: "var(--ink-primary)" }}
        />
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="text-center">
            <Loader2
              className="w-12 h-12 animate-spin mx-auto mb-4"
              style={{ color: "var(--ink-primary)" }}
            />
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
