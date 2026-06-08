"use client";

import { useLayoutEffect } from "react";
import { hardResetLinenShell, scheduleLinenShellSync, SHELL_LINEN } from "@/hooks/useAppShell";

/**
 * Remounts on every /browse entry (unlike layout.tsx). Matches product detail:
 * flow document root + hard theme-color reset so ink from canvas/seller cannot stick.
 */
export default function BrowseTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    hardResetLinenShell();
    scheduleLinenShellSync();
  }, []);

  return (
    <main
      className="min-h-[100dvh] w-full relative"
      style={{ backgroundColor: SHELL_LINEN }}
    >
      {children}
    </main>
  );
}
