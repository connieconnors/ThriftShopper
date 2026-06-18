"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  addBlockedUserToStorage,
  readBlockedUsersFromStorage,
  writeBlockedUsersToStorage,
} from "@/lib/moderation";

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBlockedUserIds([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("blocked_user_id")
        .eq("blocker_id", user.id);

      if (error) throw error;

      const ids = (data ?? []).map((row) => row.blocked_user_id as string);
      setBlockedUserIds(ids);
      writeBlockedUsersToStorage(ids);
    } catch {
      setBlockedUserIds(readBlockedUsersFromStorage());
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const blockUser = useCallback(
    async (blockedUserId: string, sourceListingId?: string) => {
      if (!user) throw new Error("Sign in to block users");

      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_user_id: blockedUserId,
        source_listing_id: sourceListingId ?? null,
      });

      if (error && error.code !== "23505") throw error;

      addBlockedUserToStorage(blockedUserId);
      setBlockedUserIds((prev) =>
        prev.includes(blockedUserId) ? prev : [...prev, blockedUserId]
      );
    },
    [user]
  );

  const isBlocked = useCallback(
    (userId: string | null | undefined) =>
      !!userId && blockedUserIds.includes(userId),
    [blockedUserIds]
  );

  return { blockedUserIds, isLoading, refresh, blockUser, isBlocked };
}
