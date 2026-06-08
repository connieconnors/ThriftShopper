"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/** Canonical TS 2.0 shell colors */
export const SHELL_INK = "#16193a";
export const SHELL_LINEN = "#ede9e1";

function upsertMeta(name: string, content: string) {
  document.querySelectorAll<HTMLMetaElement>(`meta[name="${name}"]`).forEach((el) => el.remove());
  const meta = document.createElement("meta");
  meta.name = name;
  meta.content = content;
  document.head.prepend(meta);
}

function setThemeColorMeta(color: string) {
  upsertMeta("theme-color", color);
  upsertMeta("color-scheme", "light");
}

/** Standard linen sync — html/body + meta tags. */
export function applyLinenShell() {
  if (typeof document === "undefined") return;

  document.documentElement.style.backgroundColor = SHELL_LINEN;
  document.documentElement.style.colorScheme = "light only";
  document.body.style.backgroundColor = SHELL_LINEN;
  document.body.style.minHeight = "100dvh";
  setThemeColorMeta(SHELL_LINEN);
}

/**
 * Force browsers to drop ink-route chrome tint (Safari keeps stale theme-color
 * after dashboard nav unless meta tags are replaced, same as product detail entry).
 */
export function hardResetLinenShell() {
  if (typeof document === "undefined") return;

  document.documentElement.style.removeProperty("background-color");
  document.body.style.removeProperty("background-color");
  applyLinenShell();

  document.documentElement.style.setProperty("background-color", SHELL_LINEN, "important");
  document.body.style.setProperty("background-color", SHELL_LINEN, "important");
}

export function scheduleLinenShellSync() {
  hardResetLinenShell();
  requestAnimationFrame(() => hardResetLinenShell());
  window.setTimeout(() => hardResetLinenShell(), 50);
  window.setTimeout(() => hardResetLinenShell(), 200);
}

/** Call on dashboard routes when leaving — prevents ink shell bleeding into browse. */
export function useDashboardRouteCleanup() {
  useLayoutEffect(() => {
    return () => {
      scheduleLinenShellSync();
    };
  }, []);
}

/** Re-assert linen on every route. */
export function useAppShell() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    scheduleLinenShellSync();
  }, [pathname]);
}
