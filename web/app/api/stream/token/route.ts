import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamChat } from "stream-chat";

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

// Use a fresh Supabase client on the server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      console.error("STREAM_API_KEY or STREAM_API_SECRET not configured");
      return NextResponse.json(
        { error: "Stream Chat is not configured on the server" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabaseToken = authHeader.replace("Bearer ", "");

    // Verify Supabase session and get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(supabaseToken);

    if (userError || !user) {
      console.error("Supabase auth error:", userError);
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const serverClient = StreamChat.getInstance(
      STREAM_API_KEY,
      STREAM_API_SECRET
    );

    // Basic user upsert; you can enrich this later with profile data
    await serverClient.upsertUser({
      id: user.id,
      name: user.email || "ThriftShopper user",
    });

    const token = serverClient.createToken(user.id);

    return NextResponse.json({
      token,
      userId: user.id,
      apiKey: STREAM_API_KEY,
    });
  } catch (error) {
    console.error("Stream token route error:", error);
    return NextResponse.json(
      { error: "Failed to generate Stream token" },
      { status: 500 }
    );
  }
}


