"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
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
            
            // Check if user is a seller and needs onboarding
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Try user_id first (actual column name), fallback to id
              let { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_seller, display_name, location_city')
                .eq('user_id', user.id)
                .single();
              
              // If that fails, try id
              if (profileError && profileError.code === 'PGRST116') {
                const retry = await supabase
                  .from('profiles')
                  .select('is_seller, display_name, location_city')
                  .eq('id', user.id)
                  .single();
                profile = retry.data;
                profileError = retry.error;
              }
              
              // If profile doesn't exist, create it
              if (profileError || !profile) {
                console.log('Profile does not exist, creating it...');
                const displayName = user.email?.split('@')[0] || 'User';
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: user.id,
                    email: user.email,
                    display_name: displayName,
                  });
                
                if (createError) {
                  console.error('Error creating profile:', createError);
                } else {
                  console.log('✅ Profile created successfully');
                  // Re-fetch profile
                  const { data: newProfile } = await supabase
                    .from('profiles')
                    .select('is_seller, display_name, location_city')
                    .eq('user_id', user.id)
                    .single();
                  profile = newProfile;
                }
              }
              
              // Route based on user type
              if (profile?.is_seller) {
                // Seller: redirect to onboarding if incomplete, otherwise seller dashboard
                if (!profile?.location_city || !profile?.display_name) {
                  router.push('/seller/onboarding');
                  return;
                } else {
                  router.push('/seller');
                  return;
                }
              } else {
                // Buyer: redirect to account page (My Canvas)
                router.push('/account');
                return;
              }
            }
            
            // Fallback: if no profile info, go to account page
            router.push('/account');
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
            
            // Check if user is a seller and needs onboarding
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Try user_id first (actual column name), fallback to id
              let { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_seller, display_name, location_city')
                .eq('user_id', user.id)
                .single();
              
              // If that fails, try id
              if (profileError && profileError.code === 'PGRST116') {
                const retry = await supabase
                  .from('profiles')
                  .select('is_seller, display_name, location_city')
                  .eq('id', user.id)
                  .single();
                profile = retry.data;
                profileError = retry.error;
              }
              
              // If profile doesn't exist, create it
              if (profileError || !profile) {
                console.log('Profile does not exist, creating it...');
                const displayName = user.email?.split('@')[0] || 'User';
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: user.id,
                    email: user.email,
                    display_name: displayName,
                  });
                
                if (createError) {
                  console.error('Error creating profile:', createError);
                } else {
                  console.log('✅ Profile created successfully');
                  // Re-fetch profile
                  const { data: newProfile } = await supabase
                    .from('profiles')
                    .select('is_seller, display_name, location_city')
                    .eq('user_id', user.id)
                    .single();
                  profile = newProfile;
                }
              }
              
              // Route based on user type
              if (profile?.is_seller) {
                // Seller: redirect to onboarding if incomplete, otherwise seller dashboard
                if (!profile?.location_city || !profile?.display_name) {
                  router.push('/seller/onboarding');
                  return;
                } else {
                  router.push('/seller');
                  return;
                }
              } else {
                // Buyer: redirect to account page (My Canvas)
                router.push('/account');
                return;
              }
            }
            
            // Fallback: if no profile info, go to account page
            router.push('/account');
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

