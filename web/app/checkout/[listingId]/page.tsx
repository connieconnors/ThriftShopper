import { supabase } from "../../../lib/supabaseClient";
import { Listing, getPrimaryImage, getSellerDisplayName } from "../../../lib/types";
import CheckoutClient from "./CheckoutClient";
import Link from "next/link";
import { resolveSellerActionType } from "../../../lib/sellerActionType";

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

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select(
      "shipping_info, seller_action_type, payment_mode, payment_pickup_label, stripe_account_id, stripe_onboarding_status"
    )
    .eq("user_id", listing.seller_id)
    .maybeSingle();

  const sellerActionType = resolveSellerActionType(
    sellerProfile,
    listing.seller_action_type
  );
  if (sellerActionType !== "stripe_checkout") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#ede9e1" }}>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4" style={{ color: "#16193a" }}>
            Pay with seller directly
          </h1>
          <p className="text-gray-600 mb-8">
            This item is not available for in-app checkout. Use Local Pickup, Store Pickup, or Contact Seller on the listing page.
          </p>
          <Link
            href={`/listing/${listingId}`}
            className="inline-block px-6 py-3 font-semibold rounded-full text-white"
            style={{ backgroundColor: "#16193a" }}
          >
            Back to listing
          </Link>
        </div>
      </main>
    );
  }

  const listingForCheckout = {
    ...(listing as Listing),
    profiles: {
      ...((listing as Listing).profiles ?? {}),
      shipping_info: sellerProfile?.shipping_info ?? null,
    },
  } as Listing;

  return <CheckoutClient listing={listingForCheckout} />;
}

