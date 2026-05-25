/**
 * Marketplace fee constants and helpers (TS 2.0 beta).
 * Seller-facing UI uses MARKETPLACE_FEE_PERCENT only — no Stripe processing fees.
 */

/** Standard beta marketplace fee (10%). */
export const MARKETPLACE_FEE_PERCENT = 0.10;

/** Human-readable label for seller copy. */
export const MARKETPLACE_FEE_LABEL = "10%";

/**
 * Effective fee rate for payment/order logic.
 * Uses profile snapshot when set (e.g. founding seller = 0); otherwise beta default.
 */
export function getEffectiveSellerFeeRate(
  profileSellerFeeRate: number | null | undefined
): number {
  if (
    profileSellerFeeRate != null &&
    !Number.isNaN(Number(profileSellerFeeRate))
  ) {
    return Number(profileSellerFeeRate);
  }
  return MARKETPLACE_FEE_PERCENT;
}

export function calculatePlatformFeeAmount(
  itemPriceDollars: number,
  feeRate: number = MARKETPLACE_FEE_PERCENT
): number {
  return Math.round(itemPriceDollars * feeRate * 100) / 100;
}

export function calculatePlatformFeeCents(
  amountInCents: number,
  feeRate: number
): number {
  return Math.round(amountInCents * feeRate);
}

/** Seller-facing earnings preview (item price only; no Stripe fees). */
export function calculateSellerEarningsPreview(itemPriceDollars: number): {
  price: number;
  marketplaceFee: number;
  sellerReceives: number;
} {
  const marketplaceFee = calculatePlatformFeeAmount(
    itemPriceDollars,
    MARKETPLACE_FEE_PERCENT
  );
  const sellerReceives =
    Math.round((itemPriceDollars - marketplaceFee) * 100) / 100;
  return {
    price: itemPriceDollars,
    marketplaceFee,
    sellerReceives,
  };
}

export function parseValidListingPrice(priceStr: string): number | null {
  const trimmed = priceStr.trim();
  if (!trimmed) return null;
  const value = parseFloat(trimmed);
  if (Number.isNaN(value) || value <= 0) return null;
  return value;
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
