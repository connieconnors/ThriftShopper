/** Public town line for seller trust UI — city + state only, never raw zip. */
export function formatSellerTown(
  city?: string | null,
  state?: string | null
): string | null {
  const c = city?.trim();
  const s = state?.trim();
  if (c && s) return `${c}, ${s}`;
  return c || s || null;
}

export function sellingSinceYear(createdAt?: string | null): number | null {
  if (!createdAt) return null;
  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? year : null;
}
