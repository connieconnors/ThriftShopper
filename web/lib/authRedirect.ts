/**
 * Auth redirect URLs for Supabase email flows.
 *
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://beta.thriftshopper.com).
 * Supabase Dashboard → Authentication → URL Configuration:
 *   Site URL: https://beta.thriftshopper.com
 *   Redirect URLs: https://beta.thriftshopper.com/auth/callback
 *                    https://beta.thriftshopper.com/reset-password
 *                    http://localhost:3000/auth/callback (dev)
 *                    http://localhost:3000/reset-password (dev)
 */

const PRODUCTION_FALLBACK = "https://beta.thriftshopper.com";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** App origin for auth links — prefers NEXT_PUBLIC_APP_URL over window origin. */
export function getAppOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return PRODUCTION_FALLBACK;
}

/** Internal post-auth path only — blocks open redirects. */
export function sanitizeRedirectPath(
  path: string | null | undefined
): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

/** Email confirmation / magic-link callback URL. */
export function getAuthCallbackUrl(nextPath?: string): string {
  const base = `${getAppOrigin()}/auth/callback`;
  const safeNext = sanitizeRedirectPath(nextPath);
  if (!safeNext) return base;
  return `${base}?next=${encodeURIComponent(safeNext)}`;
}

/** Password reset email redirect target. */
export function getPasswordResetUrl(): string {
  return `${getAppOrigin()}/reset-password`;
}
