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

/** Resolve buyer action for this listing (Apple-safe: no fake checkout). */
export function resolveSellerActionType(
  profile: SellerActionProfile | null | undefined,
  listingOverride?: string | null
): SellerActionType {
  let requested =
    normalizeSellerActionType(listingOverride) ??
    normalizeSellerActionType(profile?.seller_action_type) ??
    normalizeSellerActionType(profile?.payment_mode) ??
    null;

  if (!requested) {
    const legacyPickup =
      profile?.payment_mode === "reserve_in_store" ||
      profile?.seller_action_type === "reserve_pickup";
    if (legacyPickup) {
      requested = profile?.payment_pickup_label?.trim()
        ? "store_pickup"
        : "local_pickup";
    } else {
      requested = "stripe_checkout";
    }
  }

  if (requested === "stripe_checkout" && isStripeCheckoutReady(profile)) {
    return "stripe_checkout";
  }
  if (requested === "local_pickup" || requested === "store_pickup") {
    return requested;
  }
  if (requested === "contact_seller") {
    return "contact_seller";
  }
  if (profile?.payment_pickup_label?.trim()) {
    return "store_pickup";
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
          ? `Coordinate pickup in ${city} — no in-app payment`
          : "Coordinate pickup with the seller — no in-app payment",
      };
    case "store_pickup":
      return {
        headline: store ? `🏪 Available at ${store}` : "🏪 In-store pickup available",
        subline: city
          ? `Visit the store in ${city}`
          : "Pay when you pick up — no in-app checkout",
      };
    case "contact_seller":
      return {
        headline: "Questions about this item?",
        subline: "Message the seller — no payment in the app",
      };
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

export function contactConfirmationMessage(): string {
  return "Thanks! The seller will follow up with you soon.";
}

export function sellFormPriceHelper(
  action: SellerActionType,
  pickupLabel?: string | null
): string {
  switch (action) {
    case "stripe_checkout":
      return "";
    case "local_pickup":
      return "Buyers request local pickup and pay you directly — great for home sellers.";
    case "store_pickup":
      return pickupLabel?.trim()
        ? `Buyers visit ${pickupLabel.trim()} to purchase in person.`
        : "Buyers visit your store to purchase in person.";
    case "contact_seller":
      return "Buyers contact you about this item — you arrange payment directly.";
  }
}

export function pickupModalTitle(action: SellerActionType): string {
  switch (action) {
    case "local_pickup":
      return "📍 Local Pickup";
    case "store_pickup":
      return "🏪 Store Pickup";
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
    default:
      return "Contact Seller";
  }
}

export function sellerSettingsActionLabel(action: SellerActionType): string {
  switch (action) {
    case "stripe_checkout":
      return "Buy Online (Stripe checkout)";
    case "local_pickup":
      return "📍 Local Pickup";
    case "store_pickup":
      return "🏪 Store Pickup";
    case "contact_seller":
      return "Contact Seller";
  }
}

/** Seller dashboard banner — shop default, not every listing. */
export function shopDefaultActionBannerCopy(
  action: SellerActionType,
  pickupLabel?: string | null
): { title: string; body: string } {
  const perItemNote =
    "This is your shop default for new listings. Set how buyers get each item on the listing form.";

  switch (action) {
    case "store_pickup":
      return {
        title: "Shop default: 🏪 Store Pickup",
        body: pickupLabel?.trim()
          ? `${perItemNote} Default: buyers visit ${pickupLabel.trim()} in person.`
          : `${perItemNote} Default: in-store pickup, no in-app checkout.`,
      };
    case "local_pickup":
      return {
        title: "Shop default: 📍 Local Pickup",
        body: `${perItemNote} Default: buyers coordinate local pickup with you.`,
      };
    case "contact_seller":
      return {
        title: "Shop default: Contact Seller",
        body: `${perItemNote} Default: buyers message you first. Use Store or Local Pickup on individual items when that fits.`,
      };
    case "stripe_checkout":
      return {
        title: "Shop default: Buy Online",
        body: `${perItemNote} Default: Stripe checkout when connected.`,
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
