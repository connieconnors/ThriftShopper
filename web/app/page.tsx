"use client";

import dynamic from "next/dynamic";

// Dynamically import SplashScreen with SSR disabled to prevent hydration errors
const SplashScreen = dynamic(() => import("./components/splash-screen"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
    </div>
  ),
});

export default function Home() {
  // Static splash screen - user swipes up to continue
  return <SplashScreen />;
}









