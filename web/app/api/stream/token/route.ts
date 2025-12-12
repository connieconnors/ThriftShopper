import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamChat } from "stream-chat";

// Stream Chat uses App ID (also called API Key) and Secret
// Support multiple naming conventions (including NEXT_PUBLIC_ for client-side usage)
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
      STREAM_API_KEY: !!STREAM_API_KEY,
      STREAM_APP_ID: !!process.env.STREAM_APP_ID,
      NEXT_PUBLIC_STREAM_API_KEY: !!process.env.NEXT_PUBLIC_STREAM_API_KEY,
      NEXT_PUBLIC_STREAM_APP_ID: !!process.env.NEXT_PUBLIC_STREAM_APP_ID,
      STREAM_API_SECRET: !!STREAM_API_SECRET,
      STREAM_SECRET: !!process.env.STREAM_SECRET,
      hasApiKey,
      hasSecret
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
    } catch (upsertError) {
      console.error("❌ Stream Chat upsertUser error:", upsertError);
      throw upsertError;
    }

    console.log("🔵 Creating Stream Chat token...");
    const token = serverClient.createToken(user.id);
    console.log("✅ Stream Chat token created successfully");

    return NextResponse.json({
      token,
      userId: user.id,
      apiKey: STREAM_API_KEY,
    });
  } catch (error) {
    console.error("Stream token route error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: "Failed to generate Stream token",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


