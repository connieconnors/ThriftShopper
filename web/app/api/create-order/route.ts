import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { sendOrderConfirmationEmail } from "../../../lib/emails/sendEmail";
import { sendItemSoldEmail } from "../../../lib/emails/sendEmail";

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
    const buyerId = user.id;
    
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
      amount, 
      shippingInfo,
      // Explicitly ignore any buyer_id from client (security)
      buyer_id: _ignoredBuyerId, // If client sends this, we ignore it
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

    // Fetch the listing to get seller info
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, seller_id, price, status")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

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

    // Create order record
    const orderData = {
      buyer_id: buyerId, // Use authenticated user's ID from server
      seller_id: listing.seller_id,
      listing_id: listingId,
      amount: amount || listing.price,
      status: "paid",
      payment_intent_id: paymentIntentId,
      stripe_session_id: stripeSessionId || null, // Store if using Checkout Sessions
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

    const { data: order, error: orderError } = await supabase
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
        const { data: existing } = await supabase
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

    // Update listing status to sold
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);

    // Fetch buyer and seller profiles for emails
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", buyerId) // Use server-verified buyer ID
      .maybeSingle();

    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    // Send emails (don't block on errors - log and continue)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL || 'thriftshopper.com'}` 
      : 'http://localhost:3000';

    // Send order confirmation to buyer
    if (buyerProfile?.email) {
      sendOrderConfirmationEmail(buyerProfile.email, {
        buyerName: buyerProfile.display_name || 'there',
        orderId: order.id,
        itemName: listing.title,
        price: amount || listing.price,
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
    if (sellerProfile?.email) {
      sendItemSoldEmail(sellerProfile.email, {
        sellerName: sellerProfile.display_name || 'there',
        itemName: listing.title,
        price: amount || listing.price,
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

