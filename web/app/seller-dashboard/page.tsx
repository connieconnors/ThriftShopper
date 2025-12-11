'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { StripePayoutSetup } from '../../components/StripePayoutSetup';
import Link from 'next/link';

export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return; // Guard clause for TypeScript
    
    try {
      // Fetch profile with Stripe info (using user_id - the actual column name)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, stripe_account_id, stripe_onboarding_status')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch seller's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      setListings(listingsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
          <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeListings = listings.filter(l => l.status === 'active').length;
  const draftListings = listings.filter(l => l.status === 'draft').length;
  const soldListings = listings.filter(l => l.status === 'sold').length;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Merriweather, serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
            Seller Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage your listings and payouts
          </p>
        </div>

        {/* Stripe Payout Setup */}
        <StripePayoutSetup
          stripeAccountId={profile?.stripe_account_id || null}
          onboardingStatus={profile?.stripe_onboarding_status || null}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold mb-1" style={{ color: '#1f2937' }}>
              {activeListings}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Active Listings
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold mb-1" style={{ color: '#1f2937' }}>
              {draftListings}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Drafts
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold mb-1" style={{ color: '#1f2937' }}>
              {soldListings}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Sold Items
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold mb-1" style={{ color: '#1f2937' }}>
              ${(listings
                .filter(l => l.status === 'sold')
                .reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0)
              ).toFixed(2)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Total Earnings
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/sell"
            className="px-6 py-3 rounded-lg transition-all hover:opacity-90"
            style={{
              backgroundColor: '#000080',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Add New Listing
          </Link>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold" style={{ color: '#1f2937' }}>
              Your Listings
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No listings yet. <Link href="/sell" className="text-blue-600 hover:underline">Create your first listing</Link>
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: '#1f2937' }}>
                          {listing.title || 'Untitled'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#1f2937' }}>
                          ${parseFloat(listing.price || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            listing.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : listing.status === 'sold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

