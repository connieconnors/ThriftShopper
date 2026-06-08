"use client";

import { useLayoutEffect } from "react";

/** Canonical TS 2.0 shell colors */
export const SHELL_INK = "#16193a";
export const SHELL_LINEN = "#ede9e1";

function setThemeColorMeta(color: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

/** Global app shell — always linen (html/body + iOS theme-color safe-area chrome). */
export function applyLinenShell() {
  document.documentElement.style.backgroundColor = SHELL_LINEN;
  document.body.style.backgroundColor = SHELL_LINEN;
  document.body.style.minHeight = "100dvh";
  setThemeColorMeta(SHELL_LINEN);
}

/** Per-route hook: re-asserts linen shell on mount (buyer pages, auth, checkout). */
export function useAppShell() {
  useLayoutEffect(() => {
    applyLinenShell();
  }, []);
}
