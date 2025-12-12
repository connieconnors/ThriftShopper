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
        // Check for hash fragments first (Supabase email confirmation uses these)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const token_hash = hashParams.get('token_hash');

        // Also check query params (some flows use these)
        const queryTokenHash = searchParams.get('token_hash');
        const queryType = searchParams.get('type');
        const next = searchParams.get('next') || '/browse';

        // Use hash params first (email confirmation), then query params
        const finalTokenHash = token_hash || queryTokenHash;
        const finalType = type || queryType;

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
              // Check if seller (is_seller === true) - use strict equality to handle NULL
              const isSeller = profile?.is_seller === true;
              const isIncomplete = !profile?.location_city || !profile?.display_name;
              
              console.log('🔍 Auth callback routing check:', {
                isSeller,
                isIncomplete,
                hasLocationCity: !!profile?.location_city,
                hasDisplayName: !!profile?.display_name,
                is_seller_value: profile?.is_seller
              });
              
              if (isSeller) {
                // Seller: redirect to onboarding if incomplete, otherwise seller dashboard
                if (isIncomplete) {
                  console.log('✅ Seller profile incomplete, routing to onboarding');
                  router.push('/seller/onboarding');
                  return;
                } else {
                  console.log('✅ Seller profile complete, routing to dashboard');
                  router.push('/seller');
                  return;
                }
              } else {
                // Buyer: redirect to browse page (they can access My Canvas via TS button)
                console.log('ℹ️ Buyer or is_seller not set, routing to browse');
                router.push('/browse');
                return;
              }
            }
            
            // Fallback: if no profile info, go to browse page
            router.push('/browse');
            return;
          }
        }

        // Otherwise, try to verify OTP token (from hash or query params)
        if (finalTokenHash && finalType) {
          console.log('🔍 Auth callback: Verifying OTP token', { 
            hasTokenHash: !!finalTokenHash, 
            type: finalType,
            source: token_hash ? 'hash' : 'query'
          });
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: finalType as any,
            token_hash: finalTokenHash,
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
              // Check if seller (is_seller === true) - use strict equality to handle NULL
              const isSeller = profile?.is_seller === true;
              const isIncomplete = !profile?.location_city || !profile?.display_name;
              
              console.log('🔍 Auth callback routing check:', {
                isSeller,
                isIncomplete,
                hasLocationCity: !!profile?.location_city,
                hasDisplayName: !!profile?.display_name,
                is_seller_value: profile?.is_seller
              });
              
              if (isSeller) {
                // Seller: redirect to onboarding if incomplete, otherwise seller dashboard
                if (isIncomplete) {
                  console.log('✅ Seller profile incomplete, routing to onboarding');
                  router.push('/seller/onboarding');
                  return;
                } else {
                  console.log('✅ Seller profile complete, routing to dashboard');
                  router.push('/seller');
                  return;
                }
              } else {
                // Buyer: redirect to browse page (they can access My Canvas via TS button)
                console.log('ℹ️ Buyer or is_seller not set, routing to browse');
                router.push('/browse');
                return;
              }
            }
            
            // Fallback: if no profile info, go to browse page
            router.push('/browse');
            return;
          }
        }

        // If we get here, no valid token was found
        // Log what we found for debugging
        console.error('❌ Auth callback: No valid token found', {
          hash: window.location.hash,
          search: window.location.search,
          hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))),
          queryParams: Object.fromEntries(searchParams.entries())
        });
        
        // If we have a hash but no token, try to extract and set session directly
        if (window.location.hash && access_token && refresh_token) {
          console.log('🔍 Auth callback: Found tokens in hash, setting session directly');
          try {
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
                const isSeller = profile?.is_seller === true;
                const isIncomplete = !profile?.location_city || !profile?.display_name;
                
                if (isSeller) {
                  // Seller: redirect to onboarding if incomplete, otherwise seller dashboard
                  if (isIncomplete) {
                    console.log('✅ Seller profile incomplete, routing to onboarding');
                    router.push('/seller/onboarding');
                    return;
                  } else {
                    console.log('✅ Seller profile complete, routing to dashboard');
                    router.push('/seller');
                    return;
                  }
                } else {
                  // Buyer: redirect to browse page
                  console.log('ℹ️ Buyer, routing to browse');
                  router.push('/browse');
                  return;
                }
              }
              
              // Fallback: if no profile info, go to browse page
              router.push('/browse');
              return;
            }
          } catch (err) {
            console.error('Error setting session from hash:', err);
          }
        }
        
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

