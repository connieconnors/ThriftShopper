import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { prohibitedItemsDocument } from "@/lib/legal/documents/prohibitedItems";

export default function ProhibitedItemsPage() {
  return (
    <LegalDocumentPage
      document={prohibitedItemsDocument}
      path="/prohibited-items"
    />
  );
}
