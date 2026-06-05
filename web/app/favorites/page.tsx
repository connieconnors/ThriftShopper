"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

/** Legacy route — buyer hub lives on /canvas now. */
export default function FavoritesRedirectPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/canvas");
      return;
    }
    router.replace("/canvas");
  }, [user, authLoading, router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full"
        style={{ borderColor: "#16193a", borderTopColor: "transparent" }}
      />
    </main>
  );
}
