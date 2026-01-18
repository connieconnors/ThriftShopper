"use client";

export function JustSoldBanner() {
  return (
    <div
      className="w-full py-2.5 px-6 rounded-full flex items-center justify-center shadow-lg"
      style={{
        background: "#E6C66D",
        opacity: 0.8,
      }}
    >
      <span className="text-[#1A1A1A] font-semibold tracking-[0.08em] uppercase text-sm">
        SOLD
      </span>
    </div>
  );
}
