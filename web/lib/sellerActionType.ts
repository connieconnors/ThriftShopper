import type { Listing } from "./types";
import { getSellerDisplayName } from "./types";

export type SellerActionType =
  | "stripe_checkout"
  | "local_pickup"
  | "store_pickup"
  | "contact_seller";

export type SellerActionProfile = {
  seller_action_type?: string | null;
  /** @deprecated use seller_action_type */
  payment_mode?: string | null;
  payment_pickup_label?: string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_status?: string | null;
  display_name?: string | null;
  location_city?: string | null;
};

const VALID: SellerActionType[] = [
  "stripe_checkout",
  "local_pickup",
  "store_pickup",
  "contact_seller",
];

export function isPickupAction(action: SellerActionType): boolean {
  return action === "local_pickup" || action === "store_pickup";
}

/** Map legacy DB values to current action types. */
export function normalizeSellerActionType(
  raw: string | null | undefined
): SellerActionType | null {
  if (!raw) return null;
  if (raw === "reserve_in_store" || raw === "reserve_pickup") {
    return null;
  }
  if (VALID.includes(raw as SellerActionType)) {
    return raw as SellerActionType;
  }
  return null;
}

export function isStripeCheckoutReady(
  profile: SellerActionProfile | null | undefined
): boolean {
  if (!profile?.stripe_account_id) return false;
  const status = (profile.stripe_onboarding_status || "").toLowerCase();
  return status === "completed" || status === "complete";
}

/**
 * Resolve buyer action for a listing. Seller's explicit choice always wins —
 * no fallback to Contact Seller when Stripe is disconnected.
 */
export function resolveSellerActionType(
  profile: SellerActionProfile | null | undefined,
  listingOverride?: string | null
): SellerActionType {
  const explicit =
    normalizeSellerActionType(listingOverride) ??
    normalizeSellerActionType(profile?.seller_action_type) ??
    normalizeSellerActionType(profile?.payment_mode);

  if (explicit) {
    return explicit;
  }

  // Legacy profiles only — infer once, then seller should set explicitly in Settings
  const legacyPickup =
    profile?.payment_mode === "reserve_in_store" ||
    profile?.seller_action_type === "reserve_pickup";
  if (legacyPickup) {
    return profile?.payment_pickup_label?.trim() ? "store_pickup" : "local_pickup";
  }

  return "contact_seller";
}

export function primaryCtaLabel(action: SellerActionType): string {
  switch (action) {
    case "stripe_checkout":
      return "Buy Now";
    case "local_pickup":
      return "📍 Local Pickup";
    case "store_pickup":
      return "🏪 Store Pickup";
    case "contact_seller":
      return "Contact Seller";
  }
}

export type ListingActionContext = {
  headline: string | null;
  subline: string | null;
};

/** Context-specific copy above the CTA on listing detail. */
export function listingActionContext(
  action: SellerActionType,
  options: {
    storeName?: string | null;
    pickupLabel?: string | null;
    locationCity?: string | null;
  }
): ListingActionContext | null {
  const store =
    options.pickupLabel?.trim() ||
    options.storeName?.trim() ||
    null;
  const city = options.locationCity?.trim() || null;

  switch (action) {
    case "stripe_checkout":
      return null;
    case "local_pickup":
      return {
        headline: "📍 Local pickup available",
        subline: city
          ? `Coordinate pickup in ${city} — pay directly with the seller`
          : "Coordinate pickup with the seller — pay directly, no in-app checkout",
      };
    case "store_pickup":
      return {
        headline: store ? `🏪 Available at ${store}` : "🏪 In-store pickup available",
        subline: city
          ? `Visit the store in ${city} to purchase this item`
          : "Visit the store to purchase this item — pay in person",
      };
    case "contact_seller":
      return {
        headline: store
          ? `Available at ${store}`
          : "Local pickup and shipping available",
        subline: city
          ? `Local pickup in ${city}. Shipping may also be available — contact the seller to arrange. Pay in person or as agreed.`
          : "Local pickup available. Shipping may also be available — contact the seller to arrange. Pay in person or as agreed.",
      };
  }
}

export function inquiryModalIntro(
  action: SellerActionType,
  pickupLabel?: string | null
): string {
  switch (action) {
    case "store_pickup":
      return pickupLabel?.trim()
        ? `No payment in the app. Visit ${pickupLabel.trim()} when you're ready to buy.`
        : "No payment in the app. Visit the store when you're ready to buy.";
    case "local_pickup":
      return "No payment in the app. The seller will follow up to arrange pickup.";
    case "contact_seller":
      return "Ask about pickup, shipping, or this item. No payment in the app — the seller will follow up to arrange.";
    default:
      return "Send a message to the seller.";
  }
}

