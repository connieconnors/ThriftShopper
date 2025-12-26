"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SplashScreen() {
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)

  // Minimum swipe distance (in pixels) to trigger navigation
  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return

    const distance = touchStartY.current - touchEndY.current

    // Swipe up detected (start Y > end Y, and distance is sufficient)
    if (distance > minSwipeDistance) {
      handleContinue()
    }

    // Reset touch positions
    touchStartY.current = null
    touchEndY.current = null
  }

  // Also allow click/tap as fallback
  const handleClick = () => {
    handleContinue()
  }

  const handleContinue = () => {
    if (isExiting) return
    setIsExiting(true)
    
    // Wait for fade-out animation, then navigate
    setTimeout(() => {
      router.push("/browse")
    }, 500)
  }

  return (
    <div
      className={`relative h-screen w-full flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      {/* Background Image - Option 1 (tighter crop, less glare) */}
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
          className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium"
          style={{
            fontFamily: "var(--font-playfair), Playfair Display, serif",
            textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          ThriftShopper
        </h1>

        <p
          className="italic text-white/90 text-sm sm:text-base md:text-lg tracking-wide font-normal"
          style={{
            fontFamily: "var(--font-playfair), Playfair Display, serif",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          the magic of discovery<span style={{ color: '#EFBF04', fontSize: '0.75em', verticalAlign: 'super' }}>™</span>
        </p>
      </div>
    </div>
  )
}
