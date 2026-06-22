import type { Metadata } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://app.thriftshopper.com";

/** Splash hero — same photo as the in-app splash screen / App Store screenshot 1. */
export const SHARE_IMAGE = {
  url: "/thrift-shop-option-1.jpg",
  width: 1200,
  height: 630,
  alt: "ThriftShopper — the magic of discovery",
} as const;

export const siteMetadataBase = new URL(`${APP_URL}/`);

export const brandShareMetadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: "ThriftShopper — the magic of discovery™",
  description: "Discover unique vintage and thrift finds",
  openGraph: {
    type: "website",
    siteName: "ThriftShopper",
    title: "ThriftShopper",
    description: "The magic of discovery™",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "ThriftShopper",
    description: "The magic of discovery™",
    images: [SHARE_IMAGE.url],
  },
};