export function pickupConfirmationMessage(
  action: SellerActionType,
  sellerName: string
): string {
  if (action === "store_pickup") {
    return `Thanks!\n\nWe'll let ${sellerName} know you're interested.\n\nPlease visit the store when you're ready to purchase.`;
  }
  return `Thanks!\n\nWe'll let ${sellerName} know you're interested in local pickup.\n\nThey'll follow up to arrange a time and place.`;
}

/** @deprecated use pickupConfirmationMessage */
export function reserveConfirmationMessage(storeName: string): string {
  return pickupConfirmationMessage("store_pickup", storeName);
}

export function contactConfirmationMessage(sellerName?: string): string {
  const who = sellerName?.trim() || "The seller";
  return `Thanks!\n\n${who} will follow up about pickup, shipping, or your question.\n\nPay in person or as you arrange — no payment in the app.`;
}

export function sellFormPriceHelper(
  action: SellerActionType,
  pickupLabel?: string | null
): string {
  switch (action) {
    case "stripe_checkout":
      return "Buyers checkout with Stripe. Requires connected payouts.";
    case "local_pickup":
      return "Buyers request local pickup and pay you directly — great for home sellers.";
    case "store_pickup":
      return pickupLabel?.trim()
        ? `Buyers visit ${pickupLabel.trim()} to purchase in person. No shipping.`
        : "Buyers visit your store to purchase in person. No shipping.";
    case "contact_seller":
      return "Pickup and/or shipping — buyers message you to arrange. Pay in person or as agreed.";
  }
}

export function pickupModalTitle(action: SellerActionType): string {
  switch (action) {
    case "local_pickup":
      return "📍 Local Pickup";
    case "store_pickup":
      return "🏪 Store Pickup";
    case "contact_seller":
      return "Contact Seller";
    default:
      return "Contact Seller";
  }
}

export function pickupSubmitLabel(action: SellerActionType): string {
  switch (action) {
    case "local_pickup":
      return "Request local pickup";
    case "store_pickup":
      return "Request store pickup";
    case "contact_seller":
      return "Send message";
    default:
      return "Contact Seller";
  }
}

export function sellerSettingsActionLabel(action: SellerActionType): string {
  switch (action) {
    case "stripe_checkout":
      return "Buy Online (Stripe checkout)";
    case "local_pickup":
      return "📍 Local Pickup (home seller)";
    case "store_pickup":
      return "🏪 Store Pickup (visit store, pay in person)";
    case "contact_seller":
      return "Contact Seller (pickup and/or shipping)";
  }
}

/** Seller dashboard banner — shop default, not every listing. */
export function shopDefaultActionBannerCopy(
  action: SellerActionType,
  pickupLabel?: string | null
): { title: string; body: string } {
  const perItemNote =
    "Shop default for new listings. Override on each item when you list or edit.";

  switch (action) {
    case "store_pickup":
      return {
        title: "Shop default: 🏪 Store Pickup",
        body: pickupLabel?.trim()
          ? `${perItemNote} Buyers visit ${pickupLabel.trim()} in person.`
          : `${perItemNote} In-store pickup, pay in person.`,
      };
    case "local_pickup":
      return {
        title: "Shop default: 📍 Local Pickup",
        body: `${perItemNote} Buyers coordinate pickup with you directly.`,
      };
    case "contact_seller":
      return {
        title: "Shop default: Contact Seller",
        body: `${perItemNote} Pickup and/or shipping — buyers message you to arrange.`,
      };
    case "stripe_checkout":
      return {
        title: "Shop default: Buy Online",
        body: `${perItemNote} Stripe checkout for this shop.`,
      };
  }
}

/** Buyer-facing seller name — store pickup uses shop name, not login/email. */
export function resolvePublicSellerName(
  listing: Listing,
  actionType?: SellerActionType
): string {
  const resolved =
    actionType ?? resolveSellerActionType(listing.profiles ?? null);
  const storeLabel = listing.profiles?.payment_pickup_label?.trim();
  if (resolved === "store_pickup" && storeLabel) {
    return storeLabel;
  }
  return getSellerDisplayName(listing);
}
