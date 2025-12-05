"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "../../../lib/stripeClient";
import { Listing, getPrimaryImage, getSellerDisplayName } from "../../../lib/types";
import { useAuth } from "../../context/AuthContext";

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
  userId,
  onSuccess 
}: { 
  listing: Listing; 
  shippingInfo: ShippingInfo;
  userId: string;
  onSuccess: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Create order in database
        const orderResponse = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            paymentIntentId: paymentIntent.id,
            amount: listing.price,
            shippingInfo,
            userId,
          }),
        });

        const orderData = await orderResponse.json();

        if (orderData.orderId) {
          onSuccess(orderData.orderId);
        } else {
          setError("Payment succeeded but order creation failed. Please contact support.");
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-14 bg-white text-black font-bold text-lg rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          `Pay $${listing.price.toFixed(2)}`
        )}
      </button>

      <p className="text-center text-xs text-white/40">
        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe. Your payment info is encrypted.
      </p>
    </form>
  );
}

export default function CheckoutClient({ listing }: CheckoutClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/checkout/${listing.id}`);
    }
  }, [user, authLoading, router, listing.id]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen text-gray-900 flex items-center justify-center" style={{ backgroundColor: '#E5E3DE' }}>
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
    
    if (!isShippingComplete) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          shippingInfo,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setClientSecret(data.clientSecret);
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

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const stripePromise = getStripe();

  return (
    <main className="min-h-screen text-gray-900" style={{ backgroundColor: '#E5E3DE' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg border-b border-gray-200" style={{ backgroundColor: 'rgba(229, 227, 222, 0.9)' }}>
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
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${listing.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 text-gray-900">
              <span>Total</span>
              <span>${listing.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

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
              disabled={!isShippingComplete || isLoading}
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
                    colorPrimary: "#111827",
                    colorBackground: "#ffffff",
                    colorText: "#111827",
                    colorDanger: "#dc2626",
                    fontFamily: "system-ui, sans-serif",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <CheckoutForm 
                listing={listing} 
                shippingInfo={shippingInfo}
                userId={user!.id}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        )}
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </main>
  );
}

