/**
 * Shipping preferences: radio (primary) + optional checkboxes.
 * Used in onboarding, seller settings, and per-item override.
 * Stored as JSON in profiles.shipping_info and listings.custom_shipping_policy.
 */

export type ShippingPrimary = "free" | "local_only" | "buyer_pays";

export interface ShippingPreferences {
  primary: ShippingPrimary;
  localPickupAvailable: boolean;
  shipsIn1To2Days: boolean;
}

export const DEFAULT_SHIPPING_PREFERENCES: ShippingPreferences = {
  primary: "free",
  localPickupAvailable: false,
  shipsIn1To2Days: false,
};

/**
 * Generate banner text from preferences (one or two lines for product detail).
 */
export function generateShippingBannerText(prefs: ShippingPreferences): string {
  const { primary, localPickupAvailable, shipsIn1To2Days } = prefs;

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
  let line1 = "Shipping calculated at checkout";
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
export function parseShippingPreferences(value: string | null | undefined): ShippingPreferences | null {
  if (!value || typeof value !== "string") return null;
  const t = value.trim();
  if (!isShippingJson(t)) return null;
  try {
    const parsed = JSON.parse(t) as Partial<ShippingPreferences>;
    if (parsed.primary === "local_only" || parsed.primary === "free" || parsed.primary === "buyer_pays") {
      return {
        primary: parsed.primary,
        localPickupAvailable: !!parsed.localPickupAvailable,
        shipsIn1To2Days: !!parsed.shipsIn1To2Days,
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
  return JSON.stringify(prefs);
}
