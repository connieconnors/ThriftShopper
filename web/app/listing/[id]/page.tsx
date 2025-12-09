import { supabase } from "../../../lib/supabaseClient";
import { Listing } from "../../../lib/types";
import ProductDetails from "./ProductDetails";

type ListingPageProps = {
  params: {
    id: string;
  };
};

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;

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
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error loading listing:", error);
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-xl font-semibold mb-2">Item not found</h1>
          <p className="text-white/60 mb-6">This listing may have been removed or sold.</p>
          <a
            href="/browse"
            className="inline-block px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Back to browsing
          </a>
        </div>
      </main>
    );
  }

  const raw = data as Listing;

  // Normalize array fields and clean JSON artifacts
  const normalize = (val: string[] | string | null): string[] => {
    let arr: string[] = [];
    if (Array.isArray(val)) {
      arr = val;
    } else if (typeof val === "string") {
      arr = val.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      return [];
    }
    
    // Clean brackets and quotes from each item
    return arr.map(item => {
      let cleaned = String(item).trim();
      // Remove leading/trailing quotes and brackets
      cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
      // Remove any remaining quotes or brackets
      cleaned = cleaned.replace(/["\[\]]/g, '');
      // Ensure space after commas within the text
      cleaned = cleaned.replace(/,([^\s])/g, ', $1');
      return cleaned;
    }).filter(s => s.length > 0);
  };

  const listing: Listing = {
    ...raw,
    styles: normalize(raw.styles as string[] | string | null),
    intents: normalize(raw.intents as string[] | string | null),
    moods: normalize(raw.moods as string[] | string | null),
  };

  return <ProductDetails listing={listing} />;
}
