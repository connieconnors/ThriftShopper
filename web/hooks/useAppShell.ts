"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/** Canonical TS 2.0 shell colors */
export const SHELL_INK = "#16193a";
export const SHELL_LINEN = "#ede9e1";

function setThemeColorMeta(color: string) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.content = color;
    });

  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }
}

/** Standard linen sync — html/body + theme-color. Safe to call on every route. */
export function applyLinenShell() {
  if (typeof document === "undefined") return;

  document.documentElement.style.backgroundColor = SHELL_LINEN;
  document.documentElement.style.colorScheme = "light only";
  document.body.style.backgroundColor = SHELL_LINEN;
  document.body.style.minHeight = "100dvh";
  setThemeColorMeta(SHELL_LINEN);
}

/** Re-assert linen on every route change. */
export function useAppShell() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    applyLinenShell();
  }, [pathname]);
}

/** When leaving ink dashboard routes, reset shell before browse paints. */
export function useDashboardRouteCleanup() {
  useLayoutEffect(() => {
    return () => {
      applyLinenShell();
    };
  }, []);
}
