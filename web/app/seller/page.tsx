'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TSLogo } from '@/components/TSLogo';
import { Loader2, Plus, ArrowLeft, Settings, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import SellerMessages from './components/SellerMessages';
import Link from 'next/link';
import { StreamChatProvider } from './StreamChatProvider';

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
  const { user, isLoading: authLoading } = useAuth();
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
      // Check if seller profile is set up
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller, display_name, location_city')
        .eq('user_id', user.id) // Use 'user_id' - the actual column name
        .single();

      // If not a seller or missing key info, redirect to onboarding
      if (!profile?.is_seller || !profile?.display_name || !profile?.location_city) {
        router.push('/seller/onboarding');
        return;
      }

      // Profile is complete, fetch seller data
      fetchSellerData();
    } catch (err) {
      // No profile exists, redirect to onboarding
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <StreamChatProvider>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-gray-600" />
            <TSLogo size={28} primaryColor="#191970" accentColor="#cfb53b" />
          </Link>
          <span className="text-sm text-gray-600 font-medium">Seller Dashboard</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {/* TODO: Open messages */}}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors relative"
              title="Messages"
            >
              <MessageCircle size={20} className="text-gray-600" />
              {/* Notification dot - uncomment when messages exist */}
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
            </button>
            <Link
              href="/seller/settings"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
            <div className="text-sm text-gray-500">Listings</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.activeListings}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
            <div className="text-sm text-gray-500">Views</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSales}</div>
            <div className="text-sm text-gray-500">Sold</div>
          </div>
        </div>

        {/* Messages Section */}
        {user && (
          <div className="mb-6">
            <SellerMessages
              userId={user.id}
              expanded={messagesExpanded}
              onToggleExpand={() => setMessagesExpanded(!messagesExpanded)}
            />
          </div>
        )}

        {/* Add New Listing Button */}
        <Link
          href="/sell"
          className="w-full mb-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ 
            backgroundColor: '#191970', 
            color: 'white',
          }}
        >
          <Plus size={20} />
          Add New Listing
        </Link>

        {/* My Listings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">My Listings</h2>
          </div>
          
          {listings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No listings yet.</p>
              <p className="text-sm mt-1">Click "Add New Listing" to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {(listing.clean_image_url || listing.original_image_url) ? (
                      <img
                        src={listing.clean_image_url || listing.original_image_url || ''}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{listing.title}</h3>
                    <p className="text-sm text-gray-600">${listing.price?.toFixed(2) || '0.00'}</p>
                  </div>
                  
                  {/* Status */}
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${
                      listing.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : listing.status === 'sold'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {listing.status || 'draft'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
    </StreamChatProvider>
  );
}

