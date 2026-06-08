"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { applyLinenShell } from "@/hooks/useAppShell";

/** Reset to linen on every navigation — global shell never goes navy. */
export function AppShellBaseline() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    applyLinenShell();
  }, [pathname]);

  return null;
}
