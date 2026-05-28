import React from "react";

interface TSLogoProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
  showStar?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function TSLogo({
  size = 24,
  primaryColor = "#16193a",
  accentColor = "var(--gold-accent)",
  showStar = false,
  className = "",
  style,
}: TSLogoProps) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`} aria-hidden>
      <span
        style={{
          fontFamily: 'var(--font-playfair), "Playfair Display", serif',
          fontSize: size,
          fontWeight: 500,
          fontStyle: "normal",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: primaryColor,
          ...style,
        }}
      >
        TS
      </span>
      {showStar && (
        <span
          style={{
            fontSize: Math.max(8, size * 0.2),
            color: accentColor,
            lineHeight: 1,
            marginTop: size * 0.06,
          }}
        >
          ✦
        </span>
      )}
    </span>
  );
}
