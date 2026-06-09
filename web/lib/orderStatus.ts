/** Seller-facing open orders needing action */
export const OPEN_ORDER_STATUSES = ["paid", "shipped"] as const;

/** Closed / historical orders */
export const COMPLETED_ORDER_STATUSES = [
  "delivered",
  "completed",
  "cancelled",
] as const;

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export function isOpenSellerOrder(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase();
  return OPEN_ORDER_STATUSES.includes(s as (typeof OPEN_ORDER_STATUSES)[number]);
}

export function isCompletedSellerOrder(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase();
  return COMPLETED_ORDER_STATUSES.includes(
    s as (typeof COMPLETED_ORDER_STATUSES)[number]
  );
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Complete";
    case "cancelled":
      return "Voided";
    default:
      return status;
  }
}
