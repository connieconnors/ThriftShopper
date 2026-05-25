/**
 * Shipping preferences: radio (primary) + optional checkboxes + flat rate.
 * Stored as JSON in profiles.shipping_info and listings.custom_shipping_policy.
 */

export const SELLER_SHIPPING_AMOUNT_VALIDATION_MESSAGE =
  "Add a shipping amount, or choose free shipping/local pickup.";

export const BUYER_SHIPPING_UNAVAILABLE_MESSAGE =
  "Shipping needs to be updated for this item. Please message the seller or check back soon.";

export const SELLER_LISTING_NEEDS_SHIPPING_MESSAGE =
  "Add a shipping amount before publishing this listing.";

export type ShippingPrimary = "free" | "buyer_pays" | "local_only";

export interface ShippingPreferences {
  primary: ShippingPrimary;
  localPickupAvailable: boolean;
  shipsIn1To2Days: boolean;
  /** Flat USD shipping charge when primary is buyer_pays */
  flatRate?: number | null;
}

export const DEFAULT_SHIPPING_PREFERENCES: ShippingPreferences = {
  primary: "free",
  localPickupAvailable: false,
  shipsIn1To2Days: false,
  flatRate: null,
};

export interface ResolvedCheckoutShipping {
  preferences: ShippingPreferences;
  itemSubtotal: number;
  shippingAmount: number;
  buyerTotal: number;
  shippingLineLabel: string;
  isCheckoutBlocked: boolean;
  checkoutBlockReason?: string;
}

function normalizeFlatRate(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Generate banner text from preferences (one or two lines for product detail).
 */
export function generateShippingBannerText(prefs: ShippingPreferences): string {
  const { primary, localPickupAvailable, shipsIn1To2Days, flatRate } = prefs;

  if (primary === "local_only") {
    return "Local pickup only";
  }

  if (primary === "free") {
    let line1 = "Free shipping";
    if (shipsIn1To2Days) line1 += "; ships in 1-2 days";
    const line2 = localPickupAvailable ? "Local pickup available" : null;
    return line2 ? `${line1} / ${line2}` : line1;
  }

  // buyer_pays
  let line1 =
    flatRate != null && flatRate >= 0
      ? `$${flatRate.toFixed(2)} shipping`
      : "Shipping calculated at checkout";
  if (shipsIn1To2Days) line1 += "; ships in 1-2 days";
  const line2 = localPickupAvailable ? "Local pickup available" : null;
  return line2 ? `${line1} / ${line2}` : line1;
}

const SHIPPING_JSON_PREFIX = "{\"primary\":";

/**
 * Check if stored value is our JSON format (so we can parse and generate).
 */
export function isShippingJson(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const t = value.trim();
  return t.startsWith(SHIPPING_JSON_PREFIX) && t.includes("\"primary\"");
}

/**
 * Parse shipping_info or custom_shipping_policy. Returns null if plain text (legacy).
 */
export function parseShippingPreferences(
  value: string | null | undefined
): ShippingPreferences | null {
  if (!value || typeof value !== "string") return null;
  const t = value.trim();
  if (!isShippingJson(t)) return null;
  try {
    const parsed = JSON.parse(t) as Partial<ShippingPreferences>;
    if (
      parsed.primary === "local_only" ||
      parsed.primary === "free" ||
      parsed.primary === "buyer_pays"
    ) {
      return {
        primary: parsed.primary,
        localPickupAvailable: !!parsed.localPickupAvailable,
        shipsIn1To2Days: !!parsed.shipsIn1To2Days,
        flatRate: normalizeFlatRate(parsed.flatRate),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Serialize preferences for storage in shipping_info / custom_shipping_policy.
 */
export function serializeShippingPreferences(prefs: ShippingPreferences): string {
  const payload: ShippingPreferences = {
    primary: prefs.primary,
    localPickupAvailable: prefs.localPickupAvailable,
    shipsIn1To2Days: prefs.shipsIn1To2Days,
    flatRate:
      prefs.primary === "buyer_pays" ? normalizeFlatRate(prefs.flatRate) : null,
  };
  return JSON.stringify(payload);
}

/**
 * Resolve effective shipping policy: listing override → seller default → free.
 */
export function resolveShippingPreferences(
  listingCustomPolicy: string | null | undefined,
  sellerDefaultPolicy: string | null | undefined
): ShippingPreferences {
  const listingPrefs = parseShippingPreferences(listingCustomPolicy);
  if (listingPrefs) return listingPrefs;

  const sellerPrefs = parseShippingPreferences(sellerDefaultPolicy);
  if (sellerPrefs) return sellerPrefs;

  return { ...DEFAULT_SHIPPING_PREFERENCES };
}

export function isBuyerPaysMissingFlatRate(prefs: ShippingPreferences): boolean {
  return prefs.primary === "buyer_pays" && normalizeFlatRate(prefs.flatRate) == null;
}

/** True when checkout would block due to buyer_pays without a flat rate. */
export function listingNeedsShippingAmountFix(
  listingCustomPolicy: string | null | undefined,
  sellerDefaultPolicy: string | null | undefined
): boolean {
  const prefs = resolveShippingPreferences(
    listingCustomPolicy,
    sellerDefaultPolicy
  );
  return isBuyerPaysMissingFlatRate(prefs);
}

export function validateListingShippingPreferences(
  prefs: ShippingPreferences
): string | null {
  if (isBuyerPaysMissingFlatRate(prefs)) {
    return SELLER_SHIPPING_AMOUNT_VALIDATION_MESSAGE;
  }
  return null;
}

function formatShippingLineLabel(
  prefs: ShippingPreferences,
  shippingAmount: number
): string {
  if (prefs.primary === "local_only") return "Local pickup";
  if (prefs.primary === "free") return "Free";
  if (shippingAmount <= 0) return "Free";
  return `$${shippingAmount.toFixed(2)}`;
}

/**
 * Compute checkout shipping charge and labels from listing + seller defaults.
 */
export function resolveCheckoutShipping(
  itemPrice: number,
  listingCustomPolicy: string | null | undefined,
  sellerDefaultPolicy: string | null | undefined
): ResolvedCheckoutShipping {
  const itemSubtotal = Math.round(Number(itemPrice) * 100) / 100;
  const preferences = resolveShippingPreferences(
    listingCustomPolicy,
    sellerDefaultPolicy
  );

  if (preferences.primary === "buyer_pays") {
    const flatRate = normalizeFlatRate(preferences.flatRate);
    if (flatRate == null) {
      return {
        preferences,
        itemSubtotal,
        shippingAmount: 0,
        buyerTotal: itemSubtotal,
        shippingLineLabel: "—",
        isCheckoutBlocked: true,
        checkoutBlockReason: BUYER_SHIPPING_UNAVAILABLE_MESSAGE,
      };
    }
    const shippingAmount = flatRate;
    return {
      preferences,
      itemSubtotal,
      shippingAmount,
      buyerTotal: Math.round((itemSubtotal + shippingAmount) * 100) / 100,
      shippingLineLabel: formatShippingLineLabel(preferences, shippingAmount),
      isCheckoutBlocked: false,
    };
  }

  const shippingAmount = 0;
  return {
    preferences,
    itemSubtotal,
    shippingAmount,
    buyerTotal: itemSubtotal,
    shippingLineLabel: formatShippingLineLabel(preferences, shippingAmount),
    isCheckoutBlocked: false,
  };
}
