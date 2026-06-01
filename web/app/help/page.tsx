"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TSLogo } from "@/components/TSLogo";
import { TSAppIcon } from "@/components/TSAppIcon";
import { SupportCenterContent } from "@/components/SupportCenterContent";

function HelpPageInner() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#16193a" }}>
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 z-10">
        <Link href="/browse" className="flex items-center gap-3" aria-label="Back to Browse">
          <ArrowLeft className="h-5 w-5" style={{ color: "#EFBF05" }} />
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <span className="text-sm font-medium">Help Center</span>
        <div className="w-10 shrink-0" />
      </header>
      <main className="px-4 py-4 max-w-lg mx-auto pb-8">
        <div className="flex items-center gap-2 mb-4">
          <TSAppIcon size={22} className="rounded-md" />
          <h1 className="text-[15px] font-semibold">Support</h1>
        </div>
        <SupportCenterContent initialExpandedTopic={section} />
      </main>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#16193a" }}>
          <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
        </div>
      }
    >
      <HelpPageInner />
    </Suspense>
  );
}
