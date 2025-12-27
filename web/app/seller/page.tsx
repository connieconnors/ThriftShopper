import { Suspense } from "react";
import SellerPageClient from "./SellerPageClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <SellerPageClient />
    </Suspense>
  );
}
