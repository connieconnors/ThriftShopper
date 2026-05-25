"use client";

/** Short, elegant fee transparency line for seller signup/onboarding. */
export function SellerFeeTransparencyLine({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-sm leading-relaxed ${className}`}
      style={{ color: "#4b5563" }}
    >
      No listing fees. ThriftShopper takes a{" "}
      <span style={{ color: "#16193a" }}>10% marketplace fee</span> only when
      your item sells.
    </p>
  );
}
