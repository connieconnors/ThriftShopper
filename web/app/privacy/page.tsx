import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { privacyDocument } from "@/lib/legal/documents/privacy";

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} path="/privacy" />;
}
