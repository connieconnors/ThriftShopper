import { redirect } from "next/navigation";

/** Legacy URL — formerly "Marketplace Guidelines" */
export default function MarketplaceGuidelinesRedirectPage() {
  redirect("/seller-guidelines");
}
