"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { applyLinenShell } from "@/hooks/useAppShell";

/**
 * Single client authority for document shell — mounted once in root layout.
 * Re-applies on navigation so no route can leave ink/navy on html/body/theme-color.
 */
export function AppShellBaseline() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    applyLinenShell();
  }, [pathname]);

  return null;
}
