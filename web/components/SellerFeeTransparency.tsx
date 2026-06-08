"use client";

/** Short fee line for seller signup/onboarding — detail at first listing publish. */
export function SellerFeeTransparencyLine({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-sm leading-relaxed ${className}`}
      style={{ color: "#4b5563" }}
    >
      No listing fees.
    </p>
  );
}
