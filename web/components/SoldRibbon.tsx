"use client";

interface SoldRibbonProps {
  variant?: "discovery" | "detail";
  className?: string;
}

export function SoldRibbon({ variant = "discovery", className }: SoldRibbonProps) {
  const sizeClass = variant === "detail" ? "w-12 h-12" : "w-14 h-14";
  const textClass = variant === "detail" ? "text-[10px]" : "text-xs";

  return (
    <div
      className={`rounded-full shadow-md flex items-center justify-center ${sizeClass} ${className || ""}`}
      style={{
        background: "#E6C66D",
        opacity: 0.8,
      }}
    >
      <span className={`text-[#1A1A1A] font-semibold uppercase tracking-[0.08em] ${textClass}`}>
        SOLD
      </span>
    </div>
  );
}
