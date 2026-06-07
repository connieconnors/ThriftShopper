"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft, Package, Truck, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string | number;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  payment_intent_id: string | null;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_phone: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  listings?: {
    id: string;
    title: string;
    clean_image_url: string | null;
    original_image_url: string | null;
  } | null;
}

const LIFECYCLE_STEPS = [
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

function formatOrderId(id: string | number): string {
  return String(id).slice(0, 8);
}

function formatPaymentRef(paymentIntentId: string | null): string | null {
  if (!paymentIntentId) return null;
  return String(paymentIntentId).slice(-16);
}

function lifecycleIndex(status: string): number {
  if (status === "delivered") return 2;
  if (status === "shipped") return 1;
  if (status === "paid" || status === "pending") return 0;
  return -1;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!user || !params.orderId) return;

    try {
      const orderId = String(params.orderId);

      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, listing_id, buyer_id, seller_id, amount, status, payment_intent_id, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone, created_at"
        )
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        setError("Order not found");
        return;
      }

      if (!orderRow) {
        setError(
          "Order not found — you may be signed in with a different account than the one used at checkout"
        );
        return;
      }

      if (orderRow.buyer_id !== user.id && orderRow.seller_id !== user.id) {
        setError("You don't have permission to view this order");
        return;
      }

      let listing: Order["listings"] = null;
      if (orderRow.listing_id) {
        const { data: listingRow, error: listingError } = await supabase
          .from("listings")
          .select("id, title, clean_image_url, original_image_url")
          .eq("id", orderRow.listing_id)
          .maybeSingle();
        if (listingError) {
          console.warn("Order detail: could not load listing:", listingError.message);
        } else if (listingRow) {
          listing = listingRow;
        }
      }

      setOrder({
        ...orderRow,
        tracking_number: null,
        updated_at: orderRow.created_at,
        listings: listing,
      } as Order);
      setError(null);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order");
    }
  }, [user, params.orderId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/orders/" + params.orderId);
      return;
    }

    if (user && params.orderId) {
      setLoading(true);
      fetchOrder().finally(() => setLoading(false));
    }
  }, [user, authLoading, params.orderId, router, fetchOrder]);

  const updateOrderStatus = async (newStatus: "shipped" | "delivered") => {
    if (!order) return;
    setStatusUpdating(true);
    setActionError(null);
    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
          trackingNumber:
            newStatus === "shipped" ? trackingInput.trim() || undefined : undefined,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setActionError(data.error);
      } else {
        setTrackingInput("");
        await fetchOrder();
      }
    } catch {
      setActionError("Failed to update order. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusInfo = () => {
    const status = order?.status || "paid";
    switch (status) {
      case "paid":
        return {
          label: "Paid — awaiting shipment",
          color: "#3b82f6",
          icon: Package,
        };
      case "shipped":
        return {
          label: "Shipped",
          color: "#9333ea",
          icon: Truck,
        };
      case "delivered":
        return {
          label: "Delivered — complete",
          color: "#10b981",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          label: "Voided — listing was relisted",
          color: "#d97706",
          icon: Package,
        };
      default:
        return {
          label: status,
          color: "#6b7280",
          icon: Package,
        };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#16193a" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2" style={{ color: "#16193a" }}>
            {error || "Order not found"}
          </h1>
          <Link
            href="/canvas"
            className="text-sm text-[#16193a] hover:underline"
          >
            Back to My Canvas
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const listing = order.listings;
  const imageUrl = listing
    ? listing.clean_image_url || listing.original_image_url
    : null;
  const isSeller = user?.id === order.seller_id;
  const activeStep = lifecycleIndex(order.status);
  const isVoided = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#16193a" }}
      >
        <Link href={isSeller ? "/seller" : "/canvas?section=purchases"} className="flex items-center gap-2">
          <ArrowLeft size={20} className="text-white" />
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <h1 className="text-white text-sm font-semibold">Order Details</h1>
        <div className="w-8" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${statusInfo.color}20` }}
            >
              <StatusIcon size={24} style={{ color: statusInfo.color }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "#16193a" }}>
                {statusInfo.label}
              </h2>
              <p className="text-xs text-gray-500">Order #{formatOrderId(order.id)}</p>
            </div>
          </div>

          {!isVoided && activeStep >= 0 && (
            <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
              {LIFECYCLE_STEPS.map((step, i) => {
                const done = i <= activeStep;
                const current = i === activeStep;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full h-1 rounded-full"
                      style={{
                        backgroundColor: done ? statusInfo.color : "#e5e7eb",
                        opacity: current ? 1 : done ? 0.7 : 1,
                      }}
                    />
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: done ? "#16193a" : "#9ca3af" }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {isVoided && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mt-2 border border-amber-100">
              This sale was voided when the seller relisted the item for testing. Your payment record is kept for history.
            </p>
          )}
        </div>

        {listing && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#16193a" }}>
              Item
            </h3>
            <div className="flex gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={listing.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="text-base font-medium mb-1">{listing.title}</h4>
                <p className="text-lg font-semibold" style={{ color: "#16193a" }}>
                  ${Number(order.amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isSeller && order.status === "paid" && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#16193a" }}>
              Seller actions
            </h3>
            <input
              type="text"
              placeholder="Tracking number (optional)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20"
            />
            <button
              type="button"
              onClick={() => updateOrderStatus("shipped")}
              disabled={statusUpdating}
              className="w-full py-3 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#16193a" }}
            >
              {statusUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Mark as shipped
            </button>
            {actionError && (
              <p className="text-sm text-red-600 mt-2">{actionError}</p>
            )}
          </div>
        )}

        {isSeller && order.status === "shipped" && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#16193a" }}>
              Seller actions
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Mark delivered once the buyer receives the item. This completes the order.
            </p>
            <button
              type="button"
              onClick={() => updateOrderStatus("delivered")}
              disabled={statusUpdating}
              className="w-full py-3 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#10b981" }}
            >
              {statusUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Mark as delivered
            </button>
            {actionError && (
              <p className="text-sm text-red-600 mt-2">{actionError}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#16193a" }}>
            {isSeller ? "Ship to" : "Shipping address"}
          </h3>
          <div className="text-sm text-gray-700 space-y-1">
            {order.shipping_name && <p className="font-medium">{order.shipping_name}</p>}
            {order.shipping_address && <p>{order.shipping_address}</p>}
            {(order.shipping_city || order.shipping_state || order.shipping_zip) && (
              <p>
                {[order.shipping_city, order.shipping_state, order.shipping_zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {order.shipping_phone && <p className="text-gray-500">{order.shipping_phone}</p>}
          </div>
        </div>

        {order.tracking_number && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#16193a" }}>
              Tracking number
            </h3>
            <p className="text-sm font-mono text-gray-700">{order.tracking_number}</p>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#16193a" }}>
            Order information
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Order date</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {order.payment_intent_id && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 flex-shrink-0">Payment ref</span>
                <span className="font-mono text-xs text-right break-all">
                  {formatPaymentRef(order.payment_intent_id)}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
