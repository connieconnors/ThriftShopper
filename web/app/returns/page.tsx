import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { returnsDocument } from "@/lib/legal/documents/returns";

export default function ReturnsPage() {
  return <LegalDocumentPage document={returnsDocument} path="/returns" />;
}
