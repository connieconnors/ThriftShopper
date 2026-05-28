"use client";

import React from "react";
import { TSLogo } from "./TSLogo";

interface WelcomeBrandHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  titleSize?: "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function WelcomeBrandHeader({
  title,
  subtitle,
  titleSize = "lg",
  className = "",
  children,
}: WelcomeBrandHeaderProps) {
  const titleClass =
    titleSize === "lg"
      ? "text-2xl sm:text-3xl font-bold mb-2 font-editorial text-[var(--ink-primary)]"
      : "text-xl font-bold mb-2 font-editorial text-[var(--ink-primary)]";

  return (
    <div className={`text-center ${className}`}>
      <div
        className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: "var(--ink-primary)" }}
      >
        <TSLogo
          size={44}
          primaryColor="#ffffff"
          accentColor="var(--gold-accent)"
          showStar
        />
      </div>
      <h1 className={titleClass}>{title}</h1>
      {subtitle && (
        <div className="text-gray-600 font-system text-base max-w-md mx-auto">
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}

export const authPrimaryButtonClass =
  "w-full py-3.5 rounded-xl font-semibold font-system text-white bg-[var(--ink-primary)] shadow-md hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2";

export const authSecondaryButtonClass =
  "w-full py-3.5 rounded-xl font-semibold font-system border-2 border-[var(--ink-primary)] text-[var(--ink-primary)] bg-white hover:bg-gray-50";

export const authLinkClass =
  "text-sm font-system text-[var(--ink-primary)] hover:underline";
