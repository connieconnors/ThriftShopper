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
      // CRITICAL: Verify user and session exist before proceeding
      if (!user || !session) {
        console.log("🔵 Stream Chat: Skipping init - user or session missing", {
          hasUser: !!user,
          hasSession: !!session,
          userId: user?.id || 'none'
        });
        return;
      }
      
      // CRITICAL: Verify user.id exists before proceeding
      if (!user.id) {
        console.error("❌ Stream Chat: User object exists but user.id is missing", {
          user: user,
          userKeys: user ? Object.keys(user) : [],
          hasEmail: !!user?.email
        });
        if (isMounted) {
          setError("User ID not available - cannot connect to chat");
          setLoading(false);
        }
        return;
      }
      
      console.log("🔵 Stream Chat: Initializing connection", {
        userId: user.id,
        userEmail: user.email,
        hasSession: !!session,
        sessionToken: session?.access_token ? 'present' : 'missing'
      });
      
      // Only skip if client exists AND is properly connected
      if (client && client.userID && client.userID === user.id) {
        console.log("🔵 Stream Chat: Client already connected, skipping init", {
          userId: client.userID
        });
        return;
      }
      
      // If client exists but isn't connected to the current user, we need to reconnect
      if (client && (!client.userID || client.userID !== user.id)) {
        console.log("🔵 Stream Chat: Client exists but not connected to current user, reconnecting", {
          clientUserId: client.userID || 'none',
          currentUserId: user.id
        });
        try {
          await client.disconnectUser();
        } catch (e) {
          // Ignore disconnect errors
        }
        setClient(null); // Clear the client so we can create a new one
      }

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
            jsonError,
            userId: user?.id,
            hasSession: !!session
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
            fullResponse: data,
            userId: user?.id,
            userEmail: user?.email
          });
          if (isMounted) {
            // Show more helpful error message
            const errorMsg = data?.error || data?.details || "Chat unavailable";
            setError(errorMsg);
          }
          return;
        }

        // Verify the response contains required fields
        if (!data || !data.token) {
          console.error("❌ Stream token response missing token:", {
            hasData: !!data,
            hasToken: !!data?.token,
            hasUserId: !!data?.userId,
            hasApiKey: !!data?.apiKey,
            responseKeys: data ? Object.keys(data) : [],
            userId: user?.id
          });
          if (isMounted) {
            setError("Chat unavailable - invalid server response");
          }
          return;
        }

        // Use getInstance with the API key from the server
        // IMPORTANT: getInstance must be called with the API key BEFORE connectUser
        if (!data.apiKey) {
          throw new Error("API key not provided by server");
        }
        
        chat = StreamChat.getInstance(data.apiKey);
        
        // If there's already a connected user, disconnect first (important for switching users)
        if (chat.userID && chat.userID !== data.userId && chat.userID !== user?.id) {
          console.log("🔵 Stream Chat: Disconnecting previous user before connecting new one", {
            previousUserId: chat.userID,
            newUserId: data.userId || user?.id
          });
          try {
            await chat.disconnectUser();
            // Wait a moment for disconnect to complete
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (disconnectError) {
            console.warn("⚠️ Stream Chat: Error disconnecting previous user:", disconnectError);
            // Continue anyway - might already be disconnected
          }
        }
        
        console.log("🔵 Stream Chat: Connecting user with token...", {
          userId: data.userId,
          userIdFromAuth: user?.id,
          hasToken: !!data.token,
          apiKey: data.apiKey ? 'present' : 'missing',
          apiKeyLength: data.apiKey?.length || 0,
          currentClientUserId: chat.userID || 'none'
        });
        
        // Verify token exists
        if (!data.token) {
          throw new Error("Token not provided by server");
        }
        
        // Connect user and wait for it to complete
        // CRITICAL: Ensure we have a valid user ID before connecting
        // Prefer data.userId from API (most reliable), fallback to user.id from auth context
        const userIdToConnect = data.userId || user?.id;
        
        // Validate user ID exists and is not undefined/null/empty
        if (!userIdToConnect || userIdToConnect === 'undefined' || userIdToConnect === 'null') {
          console.error("❌ Stream Chat: Invalid user ID for connection", {
            dataUserId: data.userId,
            authUserId: user?.id,
            userIdToConnect: userIdToConnect,
            userObject: user,
            hasUser: !!user,
            hasSession: !!session
          });
          throw new Error("No valid user ID available for Stream Chat connection");
        }
        
        // Ensure user ID is a string (Stream Chat requirement)
        const userIdString = String(userIdToConnect).trim();
        
        // Final validation: ensure the string is not empty after trimming
        if (!userIdString || userIdString.length === 0) {
          console.error("❌ Stream Chat: User ID is empty after string conversion", {
            original: userIdToConnect,
            stringified: userIdString
          });
          throw new Error("User ID is empty - cannot connect to Stream Chat");
        }
        
        console.log("🔵 Stream Chat: Connecting with user ID:", userIdString, {
          fromApi: !!data.userId,
          fromAuth: !!user?.id,
          apiUserId: data.userId,
          authUserId: user?.id,
          match: data.userId === user?.id,
          userIdType: typeof userIdString,
          userIdLength: userIdString.length,
          tokenLength: data.token?.length || 0
        });
        
        try {
          // CRITICAL: Verify user ID is valid before calling connectUser
          if (!userIdString || userIdString === 'undefined' || userIdString === 'null') {
            throw new Error(`Invalid user ID: ${userIdString}`);
          }
          
          console.log("🔵 Stream Chat: Calling connectUser with:", {
            userId: userIdString,
            hasToken: !!data.token,
            tokenLength: data.token?.length || 0
          });
          
          await chat.connectUser({ id: userIdString }, data.token);
          console.log("🔵 Stream Chat: connectUser call completed for user:", userIdString);
          
          // Immediately verify the userID was set correctly
          console.log("🔵 Stream Chat: Verifying userID after connectUser:", {
            chatUserID: chat.userID,
            expectedUserID: userIdString,
            match: chat.userID === userIdString,
            hasTokenManager: !!chat.tokenManager,
            hasToken: !!chat.tokenManager?.token
          });
          
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
          
          console.log("🔵 Stream Chat: After connectUser, userID:", chat.userID, "retries:", userIDRetries, {
            expectedUserID: userIdString,
            actualUserID: chat.userID,
            match: chat.userID === userIdString,
            hasTokenManager: !!chat.tokenManager,
            hasToken: !!chat.tokenManager?.token
          });
          
          // CRITICAL: If userID is still not set after retries, log detailed error
          if (!chat.userID) {
            console.error("❌ Stream Chat: userID not set after connectUser and retries", {
              userIdAttempted: userIdString,
              userIdFromApi: data.userId,
              userIdFromAuth: user?.id,
              tokenProvided: !!data.token,
              tokenLength: data.token?.length || 0,
              apiKeyProvided: !!data.apiKey,
              chatUserID: chat.userID || 'none',
              hasTokenManager: !!chat.tokenManager,
              tokenManagerToken: !!chat.tokenManager?.token,
              wsHealthy: chat.wsConnection?.isHealthy
            });
          }
          
          // Wait for WebSocket connection to be established
          // Stream Chat needs both the user token AND the WS connection
          let retries = 0;
          while (retries < 20 && (!chat.wsConnection || !chat.wsConnection.isHealthy)) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
          
          // Verify connection was successful
          // Check token first (most reliable indicator), then userID, then WS health
          const hasToken = chat.tokenManager?.token;
          const hasUserID = !!chat.userID;
          const hasHealthyWS = chat.wsConnection?.isHealthy;
          
          // If user is not logged in, skip connection (expected behavior)
          if (!user || !session) {
            console.log("Stream Chat: Skipping connection - user not logged in");
            if (isMounted) {
              setLoading(false);
            }
            return;
          }
          
          // If we have a token, the connection is likely successful even if userID isn't set yet
          // Stream Chat sometimes sets userID asynchronously after the connection is established
          if (!hasToken) {
            // No token means connection definitely failed
            console.error("❌ Stream Chat: No token after connectUser - connection failed", {
              userIdAttempted: userIdString,
              userIdFromApi: data.userId,
              userIdFromAuth: user?.id,
              tokenProvided: !!data.token,
              tokenLength: data.token?.length || 0,
              apiKeyProvided: !!data.apiKey,
              chatUserID: chat.userID || 'none',
              hasTokenManager: !!chat.tokenManager,
              tokenManagerToken: !!chat.tokenManager?.token,
              wsHealthy: chat.wsConnection?.isHealthy
            });
            if (isMounted) {
              setError("Failed to connect to chat - please try again");
              setLoading(false);
            }
            return;
          }
          
          // If we have token but no userID, log a warning but continue (connection may still work)
          if (!hasUserID) {
            console.warn("⚠️ Stream Chat: Token set but userID not yet available (may be async)", {
              userIdAttempted: userIdString,
              hasToken: true,
              wsHealthy: hasHealthyWS
            });
            // Don't return - continue with connection as token is set
          } else if (chat.userID !== userIdString) {
            // UserID doesn't match what we expected
            console.warn("⚠️ Stream Chat: Connected userID doesn't match expected", {
              expected: userIdString,
              actual: chat.userID
            });
            // Don't return - connection might still work
          }
          
          if (!hasHealthyWS) {
            console.warn("⚠️ Stream Chat: WS connection not healthy yet, but continuing (may connect asynchronously)");
          }
          
          console.log("✅ Stream Chat connected successfully for user:", userIdString, {
            userID: chat.userID || 'pending',
            hasToken: !!hasToken,
            wsHealthy: hasHealthyWS || false
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


