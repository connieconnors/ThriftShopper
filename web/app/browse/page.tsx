import { supabase } from "../../lib/supabaseClient";
import type { Listing } from "../../lib/types";
import SwipeFeed from "./SwipeFeed";

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ListingWithSoldAt = Listing & {
  sold_at?: string | null;
};

export default async function Browse() {
  // Fetch ALL listings (both active and sold) in a single query
  // This ensures we don't miss items due to timing issues
  const { data: allListings, error } = await supabase
    .from("discoverable_listings")
    .select(`
      *,
      profiles:seller_id (
        display_name,
        location_city,
        avatar_url,
        ts_badge,
        rating,
        review_count
      )
    `)
    ;
  
  const data = (allListings ?? []) as ListingWithSoldAt[];
  console.log(`[Browse] Query results: ${data.length} listings`);
  
  if (error) {
    console.error("[Browse] Error loading listings:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    // If we have an error and no data, show error page
    if (data.length === 0) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center text-white p-8">
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-white/60">Could not load listings. Please try again.</p>
            <p className="text-white/40 text-sm mt-2">Error: {error.message} (Code: {error.code})</p>
          </div>
        </div>
      );
    }
    // If we have some data despite error, continue (partial success)
  }

  const listings = (data ?? []) as ListingWithSoldAt[];

  if (listings.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">No items yet</h1>
          <p className="text-white/60">Check back soon for new finds.</p>
        </div>
      </div>
    );
  }

  const shuffleKey = Date.now();
  return <SwipeFeed key={listings.length} initialListings={listings} shuffleKey={shuffleKey} />;
}
