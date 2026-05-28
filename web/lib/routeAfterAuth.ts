import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeRedirectPath } from "./authRedirect";

/** Route user after email confirmation or OAuth callback. */
export async function routeAfterAuth(
  router: AppRouterInstance,
  supabase: SupabaseClient,
  nextParam?: string | null
): Promise<void> {
  const next = sanitizeRedirectPath(nextParam);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push(next || "/browse");
    return;
  }

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_seller, display_name, location_city")
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code === "PGRST116") {
    const retry = await supabase
      .from("profiles")
      .select("is_seller, display_name, location_city")
      .eq("id", user.id)
      .single();
    profile = retry.data;
    profileError = retry.error;
  }

  if (profileError || !profile) {
    const displayName = user.email?.split("@")[0] || "User";
    await supabase.from("profiles").insert({
      user_id: user.id,
      email: user.email,
      display_name: displayName,
    });
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("is_seller, display_name, location_city")
      .eq("user_id", user.id)
      .single();
    profile = newProfile;
  }

  const isSeller = profile?.is_seller === true;
  const isIncomplete =
    !profile?.location_city || !profile?.display_name;

  if (isSeller) {
    if (isIncomplete) {
      router.push("/seller/onboarding");
      return;
    }
    if (next?.startsWith("/seller") || next?.startsWith("/sell")) {
      router.push(next);
      return;
    }
    router.push("/seller");
    return;
  }

  router.push(next || "/browse");
}
