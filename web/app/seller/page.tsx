'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TSLogo } from '@/components/TSLogo';
import { Loader2, Plus, ArrowLeft, Settings, MessageSquare, ChevronDown, ChevronUp, MoreVertical, EyeOff, Trash2, CheckCircle, LogOut, Search, Package, HelpCircle, User, Edit, Bookmark, Truck, PackageCheck } from 'lucide-react';
import SellerMessages from './components/SellerMessages';
import Link from 'next/link';
import { StreamChatProvider } from './StreamChatProvider';
import MessagesModal from '@/components/MessagesModal';
import SupportModal from '@/components/SupportModal';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  original_image_url: string | null;
  clean_image_url: string | null;
  created_at: string;
}

interface OrderCardProps {
  order: any;
  onUpdate: () => void;
}

function OrderCard({ order, onUpdate }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  // Note: tracking_number column doesn't exist in orders table yet
  const [trackingNumber, setTrackingNumber] = useState('');

  const getStatusBadge = () => {
    // If shipped_at exists, show "Shipped"
    if (order.shipped_at) {
      return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Shipped' };
    }
    // Otherwise show "Paid"
    return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Paid' };
  };

  const handleMarkShipped = async () => {
    if (!trackingNumber.trim() && !showTrackingInput) {
      setShowTrackingInput(true);
      return;
    }

    if (trackingNumber.trim()) {
      setIsUpdating(true);
      try {
        const response = await fetch('/api/orders/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.orderId,
            status: 'shipped',
            trackingNumber: trackingNumber.trim(),
          }),
        });

        const data = await response.json();
        if (data.error) {
          alert(data.error);
        } else {
          onUpdate();
        }
      } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const statusBadge = getStatusBadge();
  const listing = order.listing;
  const thumbnailUrl = listing?.image ?? null;
  const listingTitle = listing?.title ?? 'Sold item';
  const orderDate = new Date(order.created_at);
  const daysAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

  return (
    <Link href={`/orders/${order.orderId}`} className="block">
      <div
        className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow mb-3"
        style={{ minHeight: '80px' }}
      >
        {/* Horizontal Layout: Thumbnail (left) + Text Content (right) */}
        <div className="flex items-start gap-3">
          {/* Thumbnail - 60x60px, left side */}
          <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={listingTitle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                No image
              </div>
            )}
          </div>
          
          {/* Right Side: Text Content aligned with top of thumbnail */}
          <div 
            className="flex-1 min-w-0 flex flex-col" 
            style={{ 
              gap: '0px', 
              alignSelf: 'flex-start',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Line 1: Title + Status Badge */}
            <div 
              className="flex items-start justify-between w-full" 
              style={{ gap: '0px' }}
            >
              <h3 
                className="text-sm font-medium text-gray-900 m-0 flex-1 min-w-0" 
                style={{ 
                  fontSize: '14px', 
                  lineHeight: '1', 
                  margin: 0, 
                  padding: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}
              >
                {listingTitle}
              </h3>
              
              {/* Status Badge - Top Right */}
              <span 
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge.bg} ${statusBadge.text} whitespace-nowrap flex-shrink-0`}
                style={{ margin: 0, padding: '2px 6px' }}
              >
                {statusBadge.label}
              </span>
            </div>

            {/* Line 2: Price */}
            <div 
              className="flex items-center gap-2" 
              style={{ 
                margin: 0, 
                marginTop: '2px',
                padding: 0
              }}
            >
              <span
                className="text-base font-medium leading-tight"
                style={{ color: "#191970", fontSize: '16px', margin: 0, padding: 0 }}
              >
                ${typeof order.amount === 'number' ? order.amount.toFixed(2) : (parseFloat(String(order.amount || '0')) || 0).toFixed(2)}
              </span>
            </div>

            {/* Line 3: Timestamp */}
            <div 
              className="text-[11px] text-gray-500"
              style={{ 
                margin: 0, 
                marginTop: '2px',
                padding: 0,
                lineHeight: '1.2'
              }}
            >
              <span>Ordered {timeAgo}</span>
            </div>

            {/* Actions - Only show for paid orders that haven't been shipped */}
            {order.status === 'paid' && !order.shipped_at && (
              <div className="mt-2 space-y-2">
                {showTrackingInput && (
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkShipped();
                  }}
                  disabled={isUpdating}
                  className="w-full py-1.5 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  style={{ 
                    backgroundColor: '#191970', 
                    color: 'white',
                    opacity: isUpdating ? 0.6 : 1
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Truck className="h-3 w-3" />
                      {showTrackingInput ? 'Mark as Shipped' : 'Add Tracking & Ship'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const parseMoney = (v: unknown) => {
  if (v == null) return 0;
  const s = String(v).replace(/[^0-9.-]/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  // If it looks like cents (e.g., 2000 for $20), convert to dollars
  return n >= 1000 ? n / 100 : n;
};

export default function SellerDashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [soldOrders, setSoldOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesExpanded, setMessagesExpanded] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    soldCount: 0,
    totalEarnings: 0,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/seller');
      return;
    }

    if (user) {
      checkOnboardingAndFetchData();
    }
  }, [user, authLoading]);

  // Check Stripe status when stripe_success is in URL
  useEffect(() => {
    const stripeSuccess = searchParams?.get('stripe_success');
    const stripeRefresh = searchParams?.get('stripe_refresh');
    
    if (user && profile && (stripeSuccess || stripeRefresh)) {
      console.log('🔄 Stripe redirect detected, checking status...');
      // Wait a bit for profile to be fully loaded, then check status
      const checkStatus = async () => {
        await checkStripeStatus();
        // Refresh profile data after status check
        await checkOnboardingAndFetchData();
      };
      checkStatus();
      
      // Clean up URL params after checking status
      setTimeout(() => {
        router.replace('/seller', { scroll: false });
      }, 1000); // Give more time for status check to complete
    }
  }, [user, profile, searchParams]);

  const checkStripeStatus = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found for Stripe status check');
        return;
      }

      console.log('🔍 Checking Stripe account status...');
      
      const response = await fetch('/api/stripe/account-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.error) {
        console.error('❌ Error checking Stripe status:', data.error);
        return;
      }

      console.log('✅ Stripe status check result:', {
        profile_id: user.id,
        stripe_account_id: data.account_id,
        charges_enabled: data.charges_enabled,
        payouts_enabled: data.payouts_enabled,
        details_submitted: data.details_submitted,
      });

      // Update profile state with new Stripe status
      setProfile((prev: any) => {
        const updated = {
          ...prev,
          stripe_charges_enabled: data.charges_enabled,
          stripe_payouts_enabled: data.payouts_enabled,
          stripe_details_submitted: data.details_submitted,
          stripe_account_id: data.account_id || prev?.stripe_account_id,
        };
        console.log('📝 Updated profile state with Stripe status:', {
          has_account: !!updated.stripe_account_id,
          charges_enabled: updated.stripe_charges_enabled,
          details_submitted: updated.stripe_details_submitted,
          is_connected_enough: !!(updated.stripe_account_id && (updated.stripe_details_submitted || updated.stripe_charges_enabled)),
        });
        return updated;
      });

      // Also refresh from database to get updated values (only if columns exist)
      try {
        const { data: updatedProfile, error: refreshError } = await supabase
          .from('profiles')
          .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_onboarded_at')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle to handle missing columns gracefully
        
        if (refreshError) {
          // If columns don't exist, that's okay - we already have the data from the API
          if (refreshError.code === '42703' || refreshError.message?.includes('column')) {
            console.log('⚠️ Stripe status columns may not exist yet, using API response data');
          } else {
            console.error('❌ Error refreshing profile:', refreshError);
          }
        }

        if (updatedProfile) {
          setProfile((prev: any) => {
            const merged = {
              ...prev,
              ...updatedProfile,
            };
            console.log('📝 Merged database profile with Stripe status:', {
              has_account: !!merged.stripe_account_id,
              charges_enabled: merged.stripe_charges_enabled,
              details_submitted: merged.stripe_details_submitted,
              is_connected_enough: !!(merged.stripe_account_id && (merged.stripe_details_submitted || merged.stripe_charges_enabled)),
            });
            return merged;
          });
        }
      } catch (err) {
        // Columns may not exist yet - that's okay, we'll just use the data from the API response
        console.log('⚠️ Could not fetch Stripe status columns (may not exist yet)');
      }
    } catch (err) {
      console.error('❌ Error in checkStripeStatus:', err);
    }
  };

  const checkOnboardingAndFetchData = async () => {
    if (!user) return;

    try {
      console.log('🔍 Checking seller profile for user:', user.id);
      
      // Check if seller profile is set up
      // Try user_id first (actual column name), fallback to id
      // Note: Stripe status columns may not exist yet if SQL migration hasn't been run
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller, display_name, location_city, avatar_url, created_at, stripe_account_id, stripe_onboarding_status')
        .eq('user_id', user.id)
        .single();
      
      // If that fails, try id
      if (profileError && profileError.code === 'PGRST116') {
        const retry = await supabase
          .from('profiles')
          .select('is_seller, display_name, location_city, avatar_url, created_at, stripe_account_id, stripe_onboarding_status')
          .eq('id', user.id)
          .single();
        profile = retry.data;
        profileError = retry.error;
      }

      // If query failed due to missing columns, try again without Stripe status columns
      if (profileError && (profileError.message?.includes('column') || profileError.code === '42703')) {
        console.log('⚠️ Stripe status columns may not exist, retrying without them...');
        const retry = await supabase
          .from('profiles')
          .select('is_seller, display_name, location_city, avatar_url, created_at, stripe_account_id, stripe_onboarding_status')
          .eq('user_id', user.id)
          .single();
        profile = retry.data;
        profileError = retry.error;
      }

      console.log('📊 Profile query result:', { profile, error: profileError });

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        console.error('Error details:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        });
        // If profile doesn't exist, redirect to onboarding
        router.push('/seller/onboarding');
        return;
      }

      if (!profile) {
        console.error('❌ Profile is null/undefined');
        router.push('/seller/onboarding');
        return;
      }

      // Check if values are empty strings (which are falsy in JS)
      const hasDisplayName = profile.display_name && String(profile.display_name).trim().length > 0;
      const hasLocationCity = profile.location_city && String(profile.location_city).trim().length > 0;
      const isSeller = profile.is_seller === true;

      console.log('✅ Profile check:', {
        isSeller,
        hasDisplayName,
        hasLocationCity,
        displayNameValue: profile.display_name,
        displayNameType: typeof profile.display_name,
        locationCityValue: profile.location_city,
        locationCityType: typeof profile.location_city,
        fullProfile: profile
      });

      // If not a seller, redirect to onboarding to become a seller
      if (!isSeller) {
        console.log('⚠️ User is not a seller, redirecting to onboarding');
        router.push('/seller/onboarding');
        return;
      }

      // If seller but missing key info, redirect to onboarding
      // Make this check less strict - only require display_name OR location_city
      // Actually, let's be more lenient - if they're a seller, show dashboard
      // They can complete profile later if needed
      if (!hasDisplayName && !hasLocationCity) {
        console.log('⚠️ Seller profile very incomplete (no name or city), redirecting to onboarding', {
          hasDisplayName,
          hasLocationCity,
          displayName: profile.display_name,
          locationCity: profile.location_city
        });
        router.push('/seller/onboarding');
        return;
      }

      // Profile is complete enough, fetch seller data
      console.log('✅ Seller profile OK, loading dashboard');
      setProfile(profile);
      
      // Always check Stripe status if account_id exists (or if stripe_success is in URL)
      const stripeSuccess = searchParams?.get('stripe_success');
      const stripeRefresh = searchParams?.get('stripe_refresh');
      if (profile.stripe_account_id || stripeSuccess || stripeRefresh) {
        console.log('🔄 Checking Stripe status on profile load...');
        await checkStripeStatus();
        // Re-fetch profile after status check to get updated values
        const { data: refreshedProfile } = await supabase
          .from('profiles')
          .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_onboarded_at, display_name, location_city, avatar_url, is_seller, created_at')
          .eq('user_id', user.id)
          .maybeSingle();
        if (refreshedProfile) {
          setProfile(refreshedProfile);
        }
      }
      
      fetchSellerData();
    } catch (err) {
      console.error('❌ Error in checkOnboardingAndFetchData:', err);
      // No profile exists or error, redirect to onboarding
      router.push('/seller/onboarding');
    }
  };

  const fetchSellerData = async () => {
    if (!user) return;

    try {
      // Fetch seller's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, status, original_image_url, clean_image_url, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      setListings(listingsData || []);
      
      // Fetch seller's orders - MINIMAL query
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, created_at, seller_id, status, shipped_at, amount, listing_id")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Filter for paid orders only
      const paidOrders = (ordersData ?? []).filter(o => String(o.status).toLowerCase() === "paid");
      const totalEarnings = paidOrders.reduce((sum, o) => sum + (typeof o.amount === "number" ? o.amount : parseFloat(String(o.amount))), 0);
      
      // Fetch listings for these orders
      const listingIds = paidOrders.map(o => o.listing_id).filter(Boolean);
      const { data: soldListings } = await supabase
        .from("listings")
        .select("id, title, price, clean_image_url, staged_image_url")
        .in("id", listingIds as any);
      
      const soldMap = new Map((soldListings ?? []).map(l => [l.id, l]));
      
      const soldCards = paidOrders.map(o => {
        const l = soldMap.get(o.listing_id);
        return {
          orderId: o.id,
          status: o.shipped_at ? "shipped" : o.status,
          amount: o.amount,
          shipped_at: o.shipped_at,
          created_at: o.created_at,
          listing: l ? {
            id: l.id,
            title: l.title,
            price: l.price,
            image: l.clean_image_url ?? l.staged_image_url ?? null,
          } : null
        };
      });
      
      setSoldOrders(soldCards);
      
      // Calculate stats
      const active = listingsData?.filter(l => l.status === 'active').length || 0;
      
      setStats(prev => ({
        ...prev,
        totalListings: listingsData?.length || 0,
        activeListings: active,
        totalViews: 0, // Would need a views table
        soldCount: paidOrders.length,
        totalEarnings,
      }));

    } catch (err: any) {
      console.error('Error fetching seller data:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        status: err?.status,
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (listingId: string, newStatus: 'hidden' | 'sold' | 'active', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;

    // If publishing (setting to active), use the API route which enforces Stripe check
    if (newStatus === 'active' && !isStripeConnectedEnough) {
      alert('Connect payouts with Stripe to publish listings.');
      return;
    }
    
    setUpdatingId(listingId);
    setShowMenuId(null);

    try {
      // If publishing, use the API route
      if (newStatus === 'active') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        const publishResponse = await fetch('/api/listings/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ listingId }),
        });

        const publishData = await publishResponse.json();

        if (!publishResponse.ok) {
          if (publishData.code === 'STRIPE_NOT_COMPLETE') {
            alert('Connect payouts with Stripe to publish listings.');
          } else {
            alert(publishData.error || 'Failed to publish listing');
          }
          return;
        }
      } else {
        // For other status changes, use direct update
        const { error: updateStatusError } = await supabase
          .from('listings')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', listingId)
          .eq('seller_id', user.id);

        if (updateStatusError) throw updateStatusError;
      }

      // Refresh listings
      await fetchSellerData();
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Failed to update listing. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    if (!confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) {
      return;
    }

    setUpdatingId(listingId);
    setShowMenuId(null);

    try {
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (deleteError) throw deleteError;

      // Refresh listings
      await fetchSellerData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <StreamChatProvider>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF8E6", fontFamily: "Merriweather, serif" }}>
          <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
        </div>
      </StreamChatProvider>
    );
  }

  const getJoinYear = () => {
    if (!profile?.created_at) return new Date().getFullYear();
    return new Date(profile.created_at).getFullYear();
  };

  // Beta gating: Stripe connected enough = stripe_account_id exists AND (details_submitted OR charges_enabled)
  const hasStripeAccount = !!profile?.stripe_account_id;
  const isStripeConnectedEnough = hasStripeAccount && 
    (profile?.stripe_details_submitted === true || profile?.stripe_charges_enabled === true);
  const needsStripeSetup = !hasStripeAccount || (!profile?.stripe_charges_enabled && !profile?.stripe_details_submitted);
  
  // Show "Payments Connected ✓" if fully connected
  const isStripeFullyConnected = profile?.stripe_charges_enabled === true || profile?.stripe_details_submitted === true;
  
  // Debug logging for Stripe status
  console.log('🔍 Stripe status check:', {
    hasStripeAccount,
    stripe_account_id: profile?.stripe_account_id,
    stripe_charges_enabled: profile?.stripe_charges_enabled,
    stripe_details_submitted: profile?.stripe_details_submitted,
    isStripeConnectedEnough,
    isStripeFullyConnected,
    shouldShowSetupBanner: !isStripeConnectedEnough,
  });

  return (
    <StreamChatProvider>
    <div className="min-h-screen pb-16 bg-gray-50" style={{ fontFamily: "Merriweather, serif" }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#191970" }}
      >
        <Link href="/browse" className="flex items-center gap-2">
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <Link
          href="/browse"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Back to Discovery"
        >
          <ArrowLeft size={20} className="text-white" />
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Profile Section */}
        {profile && (
          <div className="bg-white rounded-xl px-4 py-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: "#EFBF05" }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {profile.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "S"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold" style={{ color: "#191970" }}>
                  {profile.display_name || "Seller Dashboard"}
                </h1>
                <p className="text-xs text-gray-600">Storytelling seller since {getJoinYear()}</p>
              </div>
            </div>

            {/* Stripe Payment Status Banner */}
            {!isStripeConnectedEnough ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xs font-semibold text-amber-900 leading-tight mb-1">Almost ready to sell</h2>
                    <p className="text-[10px] leading-tight" style={{ color: "#333333" }}>
                      You can draft listings now. Connect payouts before you publish.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                          alert('Please log in to set up payouts');
                          return;
                        }
                        const response = await fetch('/api/stripe/create-account-link', { 
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                          },
                        });
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else if (data.error) {
                          alert(data.error);
                        }
                      } catch (err) {
                        console.error('Error creating Stripe link:', err);
                        alert('Failed to set up payouts. Please try again.');
                      }
                    }}
                    style={{ backgroundColor: '#191970', color: 'white' }}
                    className="hover:opacity-90 text-xs h-8 px-4 shrink-0 leading-none rounded-lg flex items-center justify-center transition-all font-medium shadow-sm"
                  >
                    Finish payout setup
                  </button>
                </div>
              </div>
            ) : isStripeFullyConnected ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <h2 className="text-xs font-semibold text-green-900 leading-tight">Payments Connected ✓</h2>
                    <p className="text-[10px] leading-tight text-green-700">
                      Your Stripe account is set up and ready to receive payouts.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Add New Listing Button - Sticky */}
        <div className="sticky top-[56px] z-30 mb-4 bg-gray-50 pb-2">
          <Link
            href="/sell"
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            style={{ 
              backgroundColor: '#191970', 
              color: 'white',
            }}
          >
            <Plus size={20} />
            Add New Listing
          </Link>
        </div>

        {/* Stats Cards - Mobile-first vertical stack */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold mb-1" style={{ color: "#10b981" }}>{stats.activeListings}</div>
            <div className="text-[11px] font-medium text-gray-600">Active Listings</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold mb-1" style={{ color: "#191970" }}>{stats.totalListings - stats.activeListings}</div>
            <div className="text-[11px] font-medium text-gray-600">Drafts</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold mb-1" style={{ color: "#191970" }}>{stats.soldCount}</div>
            <div className="text-[11px] font-medium text-gray-600">Sold Items</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold mb-1" style={{ color: "#EFBF05" }}>
              ${stats.totalEarnings.toFixed(2)}
            </div>
            <div className="text-[11px] font-medium text-gray-600">Total Earnings</div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowOrders(!showOrders)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h2 className="text-base font-semibold" style={{ color: "#191970" }}>
              Orders
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {soldOrders.length}
              </span>
              {showOrders ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </button>
          {showOrders && (
            <div className="bg-white rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto mb-4" style={{ scrollbarWidth: 'thin' }}>
              {soldOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">No orders yet</p>
                </div>
              ) : (
                <div className="p-2">
                  {soldOrders.map((order: any) => (
                    <OrderCard key={order.orderId} order={order} onUpdate={fetchSellerData} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Your Listings */}
        <div className="mb-4">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#191970" }}>
            Your Listings
          </h2>
          
          {listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                No listings yet.{" "}
                <Link href="/sell" className="text-[#191970] hover:underline font-medium">
                  Create your first listing
                </Link>
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="p-2">
                {listings.map((listing) => {
                  // Calculate time since posted
                  const postedDate = new Date(listing.created_at);
                  const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
                  const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
                  
                  // Determine status badge color and text
                  const getStatusBadge = () => {
                    const status = listing.status || 'draft';
                    if (status === 'active') {
                      return { bg: 'bg-green-100', text: 'text-green-700', label: 'active' };
                    } else if (status === 'sold') {
                      // Check if there's a payment status - for now assume sold = awaiting payment
                      return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'sold' };
                    } else if (status === 'paid') {
                      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'paid' };
                    } else if (status === 'shipped') {
                      return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'shipped' };
                    } else if (status === 'hidden') {
                      return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'hidden' };
                    } else {
                      return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'draft' };
                    }
                  };
                  
                  const statusBadge = getStatusBadge();
                  
                  return (
                  <div
                    key={listing.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow mb-3"
                    style={{ minHeight: '80px' }}
                  >
                    {/* Horizontal Layout: Thumbnail (left) + Text Content (right) */}
                    <div className="flex items-start gap-3">
                      {/* Thumbnail - 60x60px, left side */}
                      <Link
                        href={`/listing/${listing.id}`}
                        className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                      >
                        {(listing.clean_image_url || listing.original_image_url) ? (
                          <img
                            src={listing.clean_image_url || listing.original_image_url || ''}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                            No image
                          </div>
                        )}
                      </Link>
                      
                      {/* Right Side: Text Content aligned with top of thumbnail */}
                      <div 
                        className="flex-1 min-w-0 flex flex-col" 
                        style={{ 
                          gap: '0px', 
                          alignSelf: 'flex-start',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {/* Line 1: Title + Three-dot Menu */}
                        <div 
                          className="flex items-start justify-between w-full" 
                          style={{ gap: '0px' }}
                        >
                          <Link
                            href={`/listing/${listing.id}`}
                            className="flex-1 min-w-0"
                            style={{ 
                              paddingRight: '16px', 
                              maxWidth: 'calc(100% - 56px)',
                              margin: 0,
                              paddingTop: 0,
                              paddingBottom: 0
                            }}
                          >
                            <h3 
                              className="text-sm font-medium text-gray-900 m-0" 
                              style={{ 
                                fontSize: '14px', 
                                lineHeight: '1', 
                                margin: 0, 
                                padding: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'block'
                              }}
                            >
                              {listing.title}
                            </h3>
                          </Link>
                          
                          {/* Three-dot Menu - Top Right */}
                          <div 
                            className="relative flex-shrink-0" 
                            style={{ 
                              alignSelf: 'flex-start', 
                              marginTop: 0,
                              marginBottom: 0
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMenuId(showMenuId === listing.id ? null : listing.id);
                              }}
                              disabled={updatingId === listing.id}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                              aria-label="More options"
                              style={{ margin: 0, padding: '8px' }}
                            >
                              {updatingId === listing.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                              ) : (
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              )}
                            </button>

                            {showMenuId === listing.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowMenuId(null)}
                                />
                                <div
                                  className="absolute right-0 top-11 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
                                >
                                  <div className="py-1">
                                    {(listing.status === 'active' || listing.status === 'draft') && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowMenuId(null);
                                            router.push(`/sell?edit=${listing.id}`);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                                        >
                                          <Edit className="h-4 w-4" />
                                          Edit Listing
                                        </button>
                                        <div className="border-t border-gray-200 my-1" />
                                      </>
                                    )}
                                    {listing.status !== 'active' && (
                                      <button
                                        onClick={(e) => {
                                          if (!isStripeConnectedEnough) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            alert('Connect payouts with Stripe to publish listings.');
                                            return;
                                          }
                                          handleUpdateStatus(listing.id, 'active', e);
                                        }}
                                        disabled={!isStripeConnectedEnough}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                                          !isStripeConnectedEnough 
                                            ? 'text-gray-400 cursor-not-allowed' 
                                            : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Mark as Active
                                      </button>
                                    )}
                                    {listing.status !== 'sold' && (
                                      <button
                                        onClick={(e) => handleUpdateStatus(listing.id, 'sold', e)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Mark as Sold
                                      </button>
                                    )}
                                    {listing.status !== 'hidden' && (
                                      <button
                                        onClick={(e) => handleUpdateStatus(listing.id, 'hidden', e)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                                      >
                                        <EyeOff className="h-4 w-4" />
                                        Hide Listing
                                      </button>
                                    )}
                                    <div className="border-t border-gray-200 my-1" />
                                    <button
                                      onClick={(e) => handleDelete(listing.id, e)}
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
                        </div>

                        {/* Line 2: Price (16px, medium weight) + Status Badge */}
                        <div 
                          className="flex items-center gap-2" 
                          style={{ 
                            margin: 0, 
                            marginTop: '2px',
                            padding: 0
                          }}
                        >
                          <Link
                            href={`/listing/${listing.id}`}
                            className="text-base font-medium leading-tight"
                            style={{ color: "#191970", fontSize: '16px', margin: 0, padding: 0 }}
                          >
                            ${listing.price?.toFixed(2) || '0.00'}
                          </Link>
                          <span 
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge.bg} ${statusBadge.text}`}
                            style={{ margin: 0, padding: '2px 6px' }}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Line 3: Timestamp (or payment status for sold items) */}
                        <div 
                          className="text-[11px] text-gray-500"
                          style={{ 
                            margin: 0, 
                            marginTop: '2px',
                            padding: 0,
                            lineHeight: '1.2'
                          }}
                        >
                          {listing.status === 'sold' ? (
                            <span>Posted {timeAgo} • Awaiting payment</span>
                          ) : (
                            <span>Posted {timeAgo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer Navigation - Simplified like v0 */}
      <nav 
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-2.5 z-30"
        style={{ backgroundColor: "#191970" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setMessagesOpen(true)}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px]">Messages</span>
          </button>
          <button
            onClick={() => setSupportOpen(true)}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-[10px]">Support</span>
          </button>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-[10px]">Settings</span>
          </Link>
          <Link
            href="/canvas"
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <Bookmark className="h-4 w-4" />
            <span className="text-[10px]">Favorites</span>
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.push('/browse');
            }}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[10px]">Logout</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <MessagesModal isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
    </StreamChatProvider>
  );
}

