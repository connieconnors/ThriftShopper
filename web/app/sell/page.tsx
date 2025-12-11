"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function SellPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to seller dashboard - upload should be part of dashboard
    if (!isLoading) {
      if (user) {
        router.push("/seller");
      } else {
        router.push("/login?redirect=/seller");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    );
  }

  return null;
}