"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/browse");
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "var(--ink-primary)" }}
    >
      <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
    </div>
  );
}
