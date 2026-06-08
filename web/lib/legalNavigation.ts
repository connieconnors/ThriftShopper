export type LegalFrom =
  | "settings"
  | "help"
  | "signup"
  | "seller"
  | "onboarding"
  | "sell"
  | "browse";

const BACK_TARGETS: Record<
  LegalFrom,
  { href: string; label: string }
> = {
  settings: { href: "/settings", label: "Settings" },
  help: { href: "/help", label: "Help Center" },
  signup: { href: "/signup", label: "Sign up" },
  seller: { href: "/seller", label: "Seller dashboard" },
  onboarding: { href: "/seller/onboarding", label: "Set up your shop" },
  sell: { href: "/sell", label: "Create listing" },
  browse: { href: "/browse", label: "Browse" },
};

export function parseLegalFrom(value: string | null | undefined): LegalFrom {
  if (
    value === "settings" ||
    value === "help" ||
    value === "signup" ||
    value === "seller" ||
    value === "onboarding" ||
    value === "sell"
  ) {
    return value;
  }
  return "browse";
}

export function legalHref(path: string, from: LegalFrom): string {
  if (from === "browse") return path;
  return `${path}?from=${from}`;
}

export function resolveLegalBack(
  from: LegalFrom,
  documentPath?: string
): { href: string; label: string } {
  if (from === "help" && documentPath === "/returns") {
    return { href: "/help?section=shipping-returns", label: "Help Center" };
  }
  return BACK_TARGETS[from];
}

/** Shown in Settings → Legal (keep short — compliance docs linked from policies) */
export const SETTINGS_LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/returns", label: "Buyer Protection & Returns" },
  { href: "/seller-guidelines", label: "Seller Guidelines" },
  { href: "/prohibited-items", label: "Prohibited Items" },
] as const;

export const LEGAL_CANONICAL_URLS: Partial<Record<string, string>> = {
  "/terms": "https://thriftshopper.com/terms",
  "/privacy": "https://thriftshopper.com/privacy",
};
