import { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

interface UserProfile {
  is_seller: boolean;
  last_mode?: "buyer" | "seller";
}

/**
 * Determines where to navigate when TS logo is clicked
 * 
 * - Not signed in → /login
 * - Buyer only → /favorites (Buyer Home)
 * - Seller only → /seller (Dashboard)
 * - Both → Last active mode
 */
export async function getTSLogoDestination(user: User | null): Promise<string> {
  // Not signed in → Login
  if (!user) {
    return "/login";
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_seller, last_mode")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return "/login";
    }

    // Seller only → Seller Dashboard
    if (profile.is_seller) {
      // If user has a last_mode preference and it's buyer, respect that
      if (profile.last_mode === "buyer") {
        return "/favorites"; // Buyer Home
      }
      return "/seller";
    }

    // Buyer only → Buyer Home (Favorites)
    return "/favorites";
  } catch (error) {
    console.error("Error getting profile:", error);
    return "/login";
  }
}

/**
 * Updates the user's last active mode
 */
export async function setLastMode(userId: string, mode: "buyer" | "seller"): Promise<void> {
  try {
    await supabase
      .from("profiles")
      .update({ last_mode: mode })
      .eq("user_id", userId);
  } catch (error) {
    console.error("Error updating last mode:", error);
  }
}

/**
 * Gets the opposite mode for switching
 */
export function getOppositeMode(currentMode: "buyer" | "seller"): "buyer" | "seller" {
  return currentMode === "buyer" ? "seller" : "buyer";
}

/**
 * Gets the destination for mode switching
 */
export function getModeDestination(mode: "buyer" | "seller"): string {
  return mode === "seller" ? "/seller" : "/favorites";
}

