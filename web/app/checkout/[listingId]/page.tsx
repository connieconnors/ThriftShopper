import { supabase } from "../../../lib/supabaseClient";
import { Listing, getPrimaryImage, getSellerDisplayName } from "../../../lib/types";
import CheckoutClient from "./CheckoutClient";
import Link from "next/link";

interface CheckoutPageProps {
  params: Promise<{ listingId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { listingId } = await params;

  // Fetch the listing (no profile join needed - seller_name is denormalized on listing)
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("status", "active")
    .single();

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Item Not Available</h1>
          <p className="text-white/60 mb-8">
            This item is no longer available for purchase. It may have been sold or removed.
          </p>
          <Link
            href="/browse"
            className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return <CheckoutClient listing={listing as Listing} />;
}

