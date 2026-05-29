import { Suspense } from "react";
import LegalDocumentLayout from "@/components/LegalDocumentLayout";
import { LegalDocumentContent } from "@/components/legal/LegalDocumentContent";
import type { LegalDocumentMeta } from "@/lib/legal/types";

interface LegalDocumentPageProps {
  document: LegalDocumentMeta;
  path: string;
}

export function LegalDocumentPage({ document, path }: LegalDocumentPageProps) {
  return (
    <LegalDocumentLayout
      title={document.title}
      lastUpdated={document.lastUpdated}
      effectiveDate={document.effectiveDate}
      intro={document.intro}
      path={path}
    >
      <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded-lg" />}>
        <LegalDocumentContent blocks={document.blocks} />
      </Suspense>
    </LegalDocumentLayout>
  );
}
