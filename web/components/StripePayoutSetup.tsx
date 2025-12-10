'use client';

import { useState } from 'react';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface StripePayoutSetupProps {
  stripeAccountId: string | null;
  onboardingStatus: string | null;
}

export function StripePayoutSetup({ stripeAccountId, onboardingStatus }: StripePayoutSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSetupPayouts = async () => {
    if (!user) {
      alert('Please log in to set up payouts');
      return;
    }

    setIsLoading(true);
    try {
      // Get the auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Call the API to create account link
      const response = await fetch('/api/stripe/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account link');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (error) {
      console.error('Error setting up payouts:', error);
      alert(error instanceof Error ? error.message : 'Failed to set up payouts. Please try again.');
      setIsLoading(false);
    }
  };

  // Show different states based on onboarding status
  if (onboardingStatus === 'completed') {
    return (
      <div 
        className="p-4 rounded-lg mb-6"
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: '#166534', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              ✓ Payouts Set Up
            </div>
            <div style={{ color: '#15803d', fontSize: '12px' }}>
              Your Stripe account is connected and ready to receive payouts.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (onboardingStatus === 'needs_verification') {
    return (
      <div 
        className="p-4 rounded-lg mb-6"
        style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: '#92400e', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              ⚠ Verification Needed
            </div>
            <div style={{ color: '#b45309', fontSize: '12px', marginBottom: '8px' }}>
              Please complete your Stripe account verification to receive payouts.
            </div>
            <button
              onClick={handleSetupPayouts}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: '#efbf04',
                color: '#000080',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {isLoading ? 'Loading...' : 'Complete Verification'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: pending or not set up
  return (
    <div 
      className="p-4 rounded-lg mb-6"
      style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #93c5fd',
      }}
    >
      <div className="flex items-center justify-between">
        <div style={{ flex: 1 }}>
          <div style={{ color: '#1e40af', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Set Up Payouts
          </div>
          <div style={{ color: '#1e3a8a', fontSize: '12px', marginBottom: '8px' }}>
            ThriftShopper uses Stripe to process payouts. You must complete Stripe's secure onboarding to receive sales proceeds.
          </div>
          <button
            onClick={handleSetupPayouts}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: '#000080',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {isLoading ? 'Loading...' : 'Set Up Payouts'}
          </button>
        </div>
      </div>
    </div>
  );
}

