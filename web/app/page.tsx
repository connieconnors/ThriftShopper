"use client";

import dynamic from "next/dynamic";

// Dynamically import SplashScreen with SSR disabled to prevent hydration errors
const SplashScreen = dynamic(() => import("./components/SplashScreen"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
    </div>
  ),
});

export default function Home() {
  // 4 seconds to appreciate the splash, then into discovery
  return <SplashScreen autoNavigateDelay={4000} />;
}









