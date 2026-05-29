import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { termsDocument } from "@/lib/legal/documents/terms";

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} path="/terms" />;
}
