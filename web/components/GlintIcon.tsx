import React from "react";

interface GlintIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GlintIcon({
  size = 24,
  color = "#D4AF37",
  filled = true,
  className,
  style,
}: GlintIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{
        filter: "drop-shadow(0 0 2px rgba(212, 175, 55, 0.3))",
        ...style,
      }}
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={0.5}
      strokeLinejoin="miter"
    >
      <path d="M12 3L13.5 10.5L21 12L13.5 13.5L12 21L10.5 13.5L3 12L10.5 10.5L12 3Z" />
    </svg>
  );
}
