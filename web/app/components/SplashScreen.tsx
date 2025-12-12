"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SplashScreenProps {
  autoNavigateDelay?: number; // ms before auto-navigation (default 3000)
}

export default function SplashScreen({ autoNavigateDelay = 3000 }: SplashScreenProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    
    // Wait for fade-out animation, then navigate to buyer discovery
    setTimeout(() => {
      router.push("/browse");
    }, 600);
  }, [isExiting, router]);

  // Auto-navigate after delay (only on client)
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setTimeout(() => {
      handleEnter();
    }, autoNavigateDelay);

    return () => clearTimeout(timer);
  }, [autoNavigateDelay, handleEnter, mounted]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      onClick={handleEnter}
      className={`
        fixed inset-0 z-50 cursor-pointer
        flex flex-col items-center justify-end
        transition-opacity duration-500 ease-out
        ${isExiting ? "opacity-0" : "opacity-100"}
      `}
      style={{
        backgroundImage: "url(/splash_screen.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark gradient overlay for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      {/* Content - positioned at ~64% down */}
      <div 
        className="absolute left-0 right-0 z-10 px-6"
        style={{ top: "58%" }}
      >
        {/* Branding block - left-aligned text in centered container */}
        <div className="max-w-fit mx-auto">
          {/* Logo / Brand - main branding moment - responsive sizing */}
          <h1 
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-wide text-white mb-2"
            style={{ 
              fontFamily: "var(--font-playfair), Georgia, serif",
              textShadow: "0 3px 25px rgba(0,0,0,0.6)",
            }}
          >
            ThriftShopper
          </h1>

          {/* Tagline - responsive sizing */}
          <p 
            className="text-lg sm:text-xl md:text-3xl lg:text-4xl italic"
            style={{ 
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "#cfb53b",
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
              paddingLeft: "8px",
              marginBottom: "40px",
            }}
          >
            the magic of discovery™
          </p>

          {/* Step inside CTA - responsive sizing */}
          <p 
            className="text-xl sm:text-2xl md:text-4xl lg:text-5xl tracking-widest text-center"
            style={{ 
              fontFamily: "var(--font-merriweather), Georgia, serif",
              color: "#ffffff",
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
              animation: "gentlePulse 2s ease-in-out infinite",
            }}
          >
            Step inside...
          </p>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style jsx>{`
        @keyframes gentlePulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}

