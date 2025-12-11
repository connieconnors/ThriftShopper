'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { StripePayoutSetup } from '../../components/StripePayoutSetup';
import Link from 'next/link';
import { MoreVertical, EyeOff, Trash2, CheckCircle, Edit } from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/seller-dashboard');
      return;
    }
    
    // Check if user is a seller before showing dashboard
    checkSellerStatus();
  }, [user]);

  const checkSellerStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_seller, display_name, location_city')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking seller status:', error);
        router.push('/seller/onboarding');
        return;
      }
      
      if (!profile?.is_seller) {
        // Not a seller, redirect to browse
        router.push('/browse');
        return;
      }
      
      // Be more lenient - if they're a seller, show dashboard
      // Only redirect to onboarding if BOTH name and city are missing
      const hasDisplayName = profile.display_name && String(profile.display_name).trim().length > 0;
      const hasLocationCity = profile.location_city && String(profile.location_city).trim().length > 0;
      
      if (!hasDisplayName && !hasLocationCity) {
        // Seller but very incomplete profile, redirect to onboarding
        console.log('⚠️ Seller profile very incomplete, redirecting to onboarding');
        router.push('/seller/onboarding');
        return;
      }
      
      // Seller with profile (even if partially complete), show dashboard
      console.log('✅ Seller profile OK, showing dashboard');
      fetchDashboardData();
    } catch (err) {
      console.error('Error in checkSellerStatus:', err);
      router.push('/seller/onboarding');
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return; // Guard clause for TypeScript
    
    try {
      // Fetch profile with Stripe info (using id - it's the primary key that references auth.users(id))
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, stripe_account_id, stripe_onboarding_status')
        .eq('id', user.id)
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

  const handleUpdateStatus = async (listingId: string, newStatus: 'hidden' | 'sold' | 'active') => {
    if (!user) return;
    
    setUpdatingId(listingId);
    setShowMenuId(null);

    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('seller_id', user.id); // Security: only update own listings

      if (error) throw error;

      // Refresh listings
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Failed to update listing. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) {
      return;
    }

    setUpdatingId(listingId);
    setShowMenuId(null);

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user.id); // Security: only delete own listings

      if (error) throw error;

      // Refresh listings
      await fetchDashboardData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#191970', borderTopColor: 'transparent' }}></div>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No listings yet. <Link href="/sell" className="text-blue-600 hover:underline">Create your first listing</Link>
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {listing.original_image_url && (
                            <img
                              src={listing.original_image_url}
                              alt={listing.title || 'Listing'}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#1f2937' }}>
                              {listing.title || 'Untitled'}
                            </div>
                            <Link
                              href={`/listing/${listing.id}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View listing
                            </Link>
                          </div>
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
                              : listing.status === 'hidden'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowMenuId(showMenuId === listing.id ? null : listing.id)}
                            disabled={updatingId === listing.id}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            style={{ color: '#6b7280' }}
                          >
                            {updatingId === listing.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </button>

                          {showMenuId === listing.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenuId(null)}
                              />
                              <div
                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
                                style={{ fontFamily: 'Merriweather, serif' }}
                              >
                                <div className="py-1">
                                  {listing.status !== 'active' && (
                                    <button
                                      onClick={() => handleUpdateStatus(listing.id, 'active')}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      style={{ color: '#1f2937' }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Mark as Active
                                    </button>
                                  )}
                                  {listing.status !== 'sold' && (
                                    <button
                                      onClick={() => handleUpdateStatus(listing.id, 'sold')}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      style={{ color: '#1f2937' }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Mark as Sold
                                    </button>
                                  )}
                                  {listing.status !== 'hidden' && (
                                    <button
                                      onClick={() => handleUpdateStatus(listing.id, 'hidden')}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      style={{ color: '#1f2937' }}
                                    >
                                      <EyeOff className="h-4 w-4" />
                                      Hide Listing
                                    </button>
                                  )}
                                  <div className="border-t border-gray-200 my-1" />
                                  <button
                                    onClick={() => handleDelete(listing.id)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Permanently
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
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

