export type ListingFrom = "browse" | "canvas" | "favorites" | "seller";

const BACK_TARGETS: Record<
  Exclude<ListingFrom, "browse">,
  { href: string; label: string }
> = {
  canvas: { href: "/canvas", label: "Your Canvas" },
  favorites: { href: "/favorites", label: "Favorites" },
  seller: { href: "/seller", label: "Seller dashboard" },
};

export function parseListingFrom(value: string | null | undefined): ListingFrom {
  if (value === "canvas" || value === "favorites" || value === "seller") {
    return value;
  }
  return "browse";
}

export function listingHref(listingId: string, from: ListingFrom): string {
  if (from === "browse") return `/listing/${listingId}`;
  return `/listing/${listingId}?from=${from}`;
}

export function resolveListingBack(from: ListingFrom): { href: string; label: string } {
  if (from === "browse") {
    return { href: "/browse", label: "Browse" };
  }
  return BACK_TARGETS[from];
}
