import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamChat } from "stream-chat";

// Stream Chat uses App ID (also called API Key) and Secret
// Prefer server-side only variables, fall back to NEXT_PUBLIC if needed
// IMPORTANT: STREAM_APP_ID and STREAM_API_KEY are the same thing - use whichever you have
const STREAM_API_KEY = process.env.STREAM_API_KEY 
  || process.env.STREAM_APP_ID 
  || process.env.NEXT_PUBLIC_STREAM_API_KEY 
  || process.env.NEXT_PUBLIC_STREAM_APP_ID;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET || process.env.STREAM_SECRET;

// Use a fresh Supabase client on the server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  console.log("🔵 Stream Chat token request received");
  
  try {
    // Check environment variables
    const hasApiKey = !!(STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_APP_ID);
    const hasSecret = !!(STREAM_API_SECRET || process.env.STREAM_SECRET);
    
    console.log("🔵 Env vars check:", {
      STREAM_API_KEY: !!process.env.STREAM_API_KEY,
      STREAM_APP_ID: !!process.env.STREAM_APP_ID,
      NEXT_PUBLIC_STREAM_API_KEY: !!process.env.NEXT_PUBLIC_STREAM_API_KEY,
      NEXT_PUBLIC_STREAM_APP_ID: !!process.env.NEXT_PUBLIC_STREAM_APP_ID,
      STREAM_API_SECRET: !!process.env.STREAM_API_SECRET,
      STREAM_SECRET: !!process.env.STREAM_SECRET,
      hasApiKey,
      hasSecret,
      resolvedApiKey: STREAM_API_KEY ? `${STREAM_API_KEY.substring(0, 8)}...` : 'missing',
      resolvedSecret: STREAM_API_SECRET ? 'present' : 'missing'
    });
    
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      console.error("❌ Stream Chat environment variables missing:");
      console.error("  STREAM_API_KEY or STREAM_APP_ID:", STREAM_API_KEY ? "✓" : "✗");
      console.error("  STREAM_API_SECRET or STREAM_SECRET:", STREAM_API_SECRET ? "✓" : "✗");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('STREAM')));
      return NextResponse.json(
        { 
          error: "Stream Chat is not configured on the server",
          details: "Missing STREAM_API_KEY/STREAM_APP_ID or STREAM_API_SECRET/STREAM_SECRET"
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    console.log("🔵 Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No authorization header");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabaseToken = authHeader.replace("Bearer ", "");
    console.log("🔵 Verifying Supabase session...");

    // Verify Supabase session and get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(supabaseToken);

    if (userError || !user) {
      console.error("❌ Supabase auth error:", userError);
      return NextResponse.json(
        { error: "Invalid or expired session", details: userError?.message },
        { status: 401 }
      );
    }
    
    console.log("✅ Supabase user verified:", user.id);

    console.log("🔵 Creating Stream Chat server client...");
    console.log("🔵 Using API Key (first 8 chars):", STREAM_API_KEY?.substring(0, 8) || 'missing');
    console.log("🔵 Using Secret (present?):", STREAM_API_SECRET ? 'yes' : 'no');
    
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      throw new Error("Stream Chat API key or secret is missing");
    }
    
    const serverClient = StreamChat.getInstance(
      STREAM_API_KEY,
      STREAM_API_SECRET
    );

    console.log("🔵 Upserting user to Stream Chat...");
    // Basic user upsert; you can enrich this later with profile data
    try {
      await serverClient.upsertUser({
        id: user.id,
        name: user.email || "ThriftShopper user",
      });
      console.log("✅ User upserted to Stream Chat");
    } catch (upsertError: any) {
      console.error("❌ Stream Chat upsertUser error:", upsertError);
      console.error("❌ Error details:", {
        code: upsertError?.code,
        message: upsertError?.message,
        status: upsertError?.status,
        apiKeyUsed: STREAM_API_KEY?.substring(0, 8) || 'missing'
      });
      throw upsertError;
    }

    console.log("🔵 Creating Stream Chat token...");
    const token = serverClient.createToken(user.id);
    console.log("✅ Stream Chat token created successfully", {
      userId: user.id,
      userEmail: user.email,
      tokenLength: token?.length || 0,
      hasToken: !!token
    });

    // Ensure all required fields are present
    if (!token) {
      console.error("❌ Stream Chat token creation returned null/undefined");
      return NextResponse.json(
        { 
          error: "Failed to generate Stream token",
          details: "Token creation returned null"
        },
        { status: 500 }
      );
    }

    const response = {
      token,
      userId: user.id,
      apiKey: STREAM_API_KEY,
    };

    console.log("🔵 Returning Stream Chat token response", {
      hasToken: !!response.token,
      hasUserId: !!response.userId,
      hasApiKey: !!response.apiKey,
      userId: response.userId
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ Stream token route error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : String(error),
      code: error?.code,
      status: error?.status,
      response: error?.response
    });
    
    // Return more detailed error information
    const errorMessage = error?.message || String(error);
    const errorDetails = error?.response?.error || errorMessage;
    
    return NextResponse.json(
      { 
        error: "Failed to generate Stream token",
        details: errorDetails,
        code: error?.code,
        status: error?.status
      },
      { status: 500 }
    );
  }
}


