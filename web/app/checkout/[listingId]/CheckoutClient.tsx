"use client";

import { useState, useEffect, useMemo, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "../../../lib/stripeClient";
import { Listing, getPrimaryImage, getSellerDisplayName } from "../../../lib/types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { resolveCheckoutShipping } from "../../../lib/shippingPreferences";
import { trackBuyerEvent } from "../../../lib/buyerEvents";
import { buildEventPayload } from "../../../lib/buyerEventContext";

interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface CheckoutClientProps {
  listing: Listing;
}

function CheckoutForm({ 
  listing, 
  shippingInfo,
  buyerTotal,
  onSuccess 
}: { 
  listing: Listing; 
  shippingInfo: ShippingInfo;
  buyerTotal: number;
  onSuccess: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidPaymentIntentId, setPaidPaymentIntentId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        setPaidPaymentIntentId(paymentIntent.id);

        // Create order in database
        // Note: buyer_id is now set server-side from authenticated user
        // Get auth token from Supabase session for Authorization header
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        const orderResponse = await fetch("/api/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: "include", // Ensure cookies are sent as fallback
          body: JSON.stringify({
            listingId: listing.id,
            paymentIntentId: paymentIntent.id,
            shippingInfo,
          }),
        });

        const orderData = await orderResponse.json();

        // Fix: Check for error first, then check for orderId
        // Only show "order creation failed" if there's an actual error
        if (orderData.error) {
          console.error("❌ Order creation error:", orderData.error, orderData.details);
          const ref = paymentIntent.id ? ` Reference: ${paymentIntent.id.slice(-12)}.` : "";
          setError(
            orderData.error === "Failed to create order"
              ? `Your payment went through, but we couldn't save the order.${ref} Email support@thriftshopper.com — we'll fix this.`
              : `Order creation failed: ${orderData.error}.${ref} Please contact support@thriftshopper.com.`
          );
        } else if (orderData.orderId) {
          // Success - redirect to confirmation
          console.log("✅ Order created successfully:", orderData.orderId);
          onSuccess(orderData.orderId);
        } else {
          // Unexpected: no error but no orderId either
          console.error("❌ Unexpected order response:", orderData);
          setError("Payment succeeded but order creation returned unexpected response. Please contact support.");
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="pb-36">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm leading-relaxed">{error}</p>
          {paidPaymentIntentId && (
            <p className="text-red-600/80 text-xs mt-2 font-mono">
              Payment ref: {paidPaymentIntentId}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Sticky pay bar — matches listing Buy Now pattern */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 px-4 py-3"
        style={{ backgroundColor: "rgba(237, 233, 225, 0.97)" }}
      >
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            {paidPaymentIntentId
              ? "Payment received — contact support if the order doesn't appear."
              : "When your payment details look right, tap below to complete your purchase."}
          </p>
          <button
            type="submit"
            disabled={!stripe || isProcessing || !!paidPaymentIntentId}
            className="w-full h-14 font-bold text-lg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            style={{
              backgroundColor: "#16193a",
              color: "#ffffff",
            }}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing…
              </>
            ) : paidPaymentIntentId ? (
              "Payment received"
            ) : (
              <>Complete Purchase · ${buyerTotal.toFixed(2)}</>
            )}
          </button>
          <p className="text-[10px] text-gray-500 text-center">
            Secure payment processed by Stripe
          </p>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutClient({ listing }: CheckoutClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const checkoutStartLogged = useRef(false);
  const checkoutShipping = useMemo(
    () =>
      resolveCheckoutShipping(
        listing.price,
        listing.custom_shipping_policy,
        listing.profiles?.shipping_info
      ),
    [listing]
  );
  const [checkoutTotals, setCheckoutTotals] = useState(checkoutShipping);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  useEffect(() => {
    setCheckoutTotals(checkoutShipping);
  }, [checkoutShipping]);

  useEffect(() => {
    if (!user || checkoutStartLogged.current) return;
    checkoutStartLogged.current = true;
    trackBuyerEvent('checkout_start', {
      listingId: listing.id,
      payload: buildEventPayload({
        surface: 'listing_detail',
        listing,
        extra: {
          item_price: listing.price,
          buyer_total: checkoutShipping.buyerTotal,
        },
      }),
    });
  }, [user, listing, checkoutShipping.buyerTotal]);

  // Redirect to login if not authenticated (only after auth has finished loading)
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    // Only redirect if we're certain user is not authenticated
    if (!user) {
      console.log('🔒 Checkout: User not authenticated, redirecting to login');
      router.push(`/login?redirect=/checkout/${listing.id}`);
    }
  }, [user, authLoading, router, listing.id]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </main>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const imageSrc = getPrimaryImage(listing);
  const sellerName = getSellerDisplayName(listing);

  const isShippingComplete = 
    shippingInfo.name.trim() !== "" &&
    shippingInfo.address.trim() !== "" &&
    shippingInfo.city.trim() !== "" &&
    shippingInfo.state.trim() !== "" &&
    shippingInfo.zip.trim() !== "";

  const handleShippingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isShippingComplete || checkoutShipping.isCheckoutBlocked) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          shippingInfo,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setClientSecret(data.clientSecret);
        setCheckoutTotals((prev) => ({
          ...prev,
          itemSubtotal: data.itemSubtotal ?? prev.itemSubtotal,
          shippingAmount: data.shippingAmount ?? prev.shippingAmount,
          buyerTotal: data.amount ?? prev.buyerTotal,
          shippingLineLabel: data.shippingLineLabel ?? prev.shippingLineLabel,
        }));
        setStep("payment");
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
      setError("Failed to initialize payment. Please try again.");
    }

    setIsLoading(false);
  };

  const handlePaymentSuccess = (orderId: string) => {
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  const stripePromise = getStripe();

  return (
    <main className="min-h-screen text-gray-900" style={{ backgroundColor: "#ede9e1" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-200/80" style={{ backgroundColor: "rgba(237, 233, 225, 0.95)" }}>
        <div className="px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
          <Link
            href={`/listing/${listing.id}`}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={`flex items-center gap-2 ${step === "shipping" ? "text-gray-900" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === "shipping" ? "bg-gray-900 text-white" : "bg-gray-300"
            }`}>
              {step === "payment" ? "✓" : "1"}
            </div>
            <span className="text-sm font-medium">Shipping</span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center gap-2 ${step === "payment" ? "text-gray-900" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === "payment" ? "bg-gray-900 text-white" : "bg-gray-300"
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex gap-4">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={listing.title}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📦</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 line-clamp-2 mb-1">{listing.title}</h2>
              <p className="text-sm text-gray-500 mb-2">Sold by {sellerName}</p>
              <p className="text-xl font-bold text-gray-900">${listing.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Item price</span>
              <span className="text-gray-900">${checkoutTotals.itemSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span
                className={
                  checkoutTotals.shippingLineLabel === "Free"
                    ? "text-emerald-600"
                    : "text-gray-900"
                }
              >
                {checkoutTotals.shippingLineLabel}
              </span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 text-gray-900">
              <span>Total</span>
              <span>${checkoutTotals.buyerTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {checkoutShipping.isCheckoutBlocked && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-900 text-sm">{checkoutShipping.checkoutBlockReason}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Shipping Form */}
        {step === "shipping" && (
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Street Address *</label>
              <input
                type="text"
                required
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                placeholder="123 Main Street, Apt 4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">State *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.state}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={shippingInfo.zip}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, zip: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isShippingComplete || isLoading || checkoutShipping.isCheckoutBlocked}
              className="w-full h-14 bg-gray-900 text-white font-bold text-lg rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                "Continue to Payment"
              )}
            </button>
          </form>
        )}

        {/* Payment Form */}
        {step === "payment" && clientSecret && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <button
                onClick={() => setStep("shipping")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Edit shipping
              </button>
            </div>

            {/* Shipping Summary */}
            <div className="p-3 bg-white rounded-xl border border-gray-200 text-sm">
              <p className="text-gray-600 mb-1">Shipping to:</p>
              <p className="text-gray-900">{shippingInfo.name}</p>
              <p className="text-gray-700">{shippingInfo.address}</p>
              <p className="text-gray-700">{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}</p>
            </div>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    colorPrimary: "#16193a",
                    colorBackground: "#ffffff",
                    colorText: "#16193a",
                    colorDanger: "#dc2626",
                    fontFamily: "var(--font-system)",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <CheckoutForm 
                listing={listing} 
                shippingInfo={shippingInfo}
                buyerTotal={checkoutTotals.buyerTotal}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        )}
      </div>

      {/* Bottom padding for sticky pay bar */}
      <div className="h-4" />
    </main>
  );
}

