import { supabase } from "../../lib/supabaseClient";
import type { Listing } from "../../lib/types";
import SwipeFeed from "./SwipeFeed";

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Browse() {
  // Join with profiles table for seller info
  // Using left join (default) so listings show even if profile is missing
  const { data, error } = await supabase
    .from("listings")
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
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);
  
  // Log for debugging
  if (data) {
    console.log(`[Browse] Loaded ${data.length} active listings`);
  }

  if (error) {
    console.error("Error loading listings for /browse:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
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

  const listings = (data ?? []) as Listing[];

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

  return <SwipeFeed initialListings={listings} />;
}
