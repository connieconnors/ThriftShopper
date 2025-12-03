"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TSLogo } from "@/components/TSLogo";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Header Branding */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <Link href="/browse" className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
          <TSLogo size={28} primaryColor="#ffffff" accentColor="#efbf04" />
        </Link>
      </div>

      {/* Animated Background */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ["#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#3B82F6"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="text-center max-w-md relative z-10">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8 animate-bounce-once">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-white/60 mb-4">
          Thank you for your purchase. Your order has been confirmed and the seller has been notified.
        </p>

        {orderId && (
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 mb-8">
            <p className="text-sm text-white/50 mb-1">Order ID</p>
            <p className="font-mono text-white text-sm break-all">{orderId}</p>
          </div>
        )}

        {/* What's Next */}
        <div className="text-left bg-slate-900/30 rounded-xl p-5 border border-white/10 mb-8">
          <h2 className="font-semibold mb-3">What happens next?</h2>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>The seller will prepare and ship your item within 1-3 business days</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>You'll receive tracking information via email once shipped</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>Once your item arrives, come back and shop for your next find</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/browse"
            className="block w-full py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/favorites"
            className="block w-full py-4 border-2 border-white/20 text-white font-semibold rounded-full hover:border-white/40 transition-colors"
          >
            View Favorites
          </Link>
        </div>
      </div>

      {/* Confetti Animation Styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}

