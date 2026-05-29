"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { TSLogo } from "@/components/TSLogo";
import {
  LEGAL_CANONICAL_URLS,
  parseLegalFrom,
  resolveLegalBack,
} from "@/lib/legalNavigation";

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  effectiveDate?: string;
  intro?: string[];
  path: string;
  children: ReactNode;
}

function LegalDocumentLayoutInner({
  title,
  lastUpdated,
  effectiveDate,
  intro,
  path,
  children,
}: LegalDocumentLayoutProps) {
  const searchParams = useSearchParams();
  const from = parseLegalFrom(searchParams.get("from"));
  const back = resolveLegalBack(from);
  const canonicalUrl = LEGAL_CANONICAL_URLS[path];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-[#16193a] px-4 py-2 flex items-center justify-between sticky top-0 z-10">
        <Link
          href={back.href}
          className="flex items-center gap-3 min-w-0"
          aria-label={`Back to ${back.label}`}
        >
          <span className="text-white/80 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="h-5 w-5" style={{ color: "#EFBF05" }} />
          </span>
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <span className="text-xs text-white/70 truncate px-2">Legal</span>
        <div className="w-10 shrink-0" />
      </header>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "#16193a" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {back.label}
        </Link>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h1
            className="text-xl font-semibold mb-2 font-ui-heading"
            style={{ color: "#16193a" }}
          >
            {title}
          </h1>
          <div className="text-xs text-gray-500 space-y-0.5 mb-5">
            {effectiveDate && <p>Effective: {effectiveDate}</p>}
            <p>Last updated: {lastUpdated}</p>
          </div>

          {intro?.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="text-sm text-gray-700 leading-relaxed mb-4 font-system"
            >
              {paragraph}
            </p>
          ))}

          {children}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
          <Link
            href="/settings"
            className="flex items-center justify-between w-full py-2.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors px-3 text-gray-700 font-medium"
          >
            <span>Account settings & legal index</span>
            <ArrowLeft className="h-3 w-3 rotate-180 text-gray-400" />
          </Link>
          {from !== "settings" && (
            <Link
              href={`${path}?from=settings`}
              className="block text-xs text-gray-500 hover:text-gray-700 transition-colors px-1"
            >
              Opened from elsewhere? Return via Settings legal section.
            </Link>
          )}
          {canonicalUrl && (
            <p className="text-[10px] text-gray-500 leading-relaxed px-1">
              Also published at{" "}
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700"
              >
                {canonicalUrl.replace("https://", "")}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegalDocumentLayout(props: LegalDocumentLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
        </div>
      }
    >
      <LegalDocumentLayoutInner {...props} />
    </Suspense>
  );
}
