"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is logged in - redirect to browse feed
          router.push('/browse');
          return;
        }

        // Check if user has beta access email in localStorage
        if (typeof window !== 'undefined') {
          const betaEmail = localStorage.getItem('beta_access_email');
          if (betaEmail) {
            // Verify the email is still valid in beta_access table
            const { data: betaAccess } = await supabase
              .from('beta_access')
              .select('email, status')
              .eq('email', betaEmail)
              .eq('status', 'invited')
              .single();

            if (betaAccess) {
              // Valid beta access - redirect to browse feed
              router.push('/browse');
              return;
            } else {
              // Email no longer valid - clear it
              localStorage.removeItem('beta_access_email');
            }
          }
        }

        // No session found - redirect to gate
        router.push('/auth/gate');
      } catch (err) {
        console.error('Error checking access:', err);
        // On error, redirect to gate for safety
        router.push('/auth/gate');
      }
    };

    checkAccess();
  }, [router]);

  // Show loading while checking
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
      <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
    </div>
  );
}









