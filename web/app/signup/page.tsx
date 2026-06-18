"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { legalHref } from "@/lib/legalNavigation";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { getAuthCallbackUrl } from "../../lib/authRedirect";
import { AuthWelcomeLayout } from "../../components/AuthWelcomeLayout";
import { authPrimaryButtonClass, authLinkClass } from "../../components/WelcomeBrandHeader";
import { SellerFeeTransparencyLine } from "../../components/SellerFeeTransparency";
import { Loader2 } from "lucide-react";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if this is a seller signup
  const isSellerSignup = searchParams.get('seller') === 'true';

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
      const isSeller = searchParams.get("seller") === "true";
      const nextAfterAuth = isSeller ? "/seller/onboarding" : "/browse";
      const emailRedirectTo = getAuthCallbackUrl(nextAfterAuth);

      console.log("🔍 Signup: emailRedirectTo =", emailRedirectTo);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });
      
      console.log('📊 Signup result:', { 
        hasUser: !!signUpData?.user, 
        hasSession: !!signUpData?.session,
        error: signUpError 
      });
      
      if (signUpError) {
        console.error('❌ Signup error:', signUpError);
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required (session will be null)
      const requiresEmailConfirmation = !signUpData.session && signUpData.user;
      
      if (requiresEmailConfirmation) {
        // Profile will be created by trigger, but update it with additional info
        if (signUpData.user) {
          const displayName = email.split("@")[0];
          
          // Wait for trigger to create profile, then update it
          // Try multiple times with increasing delays to handle race conditions
          let profileUpdated = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1000 + (attempt * 500)));
            
            // Try to update existing profile first
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                display_name: displayName,
                accepts_marketing: acceptsMarketing,
                is_seller: isSeller, // Set based on URL param
              })
              .eq("user_id", signUpData.user.id);
            
            if (!updateError) {
              console.log(`✅ Profile updated successfully on attempt ${attempt + 1}`);
              profileUpdated = true;
              break;
            }
            
            // If update failed, try to insert (profile might not exist yet)
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                user_id: signUpData.user.id,
                email: signUpData.user.email || email,
                display_name: displayName,
                is_seller: isSeller, // Set based on URL param
                accepts_marketing: acceptsMarketing,
              });
            
            if (!insertError) {
              console.log(`✅ Profile created successfully on attempt ${attempt + 1}`);
              profileUpdated = true;
              break;
            }
            
            console.log(`⚠️ Attempt ${attempt + 1} failed, retrying...`);
          }
          
          if (!profileUpdated) {
            console.error("❌ Failed to update/create profile after 3 attempts");
            console.log("Profile will be created/updated when user confirms email");
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
    <AuthWelcomeLayout
      title={isSellerSignup ? "Create Your Seller Account" : "Create Your Account"}
      subtitle={
        isSellerSignup
          ? "Let's get you started selling on ThriftShopper"
          : "Join ThriftShopper and start discovering unique finds"
      }
      headerExtra={
        isSellerSignup ? (
          <>
            <SellerFeeTransparencyLine className="mt-3 max-w-md mx-auto" />
            <Link href="/canvas" className={`mt-4 inline-block ${authLinkClass}`}>
              Want to shop instead? Go to My Canvas →
            </Link>
          </>
        ) : undefined
      }
      footer={
        <p className="text-sm text-gray-600 font-system">
          Already have an account?{" "}
          <Link href="/login" className={`font-semibold ${authLinkClass}`}>
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-system">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm mb-1.5 font-system text-[var(--ink-primary)]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--ink-primary)] transition-colors font-system"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 font-system text-[var(--ink-primary)]">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--ink-primary)] transition-colors font-system"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5 font-system text-[var(--ink-primary)]">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--ink-primary)] transition-colors font-system"
            placeholder="Confirm your password"
          />
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="accept-terms"
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-2 cursor-pointer"
            style={{ accentColor: "var(--ink-primary)" }}
          />
          <label
            htmlFor="accept-terms"
            className="text-sm text-gray-600 cursor-pointer select-none font-system"
          >
            I acknowledge that I have read and agree to the{" "}
            <Link
              href={legalHref("/terms", "signup")}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-semibold ${authLinkClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Use
            </Link>
            {" "}and{" "}
            <Link
              href={legalHref("/privacy", "signup")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="accepts-marketing"
            checked={acceptsMarketing}
            onChange={(e) => setAcceptsMarketing(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-2 cursor-pointer"
            style={{ accentColor: "var(--ink-primary)" }}
          />
          <label
            htmlFor="accepts-marketing"
            className="text-sm text-gray-600 cursor-pointer select-none font-system"
          >
            I want to receive promotional emails and updates
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`${authPrimaryButtonClass} mt-6 h-14 text-lg`}
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
    </AuthWelcomeLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#16193a" }} />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}

