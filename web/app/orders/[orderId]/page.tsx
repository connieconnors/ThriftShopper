"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";
import { ArrowLeft, Package, Truck, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getPrimaryImage } from "@/lib/types";

interface Order {
  id: string;
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

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/orders/" + params.orderId);
      return;
    }

    if (user && params.orderId) {
      fetchOrder();
    }
  }, [user, authLoading, params.orderId]);

  const fetchOrder = async () => {
    if (!user || !params.orderId) return;

    try {
      const { data, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          listings:listing_id (
            id,
            title,
            clean_image_url,
            original_image_url
          )
        `)
        .eq("id", params.orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        setError("Order not found");
        setLoading(false);
        return;
      }

      // Verify user has access (must be buyer or seller)
      if (data.buyer_id !== user.id && data.seller_id !== user.id) {
        setError("You don't have permission to view this order");
        setLoading(false);
        return;
      }

      setOrder(data as Order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    const status = order?.status || "paid";
    switch (status) {
      case "paid":
        return {
          label: "Paid - Awaiting Shipment",
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
          label: "Delivered",
          color: "#10b981",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "#ef4444",
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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2" style={{ color: "#191970" }}>
            {error || "Order not found"}
          </h1>
          <Link
            href="/canvas"
            className="text-sm text-[#191970] hover:underline"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#191970" }}
      >
        <Link href={isSeller ? "/seller" : "/canvas"} className="flex items-center gap-2">
          <ArrowLeft size={20} className="text-white" />
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <h1 className="text-white text-sm font-semibold">Order Details</h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${statusInfo.color}20` }}
            >
              <StatusIcon size={24} style={{ color: statusInfo.color }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "#191970" }}>
                {statusInfo.label}
              </h2>
              <p className="text-xs text-gray-500">
                Order #{order.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Item */}
        {listing && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#191970" }}>
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
                <p className="text-lg font-semibold" style={{ color: "#191970" }}>
                  ${order.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#191970" }}>
            Shipping Address
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

        {/* Tracking Information */}
        {order.tracking_number && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#191970" }}>
              Tracking Number
            </h3>
            <p className="text-sm font-mono text-gray-700">{order.tracking_number}</p>
          </div>
        )}

        {/* Order Dates */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#191970" }}>
            Order Information
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Date:</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {order.updated_at !== order.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span>{new Date(order.updated_at).toLocaleDateString()}</span>
              </div>
            )}
            {order.payment_intent_id && (
              <div className="flex justify-between">
                <span className="text-gray-500">Payment ID:</span>
                <span className="font-mono text-xs">{order.payment_intent_id.slice(0, 20)}...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

