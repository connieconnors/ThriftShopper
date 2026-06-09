import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function createAuthenticatedSupabaseClient(
  request: NextRequest
): Promise<{ supabase: SupabaseClient; userId: string } | { error: string }> {
  const authHeader = request.headers.get("authorization");
  let authToken: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    authToken = authHeader.replace("Bearer ", "");
  } else {
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      if (!cookie.name.includes("supabase") && !cookie.name.includes("auth")) {
        continue;
      }
      try {
        const parsed = JSON.parse(cookie.value);
        if (parsed.access_token) {
          authToken = parsed.access_token;
          break;
        }
      } catch {
        if (cookie.value.startsWith("eyJ")) {
          authToken = cookie.value;
          break;
        }
      }
    }
  }

  if (!authToken) {
    return { error: "Unauthorized" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${authToken}` },
      },
      auth: { persistSession: false },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized" };
  }

  return { supabase, userId: user.id };
}
