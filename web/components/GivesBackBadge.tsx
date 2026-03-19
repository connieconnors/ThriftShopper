"use client";

import { Heart } from "lucide-react";

export function GivesBackBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16193a]/5 border border-[#16193a]/10">
      <Heart
        className="w-3.5 h-3.5 text-[#D4AF37]"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
      />
      <span className="text-[10px] font-semibold text-[#16193a] tracking-[0.08em] uppercase">
        GIVES BACK
      </span>
    </div>
  );
}
