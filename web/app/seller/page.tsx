'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TSLogo } from '@/components/TSLogo';
import { Loader2, Plus, ArrowLeft, Settings, MessageSquare, ChevronDown, ChevronUp, MoreVertical, EyeOff, Trash2, CheckCircle, LogOut, Search, Package, HelpCircle, User, Edit, Bookmark } from 'lucide-react';
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

export default function SellerDashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesExpanded, setMessagesExpanded] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalSales: 0,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/seller');
      return;
    }

    if (user) {
      checkOnboardingAndFetchData();
    }
  }, [user, authLoading]);

  const checkOnboardingAndFetchData = async () => {
    if (!user) return;

    try {
      console.log('🔍 Checking seller profile for user:', user.id);
      
      // Check if seller profile is set up
      // Try user_id first (actual column name), fallback to id
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

      // If not a seller, redirect to browse (they shouldn't be here)
      if (!isSeller) {
        console.log('⚠️ User is not a seller, redirecting to browse');
        router.push('/browse');
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
      const { data: listingsData, error } = await supabase
        .from('listings')
        .select('id, title, price, status, original_image_url, clean_image_url, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings(listingsData || []);
      
      // Calculate stats
      const active = listingsData?.filter(l => l.status === 'active').length || 0;
      const sold = listingsData?.filter(l => l.status === 'sold').length || 0;
      
      setStats({
        totalListings: listingsData?.length || 0,
        activeListings: active,
        totalViews: 0, // Would need a views table
        totalSales: sold,
      });

    } catch (err) {
      console.error('Error fetching seller data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (listingId: string, newStatus: 'hidden' | 'sold' | 'active', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
        .eq('seller_id', user.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (error) throw error;

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF8E6", fontFamily: "Merriweather, serif" }}>
        <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
      </div>
    );
  }

  const getJoinYear = () => {
    if (!profile?.created_at) return new Date().getFullYear();
    return new Date(profile.created_at).getFullYear();
  };

  const needsStripeSetup = !profile?.stripe_account_id || profile?.stripe_onboarding_status !== 'completed';

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

            {/* Stripe Payout Setup Banner */}
            {needsStripeSetup && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xs font-semibold text-blue-900 leading-tight mb-1">Set Up Payouts</h2>
                    <p className="text-[10px] leading-tight" style={{ color: "#333333" }}>
                      ThriftShopper uses Stripe to process payouts. Complete onboarding to receive proceeds.
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
                    style={{ backgroundColor: '#1e3a8a', color: 'white' }}
                    className="hover:opacity-90 text-xs h-8 px-4 shrink-0 leading-none rounded-lg flex items-center justify-center transition-all font-medium shadow-sm"
                  >
                    Set Up Payouts
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add New Listing Button */}
        <Link
          href="/sell"
          className="w-full mb-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          style={{ 
            backgroundColor: '#191970', 
            color: 'white',
          }}
        >
          <Plus size={20} />
          Add New Listing
        </Link>

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
            <div className="text-2xl font-bold mb-1" style={{ color: "#191970" }}>{stats.totalSales}</div>
            <div className="text-[11px] font-medium text-gray-600">Sold Items</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold mb-1" style={{ color: "#EFBF05" }}>$0.00</div>
            <div className="text-[11px] font-medium text-gray-600">Total Earnings</div>
          </div>
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
                                        onClick={(e) => handleUpdateStatus(listing.id, 'active', e)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
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

