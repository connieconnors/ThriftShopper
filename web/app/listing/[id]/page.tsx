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

  // Normalize array fields
  const normalize = (val: string[] | string | null): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  };

  const listing: Listing = {
    ...raw,
    styles: normalize(raw.styles as string[] | string | null),
    intents: normalize(raw.intents as string[] | string | null),
    moods: normalize(raw.moods as string[] | string | null),
  };

  return <ProductDetails listing={listing} />;
}
