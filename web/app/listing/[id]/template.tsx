"use client";

import { useLayoutEffect } from "react";
import { hardResetLinenShell, scheduleLinenShellSync } from "@/hooks/useAppShell";

/** Same hard reset on every listing entry — keeps browse return path consistent. */
export default function ListingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    hardResetLinenShell();
    scheduleLinenShellSync();
  }, []);

  return <>{children}</>;
}
