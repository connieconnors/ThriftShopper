"use client";

import dynamic from "next/dynamic";

const SplashScreen = dynamic(() => import("./components/SplashScreen"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--ink-primary)" }}
    >
      <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
    </div>
  ),
});

export default function Home() {
  return <SplashScreen autoNavigateDelay={4000} />;
}
