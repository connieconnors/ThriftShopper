import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import type { Listing } from "../lib/types";

// Fallback demo listing in case Supabase fails
const demoListing: Listing = {
  id: "demo-1",
  seller_id: "sea_cliff_thrift",
  title: "Mid-Century Brass Candleholder",
  description:
    "Solid brass candleholder with a warm patina — perfect for a cozy tablescape.",
  price: 28,
  category: "decor",
  photo_url: "",
  photo_url_2: null,
  original_image_url: "",
  clean_image_url: "",
  staged_image_url: "",
  condition: null,
  specifications: null,
  created_at: new Date().toISOString(),
  status: "active",
  intents: ["gifting", "home"] as any,
  styles: ["mid-century", "vintage"] as any,
  moods: ["cozy", "magic", "surprise"] as any,
};

export default async function Home() {
  // Try to fetch 1 listing from Supabase
 // Try to fetch 1 listing from Supabase
const { data, error } = await supabase
  .from("listings")
  .select("*")
  .eq("status", "active")
  .order("created_at", { ascending: false })
  .limit(1);

  // Choose real listing if we have one, otherwise fall back to demo
  const rawListing: Listing = data?.[0] ?? demoListing;

  // Normalize styles / intents so joins never blow up
  const stylesArray = Array.isArray(rawListing.styles)
    ? rawListing.styles
    : rawListing.styles
    ? String(rawListing.styles)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const intentsArray = Array.isArray(rawListing.intents)
    ? rawListing.intents
    : rawListing.intents
    ? String(rawListing.intents)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const listing = {
    ...rawListing,
    styles: stylesArray,
    intents: intentsArray,
  };

  const productImageBackground = listing.staged_image_url
    ? `url(${listing.staged_image_url}) center/cover no-repeat`
    : listing.clean_image_url
    ? `url(${listing.clean_image_url}) center/cover no-repeat`
    : listing.original_image_url
    ? `url(${listing.original_image_url}) center/cover no-repeat`
    : "radial-gradient(circle at top, #1e293b 0%, #020617 65%)";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #020617 0%, #020617 35%, #000 100%)",
        color: "#ffffff",
        padding: "16px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            THRIFTSHOPPER
          </span>
          <span style={{ fontSize: "20px", fontWeight: 600 }}>
            Buyer Discovery
          </span>
        </div>

        <Link
          href="/favorites"
          style={{
            borderRadius: "999px",
            padding: "6px 10px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "12px",
            textDecoration: "none",
          }}
        >
          Favorites ♥
        </Link>
      </header>

      {/* Mood / wheel section placeholder */}
      <section
        style={{
          marginBottom: "24px",
          borderRadius: "18px",
          border: "1px dashed rgba(148,163,184,0.6)",
          padding: "16px",
          background: "rgba(15,23,42,0.9)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            opacity: 0.8,
            marginBottom: "12px",
          }}
        >
          What&apos;s your mood?
        </div>
        <div
          style={{
            borderRadius: "999px",
            border: "1px dashed rgba(148,163,184,0.6)",
            padding: "32px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            opacity: 0.8,
          }}
        >
          <span style={{ marginRight: "6px" }}>⊕</span> Mood wheel placeholder
        </div>
      </section>

        {/* Product card */}
      <section
        style={{
          borderRadius: "18px",
          overflow: "hidden",
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(148,163,184,0.4)",
          marginBottom: "16px",
        }}
      >
        {/* Image area */}
        <div
          style={{
            height: "260px",
            background: productImageBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!listing.staged_image_url &&
            !listing.clean_image_url &&
            !listing.original_image_url && (
              <div style={{ fontSize: "24px", opacity: 0.3 }}>
                🪔 Product image placeholder
              </div>
            )}
        </div>

        {/* Info section */}
        <div style={{ padding: "14px 16px" }}>
          <div
            style={{
              fontSize: "12px",
              opacity: 0.7,
              marginBottom: "4px",
              textTransform: "capitalize",
            }}
          >
            {listing.category}
            {stylesArray.length > 0 && ` • ${stylesArray.join(" • ")}`}
            {intentsArray.length > 0 && ` • ${intentsArray.join(" • ")}`}
          </div>

          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            {listing.title}
          </div>

          <div
            style={{
              fontSize: "14px",
              opacity: 0.85,
              marginBottom: "10px",
            }}
          >
            ${listing.price} • Seller: {listing.seller_id}
          </div>

          {listing.description && (
            <div
              style={{
                fontSize: "13px",
                opacity: 0.85,
              }}
            >
              {listing.description}
            </div>
          )}
        </div>
      </section>

      {/* Link to Browse */}
      <footer style={{ marginTop: "16px" }}>
        <Link
          href="/browse"
          style={{
            fontSize: "12px",
            textDecoration: "underline",
            color: "#ffffff",
            opacity: 0.9,
          }}
        >
          View all finds →
        </Link>
      </footer>

      {/* Bottom navigation bar */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          opacity: 0.8,
          marginTop: "8px",
        }}
      >
        <span>← Skip</span>
        <span>Discovery • Co-op • Magic</span>
        <span>Save ♥</span>
      </footer>
    </main>
  );
}
