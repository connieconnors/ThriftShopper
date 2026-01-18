"use client";

import { Check } from "lucide-react";

export function FounderBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191970]/5 border border-[#191970]/10">
      <Check className="w-3.5 h-3.5 text-[#efbf04]" strokeWidth={1} />
      <span className="text-[10px] font-medium text-[#191970] tracking-[0.08em] uppercase">
        FOUNDING SELLER
      </span>
    </div>
  );
}
