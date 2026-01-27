"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BetaGate() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowWaitlist(false);
    setIsLoading(true);

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 [BETA GATE] Checking access for email:', normalizedEmail);

    try {
      // Try direct query first
      let betaAccess = null;
      let betaError = null;

      // Method 1: Direct table query
      const { data: directData, error: directError } = await supabase
        .from('beta_access')
        .select('email, status')
        .eq('email', normalizedEmail)
        .eq('status', 'invited')
        .maybeSingle();

      console.log('📊 [BETA GATE] Direct query result:', {
        hasData: !!directData,
        data: directData,
        error: directError,
        errorCode: directError?.code,
        errorMessage: directError?.message,
      });

      // If 406 error (RLS blocking), try RPC function as fallback
      if (directError && (directError.code === 'PGRST301' || directError.message?.includes('406'))) {
        console.log('🔄 [BETA GATE] Direct query blocked by RLS, trying RPC function...');
        
        // Method 2: RPC function (bypasses RLS)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('check_beta_access', { check_email: normalizedEmail });

        console.log('📊 [BETA GATE] RPC function result:', {
          hasData: !!rpcData,
          data: rpcData,
          error: rpcError,
        });

        if (rpcError) {
          betaError = rpcError;
        } else if (rpcData && rpcData.length > 0) {
          betaAccess = rpcData[0];
        }
      } else {
        betaAccess = directData;
        betaError = directError;
      }

      if (betaError) {
        console.error('❌ [BETA GATE] Supabase error:', {
          code: betaError.code,
          message: betaError.message,
          details: betaError.details,
          hint: betaError.hint,
        });
        
        // 406 Not Acceptable usually means RLS is blocking the query
        if (betaError.code === 'PGRST301' || betaError.message?.includes('406')) {
          setError('Access check failed. Please contact support if this persists.');
          console.error('🚨 [BETA GATE] RLS is blocking access. Run beta-access-rls-policy.sql in Supabase SQL Editor.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (betaAccess && betaAccess.status === 'invited') {
        console.log('✅ [BETA GATE] Access granted for:', normalizedEmail);
        
        // Store email in localStorage (session)
        if (typeof window !== 'undefined') {
          localStorage.setItem('beta_access_email', normalizedEmail);
        }
        
        // Redirect to browse feed
        router.push('/');
      } else {
        console.log('🚫 [BETA GATE] Access denied - email not found or not invited');
        setShowWaitlist(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ [BETA GATE] Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center">
      {/* Background Image - Same as splash screen */}
      <div className="absolute inset-0 z-0">
        <img
          src="/thrift-shop-option-1.jpg"
          alt="Vintage thrift shop interior"
          className="w-full h-full object-cover object-center brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      {/* Branding - Same as splash screen */}
      <div
        className="relative z-10 flex flex-col items-center gap-2 text-center px-6 mb-12"
        style={{ marginTop: "calc(10vh + 5pt)" }}
      >
        <h1
          className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium"
          style={{
            fontFamily: "var(--font-playfair), Playfair Display, serif",
            textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          ThriftShopper
        </h1>

        <p
          className="italic text-white/90 text-sm sm:text-base md:text-lg tracking-wide font-normal"
          style={{
            fontFamily: "var(--font-playfair), Playfair Display, serif",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          the magic of discovery<span style={{ color: '#EFBF04', fontSize: '0.75em', verticalAlign: 'super' }}>™</span>
        </p>
      </div>

      {/* Beta Access Form Overlay - Smaller, minimal */}
      <div className="relative z-10 w-full max-w-xs px-6">
        {!showWaitlist ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            <h2
              className="text-xl font-semibold mb-5 text-center"
              style={{
                fontFamily: "var(--font-playfair), Playfair Display, serif",
                color: '#191970',
              }}
            >
              Welcome to Our Beta!
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#191970] transition-colors"
                  placeholder="your email"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-semibold text-lg rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#191970' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Checking...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            <p className="text-gray-700 text-sm mb-6 text-center">
              We're in private beta right now. Join our waitlist and we'll notify you when we open up!
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://thriftshopper.com/join"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 font-semibold text-center rounded-xl text-white transition-colors"
                style={{ backgroundColor: '#191970' }}
              >
                Join Waitlist
              </a>
              <button
                type="button"
                onClick={() => setShowWaitlist(false)}
                className="text-sm text-gray-600 hover:underline text-center"
              >
                Already have an invite? Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
