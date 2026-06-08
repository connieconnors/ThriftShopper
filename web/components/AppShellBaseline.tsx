"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { applyLinenShell } from "@/hooks/useAppShell";

function syncLinenShell() {
  applyLinenShell();
  requestAnimationFrame(() => applyLinenShell());
}

/** Reset to linen on every navigation — global shell never goes navy. */
export function AppShellBaseline() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    syncLinenShell();
  }, [pathname]);

  useLayoutEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) syncLinenShell();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") syncLinenShell();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
