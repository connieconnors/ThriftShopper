"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for hash fragments first (Supabase sometimes uses these)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params
        const token_hash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const queryType = searchParams.get('type') || type;
        const next = searchParams.get('next') || '/browse';

        // If we have access_token in hash, Supabase already handled it
        if (access_token && refresh_token) {
          // Set the session manually
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(sessionError.message || 'Failed to establish session.');
            setIsLoading(false);
            return;
          }

          if (session) {
            // Wait a moment for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push(next);
            return;
          }
        }

        // Otherwise, try to verify OTP token
        if (token_hash && queryType) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: queryType as any,
            token_hash,
          });

          if (verifyError) {
            console.error('Email confirmation error:', verifyError);
            setError(verifyError.message || 'Email confirmation failed. Please try again.');
            setIsLoading(false);
            return;
          }

          if (data.session) {
            // Wait a moment for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push(next);
            return;
          }
        }

        // If we get here, no valid token was found
        setError('Missing confirmation token. Please check your email link.');
        setIsLoading(false);
      } catch (err) {
        console.error('Callback error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    </main>
  );
}

