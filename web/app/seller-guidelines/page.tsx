import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { sellerGuidelinesDocument } from "@/lib/legal/documents/sellerGuidelines";

export default function SellerGuidelinesPage() {
  return (
    <LegalDocumentPage
      document={sellerGuidelinesDocument}
      path="/seller-guidelines"
    />
  );
}
