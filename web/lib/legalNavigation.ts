export type LegalFrom =
  | "settings"
  | "help"
  | "signup"
  | "seller"
  | "browse";

const BACK_TARGETS: Record<
  LegalFrom,
  { href: string; label: string }
> = {
  settings: { href: "/settings", label: "Settings" },
  help: { href: "/help", label: "Help Center" },
  signup: { href: "/signup", label: "Sign up" },
  seller: { href: "/seller", label: "Seller dashboard" },
  browse: { href: "/browse", label: "Browse" },
};

export function parseLegalFrom(value: string | null | undefined): LegalFrom {
  if (
    value === "settings" ||
    value === "help" ||
    value === "signup" ||
    value === "seller"
  ) {
    return value;
  }
  return "browse";
}

export function legalHref(path: string, from: LegalFrom): string {
  if (from === "browse") return path;
  return `${path}?from=${from}`;
}

export function resolveLegalBack(from: LegalFrom): { href: string; label: string } {
  return BACK_TARGETS[from];
}

/** Shown in Settings → Legal (keep short — compliance docs linked from policies) */
export const SETTINGS_LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/returns", label: "Buyer Protection & Returns" },
  { href: "/seller-guidelines", label: "Selling on ThriftShopper" },
  { href: "/prohibited-items", label: "Prohibited Items" },
] as const;

export const LEGAL_CANONICAL_URLS: Partial<Record<string, string>> = {
  "/terms": "https://thriftshopper.com/terms",
  "/privacy": "https://thriftshopper.com/privacy",
};
