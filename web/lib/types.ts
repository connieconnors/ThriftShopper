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
  created_at: string; // or Date later if you want
  status: ListingStatus;
  intents: string[];  // e.g. ["gifting", "selfish"]
  styles: string[];   // e.g. ["mid-century", "whimsical"]
  moods: string[];    // e.g. ["cozy", "surprise"]
};
