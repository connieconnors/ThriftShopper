"use client";

import type { ReactNode } from "react";
import { SHELL_LINEN } from "@/hooks/useAppShell";

const INK = "#16193a";

/** Navy dashboard header — linen safe-area strip above, navy bar below. */
export function DashboardTopBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky top-0 z-40"
      style={{
        backgroundColor: SHELL_LINEN,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <header
        className="px-4 py-2 flex items-center justify-between gap-3 min-w-0 w-full overflow-hidden shadow-sm"
        style={{ backgroundColor: INK }}
      >
        {children}
      </header>
    </div>
  );
}

/** Navy dashboard footer — navy bar above, linen home-indicator strip below. */
export function DashboardBottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30"
      style={{
        backgroundColor: SHELL_LINEN,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <nav
        className="border-t border-gray-200 px-4 py-2.5"
        style={{ backgroundColor: INK }}
      >
        {children}
      </nav>
    </div>
  );
}
