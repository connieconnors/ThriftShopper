import { Suspense } from "react";
import SellerDashboardClient from "./SellerDashboardClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <SellerDashboardClient />
    </Suspense>
  );
}

