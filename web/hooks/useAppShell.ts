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

  // Ensure at least one tag exists (some WebViews only read the first insert)
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }
}

/** Global app shell — always linen (html/body + iOS theme-color safe-area chrome). */
export function applyLinenShell() {
  if (typeof document === "undefined") return;

  document.documentElement.style.backgroundColor = SHELL_LINEN;
  document.body.style.backgroundColor = SHELL_LINEN;
  document.body.style.minHeight = "100dvh";
  setThemeColorMeta(SHELL_LINEN);
}

/** Re-assert linen on every route — canvas/seller chrome must not tint the OS shell. */
export function useAppShell() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    applyLinenShell();
    // Win races with late layout effects / bfcache restores on iOS Safari
    const raf = requestAnimationFrame(() => applyLinenShell());
    return () => cancelAnimationFrame(raf);
  }, [pathname]);
}
