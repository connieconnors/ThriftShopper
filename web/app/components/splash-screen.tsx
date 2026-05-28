"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SplashScreenProps {
  autoNavigateDelay?: number;
}

export default function SplashScreen({ autoNavigateDelay = 4000 }: SplashScreenProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);

    setTimeout(() => {
      router.push("/browse");
    }, 500);
  }, [isExiting, router]);

  useEffect(() => {
    if (!mounted || !autoNavigateDelay) return;

    const timer = setTimeout(() => {
      handleContinue();
    }, autoNavigateDelay);

    return () => clearTimeout(timer);
  }, [autoNavigateDelay, handleContinue, mounted]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;

    const distance = touchStartY.current - touchEndY.current;
    if (distance > minSwipeDistance) {
      handleContinue();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!mounted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="animate-spin h-8 w-8 border-2 border-[var(--ink-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleContinue}
      style={{ cursor: "pointer" }}
    >
      <div className="absolute inset-0 z-0">
        <img
          src="/thrift-shop-option-1.jpg"
          alt="Vintage thrift shop interior"
          className="w-full h-full object-cover object-center brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-2 text-center px-6"
        style={{ marginTop: "calc(15vh + 5pt)" }}
      >
        <h1
          className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium font-editorial"
          style={{
            textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          ThriftShopper
        </h1>

        <p
          className="italic text-xs sm:text-sm md:text-base font-normal font-editorial"
          style={{
            color: "rgba(196, 178, 128, 0.82)",
            letterSpacing: "0.06em",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          the magic of discovery
          <span style={{ fontSize: "0.75em", verticalAlign: "super" }}>™</span>
        </p>
      </div>
    </div>
  );
}
