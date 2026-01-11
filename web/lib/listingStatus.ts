import { Listing } from './types';

/**
 * Time window for considering a listing "just sold" (7 days in milliseconds)
 */
export const JUST_SOLD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Extended Listing type that may include sold_at timestamp
 */
type ListingWithSoldAt = Listing & {
  sold_at?: string | null;
};

/**
 * Checks if a listing was sold within the last 7 days.
 * 
 * Returns true only if:
 * - listing.status === 'sold'
 * - listing.sold_at exists and is a valid date
 * - Date.now() - sold_at < 7 days
 * 
 * @param listing - The listing to check
 * @returns true if the listing was just sold (within 7 days), false otherwise
 */
export function isJustSold(listing: ListingWithSoldAt): boolean {
  // Must be sold status
  if (listing.status !== 'sold') {
    return false;
  }

  // Must have sold_at timestamp
  if (!listing.sold_at) {
    return false;
  }

  try {
    // Parse the sold_at date (handles ISO strings, timestamps, etc.)
    const soldDate = new Date(listing.sold_at);
    
    // Check if date is valid
    if (isNaN(soldDate.getTime())) {
      return false;
    }

    // Check if sold within the last 7 days
    const now = Date.now();
    const soldTime = soldDate.getTime();
    const timeSinceSold = now - soldTime;

    // Must be positive (sold in the past) and within the window
    return timeSinceSold >= 0 && timeSinceSold < JUST_SOLD_WINDOW_MS;
  } catch (error) {
    // Gracefully handle any date parsing errors
    console.warn('Error parsing sold_at date:', listing.sold_at, error);
    return false;
  }
}

