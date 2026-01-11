import { supabase } from "../../lib/supabaseClient";
import type { Listing } from "../../lib/types";
import SwipeFeed from "./SwipeFeed";

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Browse() {
  // Calculate the date 7 days ago for "Just Sold" filter
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Fetch ALL listings (both active and sold) in a single query
  // This ensures we don't miss items due to timing issues
  const { data: allListings, error } = await supabase
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
    .in("status", ["active", "sold"])
    .limit(200); // Increased limit to ensure we get both active and sold items
  
  // Filter listings client-side
  const activeListings: any[] = [];
  const justSoldListings: any[] = [];
  
  // Debug: Log all unique statuses we're seeing
  const statusCounts: Record<string, number> = {};
  (allListings || []).forEach((listing: any) => {
    statusCounts[listing.status] = (statusCounts[listing.status] || 0) + 1;
  });
  console.log(`[Browse] Status breakdown:`, statusCounts);
  
  (allListings || []).forEach((listing: any) => {
    if (listing.status === "active") {
      activeListings.push(listing);
    } else if (listing.status === "sold") {
      // Include sold items if:
      // 1. They have no sold_at (might be newly sold, webhook hasn't set it yet)
      // 2. They were sold within the last 7 days
      if (!listing.sold_at) {
        // Include items without sold_at - they might be newly sold
        console.log(`[Browse] Including sold item without sold_at: ${listing.id} (${listing.title})`);
        justSoldListings.push(listing);
      } else {
        try {
          const soldDate = new Date(listing.sold_at);
          if (isNaN(soldDate.getTime())) {
            // Invalid date - include it anyway
            console.log(`[Browse] Including sold item with invalid sold_at: ${listing.id} (${listing.title})`);
            justSoldListings.push(listing);
          } else {
            const now = new Date();
            const daysSinceSold = (now.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceSold >= 0 && daysSinceSold < 7) {
              justSoldListings.push(listing);
            } else {
              console.log(`[Browse] Excluding sold item (too old): ${listing.id}, sold ${daysSinceSold.toFixed(1)} days ago`);
            }
          }
        } catch (error) {
          // Error parsing date - include it anyway
          console.log(`[Browse] Including sold item despite parse error: ${listing.id}`, error);
          justSoldListings.push(listing);
        }
      }
    }
  });

  // Combine both results
  const data = [...activeListings, ...justSoldListings];
  
  // Log for debugging
  console.log(`[Browse] Query results: ${allListings?.length || 0} total, ${activeListings.length} active, ${justSoldListings.length} just sold`);
  console.log(`[Browse] Final combined: ${data.length} listings`);
  
  // Debug: Log a few sample listing statuses to verify
  if (allListings && allListings.length > 0) {
    const sampleStatuses = allListings.slice(0, 5).map((l: any) => ({
      id: l.id,
      title: l.title?.substring(0, 30),
      status: l.status,
      sold_at: l.sold_at || 'null'
    }));
    console.log(`[Browse] Sample listing statuses:`, sampleStatuses);
  }
  
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

  // Shuffle listings randomly for variety on each page load
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const listings = shuffleArray((data ?? []) as Listing[]);

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
