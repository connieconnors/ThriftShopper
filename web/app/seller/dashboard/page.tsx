'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function SellerDashboardRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query params when redirecting
    const stripeSuccess = searchParams?.get('stripe_success');
    const stripeRefresh = searchParams?.get('stripe_refresh');
    
    let redirectUrl = '/seller';
    if (stripeSuccess) {
      redirectUrl += '?stripe_success=true';
    } else if (stripeRefresh) {
      redirectUrl += '?stripe_refresh=true';
    }
    
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-[#191970] border-t-transparent rounded-full" />
    </div>
  );
}

export default function SellerDashboardRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#191970] border-t-transparent rounded-full" />
      </div>
    }>
      <SellerDashboardRedirectContent />
    </Suspense>
  );
}

