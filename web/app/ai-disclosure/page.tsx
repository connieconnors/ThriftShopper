import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { aiDisclosureDocument } from "@/lib/legal/documents/aiDisclosure";

export default function AiDisclosurePage() {
  return (
    <LegalDocumentPage document={aiDisclosureDocument} path="/ai-disclosure" />
  );
}
