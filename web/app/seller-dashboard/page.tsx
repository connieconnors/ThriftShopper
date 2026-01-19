'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

/**
 * Legacy seller dashboard route - redirects to new /seller route
 * This page is kept for backwards compatibility with old links/bookmarks
 */
export default function SellerDashboardRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?redirect=/seller');
      } else {
        // Redirect to the new seller dashboard
        router.push('/seller');
      }
    }
  }, [user, isLoading, router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#191970', borderTopColor: 'transparent' }}></div>
        <p style={{ color: '#6b7280' }}>Redirecting...</p>
      </div>
    </div>
  );
}
