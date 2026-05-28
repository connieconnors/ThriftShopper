"use client";

import { useEffect } from "react";

/** Canonical TS 2.0 shell colors */
export const SHELL_INK = "#16193a";
export const SHELL_LINEN = "#ede9e1";

export type AppShellVariant = "ink" | "linen";

const SHELL_COLORS: Record<AppShellVariant, string> = {
  ink: SHELL_INK,
  linen: SHELL_LINEN,
};

function setThemeColorMeta(color: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

/** Per-route shell: syncs html/body background + mobile theme-color (iOS safe-area chrome). */
export function useAppShell(variant: AppShellVariant) {
  useEffect(() => {
    const color = SHELL_COLORS[variant];
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    setThemeColorMeta(color);
  }, [variant]);
}
