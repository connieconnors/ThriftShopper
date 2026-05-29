import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { sendOrderConfirmationEmail } from "../../../lib/emails/sendEmail";
import { sendItemSoldEmail } from "../../../lib/emails/sendEmail";
import {
  calculatePlatformFeeAmount,
  getEffectiveSellerFeeRate,
} from "../../../lib/marketplaceFees";
import {
  resolveCheckoutShipping,
  serializeShippingPreferences,
  BUYER_SHIPPING_UNAVAILABLE_MESSAGE,
} from "../../../lib/shippingPreferences";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const dynamic = "force-dynamic"; // Ensure route is not statically optimized

export async function POST(request: NextRequest) {
  try {
    // Create Supabase SERVER client using cookies/headers
    // Priority: Authorization header > cookies
    const authHeader = request.headers.get("authorization");
    let authToken: string | null = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      authToken = authHeader.replace("Bearer ", "");
      console.log("🔑 Using auth token from Authorization header");
    } else {
      // Fallback: try to get from cookies
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      
      // Look for Supabase auth cookies (various formats)
      for (const cookie of allCookies) {
        if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
          try {
            const parsed = JSON.parse(cookie.value);
            if (parsed.access_token) {
              authToken = parsed.access_token;
              console.log("🔑 Using auth token from cookie:", cookie.name);
              break;
            }
          } catch {
            // Not JSON, might be the token directly
            if (cookie.value.startsWith('eyJ')) {
              authToken = cookie.value;
              console.log("🔑 Using auth token from cookie (raw):", cookie.name);
              break;
            }
          }
        }
      }
    }

    if (!authToken) {
      console.error("❌ No auth token found in headers or cookies");
      return NextResponse.json(
        { error: "Unauthorized - No authentication token found" },
        { status: 401 }
      );
    }

    // Create Supabase client with auth token (server-side with session)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
        auth: {
          persistSession: false, // Server-side, don't persist
          autoRefreshToken: false, // Server-side, don't auto-refresh
        },
      }
    );
    
    // Admin client (bypasses RLS) for privileged updates only
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get session first to ensure RLS context is properly set
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let user;
    if (session && session.user) {
      user = session.user;
      console.log("🔐 Session found, using user from session");
    } else {
      // Fallback to getUser if getSession doesn't return user
      console.log("⚠️ No session, trying getUser()");
      const { data: { user: userFromGetUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !userFromGetUser) {
        console.error("❌ Authentication error:", {
          sessionError: sessionError?.message,
          authError: authError?.message,
          code: authError?.status,
          hasSession: !!session,
          hasUser: !!userFromGetUser,
        });
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      user = userFromGetUser;
    }

    // CRITICAL: Use authenticated user's ID as buyer_id (do NOT accept from client)
    // NOTE: Supabase user.id is a UUID string; required for listings.buyer_id (uuid)
    const buyerId = user.id;
    // Schema cache refresh marker (no-op)
    
    // Log auth.uid() and buyer_id for debugging
    console.log("🔐 Authentication verified:", {
      auth_uid: user.id, // This is what auth.uid() will return in RLS
      buyer_id_to_insert: buyerId,
      user_email: user.email,
      has_session: !!session,
      session_expires_at: session?.expires_at,
    });

    const requestBody = await request.json();
    const { 
      listingId, 
      paymentIntentId,
      stripeSessionId, // Optional - for Checkout Sessions
      shippingInfo,
      // Explicitly ignore client amount / buyer_id (security)
      amount: _ignoredAmount,
      buyer_id: _ignoredBuyerId,
    } = requestBody;
    
    // Log if client tried to send buyer_id (security check)
    if (_ignoredBuyerId && _ignoredBuyerId !== buyerId) {
      console.warn("⚠️ SECURITY: Client attempted to send buyer_id, ignoring:", {
        client_buyer_id: _ignoredBuyerId,
        server_buyer_id: buyerId,
      });
    }

    if (!listingId || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing required fields: listingId and paymentIntentId are required" },
        { status: 400 }
      );
    }

    // Fetch the listing to get seller info and shipping policy
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, seller_id, price, status, custom_shipping_policy")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Fetch seller profile once: fee rate for order snapshot + email/display_name for notifications
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("seller_fee_rate, email, display_name, shipping_info")
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metadata = paymentIntent.metadata ?? {};

    let itemSubtotal = Number(metadata.item_subtotal);
    let shippingAmount = Number(metadata.shipping_amount);
    let buyerTotal = paymentIntent.amount / 100;
    let shippingPolicySnapshot = metadata.shipping_policy || null;

    if (Number.isNaN(itemSubtotal) || Number.isNaN(shippingAmount)) {
      const resolved = resolveCheckoutShipping(
        listing.price,
        listing.custom_shipping_policy,
        sellerProfile?.shipping_info
      );
      if (resolved.isCheckoutBlocked) {
        return NextResponse.json(
          {
            error: BUYER_SHIPPING_UNAVAILABLE_MESSAGE,
            code: "SHIPPING_NOT_CONFIGURED",
          },
          { status: 400 }
        );
      }
      itemSubtotal = resolved.itemSubtotal;
      shippingAmount = resolved.shippingAmount;
      buyerTotal = resolved.buyerTotal;
      shippingPolicySnapshot =
        shippingPolicySnapshot ||
        serializeShippingPreferences(resolved.preferences);
    }

    if (
      Math.round(buyerTotal * 100) !==
      Math.round((itemSubtotal + shippingAmount) * 100)
    ) {
      buyerTotal = Math.round((itemSubtotal + shippingAmount) * 100) / 100;
    }

    const sellerFeeRate = getEffectiveSellerFeeRate(
      sellerProfile?.seller_fee_rate
    );
    const platformFeeAmount = calculatePlatformFeeAmount(
      itemSubtotal,
      sellerFeeRate
    );
    // Internal estimate only — not shown to sellers in beta UI
    const stripeProcessingFee = buyerTotal * 0.029 + 0.3;
    const sellerPayoutAmount =
      Math.round(
        (buyerTotal - platformFeeAmount - stripeProcessingFee) * 100
      ) / 100;

    // Check if order already exists for this payment intent (prevent duplicates)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, status")
      .eq("payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (existingOrder) {
      console.log("Order already exists for this payment intent:", existingOrder.id);
      return NextResponse.json({
        orderId: existingOrder.id,
        success: true,
        message: "Order already exists",
      });
    }

    // Check if listing is already sold (prevent double-selling)
    if (listing.status === 'sold') {
      // Check if there's already a paid order for this listing
      const { data: existingListingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("listing_id", listingId)
        .in("status", ["paid", "shipped", "delivered"])
        .maybeSingle();

      if (existingListingOrder) {
        return NextResponse.json(
          { error: "This item has already been sold" },
          { status: 400 }
        );
      }
    }

    // Create order record (seller_fee_rate snapshot + computed fees)
    const orderData = {
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      listing_id: listingId,
      amount: buyerTotal,
      item_subtotal: itemSubtotal,
      shipping_amount: shippingAmount,
      shipping_policy: shippingPolicySnapshot,
      status: "paid",
      payment_intent_id: paymentIntentId,
      stripe_session_id: stripeSessionId || null,
      seller_fee_rate: sellerFeeRate,
      platform_fee_amount: platformFeeAmount,
      seller_payout_amount: sellerPayoutAmount,
      shipping_name: shippingInfo?.name || null,
      shipping_address: shippingInfo?.address || null,
      shipping_city: shippingInfo?.city || null,
      shipping_state: shippingInfo?.state || null,
      shipping_zip: shippingInfo?.zip || null,
      shipping_phone: shippingInfo?.phone || null,
      created_at: new Date().toISOString(),
    };

    console.log("📦 Creating order with data:", {
      listingId,
      paymentIntentId,
      stripeSessionId,
      amount: orderData.amount,
      buyer_id: buyerId, // Server-verified user ID
      seller_id: listing.seller_id,
    });

    // Log before insert for RLS debugging
    console.log("📦 Attempting order insert with:", {
      buyer_id: buyerId,
      auth_uid_should_match: user.id,
      seller_id: listing.seller_id,
      listing_id: listingId,
      payment_intent_id: paymentIntentId,
    });

    // Use service role for insert — buyer is already verified above; matches webhook path
    // and avoids RLS / JWT context issues on server-side inserts.
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    // Log full response for debugging (including RLS error details)
    console.log("📦 Order insert response:", {
      data: order ? { id: order.id, buyer_id: order.buyer_id } : null,
      error: orderError ? {
        message: orderError.message,
        code: orderError.code,
        details: orderError.details,
        hint: orderError.hint,
        // RLS-specific error info
        is_rls_error: orderError.message?.includes("row-level security") || 
                     orderError.message?.includes("RLS") ||
                     orderError.code === "42501",
      } : null,
      hasData: !!order,
      hasError: !!orderError,
      auth_uid: user.id, // What auth.uid() returned
      inserted_buyer_id: buyerId, // What we tried to insert
      match: user.id === buyerId, // Should always be true
    });

    // Success is based on: if (error) fail else success
    // Do NOT treat missing stripe_session_id as failure (it's nullable)
    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      
      // Check if it's a duplicate key error
      if (orderError.code === '23505' || orderError.message?.includes('duplicate')) {
        // Try to find the existing order
        const { data: existing } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("payment_intent_id", paymentIntentId)
          .maybeSingle();
        
        if (existing) {
          console.log("✅ Found existing order for payment intent:", existing.id);
          return NextResponse.json({
            orderId: existing.id,
            success: true,
            message: "Order already exists",
          });
        }
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create order",
          details: orderError.message,
        },
        { status: 500 }
      );
    }

    // Order was created successfully
    if (!order || !order.id) {
      console.error("❌ Order insert returned no data and no error - unexpected state");
      return NextResponse.json(
        { 
          error: "Order creation returned no data",
        },
        { status: 500 }
      );
    }

    console.log("✅ Order created successfully:", order.id);

    // Update listing status to sold and set sold_at timestamp
    console.log("Attempting DB update for:", listingId);
    const { error: updateError } = await supabaseAdmin
      .from("listings")
      .update({ 
        status: "sold",
        sold_at: new Date().toISOString(),
        buyer_id: buyerId,
      })
      .eq("id", listingId);
    console.log("Update result:", updateError);
    
    if (updateError) {
      console.error("❌ Error updating listing status to sold:", updateError);
      // Don't fail the order creation if status update fails, but log it
    } else {
      console.log("✅ Listing marked as sold:", listingId);
    }

    // Fetch buyer and seller profiles for emails
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", buyerId) // Use server-verified buyer ID
      .maybeSingle();

    // sellerProfile already fetched above (seller_fee_rate, email, display_name)

    const { data: sellerAuth } = await supabase.auth.admin.getUserById(
      listing.seller_id
    );

    // Send emails (don't block on errors - log and continue)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL || 'thriftshopper.com'}` 
      : 'http://localhost:3000';

    // Send order confirmation to buyer
    const buyerEmail = buyerProfile?.email || user.email;
    if (buyerEmail) {
      sendOrderConfirmationEmail(buyerEmail, {
        buyerName: buyerProfile?.display_name || user.user_metadata?.full_name || 'there',
        orderId: order.id,
        itemName: listing.title,
        price: buyerTotal,
        shippingAddress: {
          name: shippingInfo?.name || '',
          address: shippingInfo?.address || '',
          city: shippingInfo?.city || '',
          state: shippingInfo?.state || '',
          zip: shippingInfo?.zip || '',
        },
        sellerName: sellerProfile?.display_name || 'the seller',
        orderUrl: `${baseUrl}/orders/${order.id}`,
      }).catch((err) => {
        console.error('Error sending order confirmation email:', err);
      });
    }

    // Send item sold notification to seller
    const sellerEmail = sellerProfile?.email || sellerAuth?.user?.email;
    if (sellerEmail) {
      sendItemSoldEmail(sellerEmail, {
        sellerName: sellerProfile?.display_name || sellerAuth?.user?.user_metadata?.full_name || 'there',
        itemName: listing.title,
        price: buyerTotal,
        buyerName: buyerProfile?.display_name || 'a buyer',
        shippingAddress: {
          name: shippingInfo?.name || '',
          address: shippingInfo?.address || '',
          city: shippingInfo?.city || '',
          state: shippingInfo?.state || '',
          zip: shippingInfo?.zip || '',
        },
        orderId: order.id,
        sellerDashboardUrl: `${baseUrl}/seller`,
        shippingDays: 3, // Default to 3 days
      }).catch((err) => {
        console.error('Error sending item sold email:', err);
      });
    }

    return NextResponse.json({
      orderId: order.id,
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

