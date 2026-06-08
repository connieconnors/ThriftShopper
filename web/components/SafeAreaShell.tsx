"use client";

import { SHELL_LINEN } from "@/hooks/useAppShell";

/** Always paint linen in iOS safe-area notches — above page chrome, non-interactive. */
export function SafeAreaShell() {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[9998] pointer-events-none"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          backgroundColor: SHELL_LINEN,
        }}
      />
      <div
        aria-hidden
        className="fixed inset-x-0 bottom-0 z-[9998] pointer-events-none"
        style={{
          height: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: SHELL_LINEN,
        }}
      />
    </>
  );
}
