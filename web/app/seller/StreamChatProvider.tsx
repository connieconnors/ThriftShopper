"use client";

import React, { ReactNode, useEffect, useState, useMemo, createContext, useContext } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";

import { useAuth } from "../context/AuthContext";

type StreamChatContextValue = {
  client: StreamChat | null;
  userId: string | null;
  loading: boolean;
  error: string | null;
};

const StreamChatContext = createContext<StreamChatContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export function StreamChatProvider({ children }: ProviderProps) {
  const { user, session } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let chat: StreamChat | null = null;
    let isMounted = true;

    async function init() {
      if (!user || !session) return;
      if (client) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/stream/token", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          // Silently fail for now; chat is optional
          console.warn("Stream token request failed:", data?.error || res.statusText);
          if (isMounted) {
            setError(data?.error || "Chat unavailable");
          }
          return;
        }

        chat = StreamChat.getInstance(data.apiKey);
        await chat.connectUser({ id: data.userId }, data.token);

        if (!isMounted) {
          await chat.disconnectUser();
          return;
        }

        setClient(chat);
      } catch (err) {
        console.error("StreamChat init error:", err);
        if (isMounted) {
          setError("Chat unavailable");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (chat) {
        chat.disconnectUser().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session]);

  const value = useMemo<StreamChatContextValue>(
    () => ({
      client,
      userId: user?.id ?? null,
      loading,
      error,
    }),
    [client, user?.id, loading, error]
  );

  if (!client) {
    // Provide context even while loading, so children can show loading states
    return (
      <StreamChatContext.Provider value={value}>
        {children}
      </StreamChatContext.Provider>
    );
  }

  return (
    <StreamChatContext.Provider value={value}>
      <Chat client={client} theme="str-chat__theme-light">
        {children}
      </Chat>
    </StreamChatContext.Provider>
  );
}

export function useStreamChat() {
  const ctx = useContext(StreamChatContext);
  if (!ctx) {
    throw new Error("useStreamChat must be used within a StreamChatProvider");
  }
  return ctx;
}


