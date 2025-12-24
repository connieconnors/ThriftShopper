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
  isConnected: boolean; // Add connection state
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

        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          console.error("Stream token request failed - invalid JSON response:", {
            status: res.status,
            statusText: res.statusText,
            jsonError
          });
          if (isMounted) {
            setError("Chat unavailable - server error");
          }
          return;
        }

        if (!res.ok) {
          console.error("❌ Stream token request failed:", {
            status: res.status,
            statusText: res.statusText,
            error: data?.error || "Unknown error",
            details: data?.details || "No details provided",
            fullResponse: data
          });
          if (isMounted) {
            // Show more helpful error message
            const errorMsg = data?.error || data?.details || "Chat unavailable";
            setError(errorMsg);
          }
          return;
        }

        // Use getInstance with the API key from the server
        // IMPORTANT: getInstance must be called with the API key BEFORE connectUser
        if (!data.apiKey) {
          throw new Error("API key not provided by server");
        }
        
        chat = StreamChat.getInstance(data.apiKey);
        
        console.log("🔵 Stream Chat: Connecting user with token...", {
          userId: data.userId,
          hasToken: !!data.token,
          apiKey: data.apiKey ? 'present' : 'missing',
          apiKeyLength: data.apiKey?.length || 0
        });
        
        // Verify token exists
        if (!data.token) {
          throw new Error("Token not provided by server");
        }
        
        // Connect user and wait for it to complete
        try {
          await chat.connectUser({ id: data.userId }, data.token);
          console.log("🔵 Stream Chat: connectUser call completed");
          
          // Immediately verify tokens are set
          if (!chat.tokenManager || !chat.tokenManager.token) {
            throw new Error("Tokens not set after connectUser - API key may be mismatched");
          }
          console.log("✅ Stream Chat: Tokens verified after connectUser");
          
          // Wait a bit for userID to be set (sometimes it's async)
          let userIDRetries = 0;
          while (userIDRetries < 20 && !chat.userID) {
            await new Promise(resolve => setTimeout(resolve, 50));
            userIDRetries++;
          }
          
          console.log("🔵 Stream Chat: After connectUser, userID:", chat.userID, "retries:", userIDRetries);
          
          // Verify connection was successful
          if (!chat.userID) {
            // Only log as warning if user is not logged in (expected behavior)
            if (!user || !session) {
              console.log("Stream Chat: Skipping connection - user not logged in");
              if (isMounted) {
                setLoading(false);
              }
              return;
            }
            // Only error if user IS logged in but connection failed
            console.warn("Stream Chat: userID not set after connectUser (user is logged in)");
            if (isMounted) {
              setError("Failed to connect to chat - please try again");
              setLoading(false);
            }
            return;
          }
          
          // Wait for WebSocket connection to be established
          // Stream Chat needs both the user token AND the WS connection
          let retries = 0;
          while (retries < 20 && (!chat.wsConnection || !chat.wsConnection.isHealthy)) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
          
          if (!chat.wsConnection || !chat.wsConnection.isHealthy) {
            console.warn("Stream Chat WS connection not healthy after connect, but continuing...");
          }
          
          console.log("Stream Chat connected successfully for user:", data.userId);
          console.log("Connection state:", {
            userID: chat.userID,
            wsHealthy: chat.wsConnection?.isHealthy,
          });
        } catch (connectError: any) {
          console.error("❌ Stream Chat connectUser error:", connectError);
          console.error("Error details:", {
            message: connectError?.message,
            name: connectError?.name,
            stack: connectError?.stack,
            userId: data?.userId,
            hasToken: !!data?.token,
            hasApiKey: !!data?.apiKey
          });
          if (isMounted) {
            setError(connectError?.message || "Failed to connect to chat");
            setLoading(false);
          }
          return;
        }

        if (!isMounted) {
          await chat.disconnectUser();
          return;
        }

        console.log("✅ Stream Chat: Setting client in state", {
          userID: chat.userID,
          wsHealthy: chat.wsConnection?.isHealthy
        });
        setClient(chat);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error("❌ StreamChat init error:", err);
        console.error("Error details:", {
          message: err instanceof Error ? err.message : String(err),
          name: err instanceof Error ? err.name : 'Unknown',
          stack: err instanceof Error ? err.stack : undefined
        });
        if (isMounted) {
          setError("Chat unavailable");
          setClient(null); // Ensure client is null on error
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
      isConnected: client ? !!client.userID : false, // Check if user is connected
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


