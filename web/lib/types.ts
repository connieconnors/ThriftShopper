// web/lib/types.ts
export type ListingStatus = 'active' | 'sold' | 'draft' | 'hidden';

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  original_image_url: string | null;
  clean_image_url: string | null;
  staged_image_url: string | null;
  photo_url: string | null;
  photo_url_2: string | null;
  condition: string | null;
  specifications: string | null;
  created_at: string;
  status: ListingStatus;
  intents: string[];  // e.g. ["gifting", "selfish"]
  styles: string[];   // e.g. ["mid-century", "whimsical"]
  moods: string[];    // e.g. ["cozy", "surprise"]
  // Denormalized seller data (set when listing is published)
  seller_stripe_account_id?: string | null;
  seller_name?: string | null;
  // Joined from profiles table (optional, for backward compatibility)
  profiles?: {
    display_name: string | null;
    location_city: string | null;
    avatar_url: string | null;
    ts_badge: string | boolean | null; // Can be "true"/"false" string or boolean
    rating: number | null;
    review_count: number | null;
    seller_story: string | null;
  } | null;
};

// Helper to get all available images for a listing
// Order: original_image_url (primary), clean_image_url (secondary), photo_url_2 (third)
export function getListingImages(listing: Listing): string[] {
  const images: string[] = [];
  
  // Primary: original_image_url
  if (listing.original_image_url) images.push(listing.original_image_url);
  
  // Secondary: clean_image_url
  if (listing.clean_image_url && !images.includes(listing.clean_image_url)) {
    images.push(listing.clean_image_url);
  }
  
  // Third: photo_url_2
  if (listing.photo_url_2 && !images.includes(listing.photo_url_2)) {
    images.push(listing.photo_url_2);
  }
  
  return images;
}

// Helper to get primary image for listing cards
export function getPrimaryImage(listing: Listing): string {
  return listing.original_image_url || 
         listing.clean_image_url || 
         listing.staged_image_url || 
         listing.photo_url || 
         "";
}

// Helper to format seller display name
// Prefers denormalized seller_name, falls back to profiles.display_name, then "Seller"
export function getSellerDisplayName(listing: Listing): string {
  if (listing.seller_name) {
    return listing.seller_name;
  }
  if (listing.profiles?.display_name) {
    return listing.profiles.display_name;
  }
  return "Seller";
}

// Helper to get seller location
export function getSellerLocation(listing: Listing): string | null {
  return listing.profiles?.location_city || null;
}

// Helper to get seller avatar
export function getSellerAvatar(listing: Listing): string | null {
  return listing.profiles?.avatar_url || null;
}

// Helper to check if seller has TS badge (ts_badge is text: "true" or "false")
export function hasSellerTSBadge(listing: Listing): boolean {
  return listing.profiles?.ts_badge === "true" || listing.profiles?.ts_badge === true;
}

// TS Badge image URL
export const TS_BADGE_URL = "https://zycsajsmdzmedzgmheix.supabase.co/storage/v1/object/public/avatars/Gold%20Monogram%20with%20Checkmark%20Emblem.png";

// Helper to get seller rating
export function getSellerRating(listing: Listing): number | null {
  return listing.profiles?.rating ?? null;
}

// Helper to get seller review count
export function getSellerReviewCount(listing: Listing): number {
  return listing.profiles?.review_count ?? 0;
}

// Helper to get seller story
export function getSellerStory(listing: Listing): string | null {
  return listing.profiles?.seller_story || null;
}
