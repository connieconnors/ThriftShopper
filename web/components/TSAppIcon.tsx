import React from "react";

interface TSAppIconProps {
  size?: number;
  className?: string;
}

/** Canonical app icon — use in modals, auth chrome, anywhere the real mark is needed. */
export function TSAppIcon({ size = 48, className = "" }: TSAppIconProps) {
  return (
    <img
      src="/icon-192.png"
      alt="ThriftShopper"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
