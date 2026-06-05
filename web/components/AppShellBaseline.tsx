"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { SHELL_LINEN } from "@/hooks/useAppShell";

function applyLinenShell() {
  document.documentElement.style.backgroundColor = SHELL_LINEN;
  document.body.style.backgroundColor = SHELL_LINEN;
  document.body.style.minHeight = "100dvh";

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = SHELL_LINEN;
}

/** Reset to linen on every navigation so ink/black never bleeds into auth/checkout. */
export function AppShellBaseline() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    applyLinenShell();
  }, [pathname]);

  return null;
}
