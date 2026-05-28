import React from "react";

interface TSLogoProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
  showStar?: boolean;
}

/**
 * Canonical TS wordmark — Merriweather TS with optional gold ✦
 * tucked between the letters at the baseline (matches app icon).
 */
export function TSLogo({
  size = 24,
  primaryColor = "#16193a",
  accentColor = "var(--gold-accent)",
  showStar = false,
}: TSLogoProps) {
  const letterSize = size * 0.65;
  const starSize = size * 0.45;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        lineHeight: 1,
      }}
      aria-hidden
    >
      <span
        style={{
          fontFamily: "var(--font-editorial)",
          fontSize: letterSize,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          color: primaryColor,
          textShadow: accentColor.startsWith("#")
            ? `0 0 8px ${accentColor}40`
            : "0 0 8px rgba(197, 160, 40, 0.25)",
        }}
      >
        TS
      </span>
      {showStar && (
        <span
          style={{
            position: "absolute",
            fontSize: starSize,
            lineHeight: 1,
            color: accentColor,
            left: "47%",
            bottom: "10%",
            transform: "translateX(-52%)",
            pointerEvents: "none",
          }}
        >
          ✦
        </span>
      )}
    </div>
  );
}
