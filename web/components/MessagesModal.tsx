"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../app/context/AuthContext";
import { useStreamChat } from "../app/seller/StreamChatProvider";
import TSModal from "./TSModal";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  listing_title?: string;
}

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: Pre-select a seller to start a conversation */
  initialSellerId?: string;
  /** Optional: Pre-select a listing for context */
  initialListingId?: string;
}

export default function MessagesModal({ isOpen, onClose, initialSellerId, initialListingId }: MessagesModalProps) {
  const { user } = useAuth();
  const { client, loading: streamLoading, isConnected } = useStreamChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialSellerId || null);
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (typeof window === 'undefined') return;
    
    // Reset loading state when modal opens
    if (isOpen) {
      setIsLoading(true);
    }
    
    // CRITICAL: Wait for full connection before allowing any operations
    // This ensures connection happens immediately when modal opens, not when user types
    if (isOpen && user) {
      if (client && isConnected && client.userID && client.tokenManager?.token && client.wsConnection?.isHealthy) {
        // Client is fully connected, safe to query
        console.log("✅ MessagesModal: Client fully connected, loading conversations");
        loadConversations();
      } else if (streamLoading) {
        // Still loading connection, keep loading state
        console.log("⏳ MessagesModal: Waiting for Stream Chat connection...");
        setIsLoading(true);
      } else if (client && !isConnected) {
        // Client exists but not connected yet, wait for connection
        console.log("⏳ MessagesModal: Client exists but not connected, waiting...");
        setIsLoading(true);
        // Poll for connection with timeout
        const checkConnection = setInterval(() => {
          if (client && client.userID && client.tokenManager?.token && client.wsConnection?.isHealthy) {
            console.log("✅ MessagesModal: Connection established, loading conversations");
            clearInterval(checkConnection);
            loadConversations();
          }
        }, 500);
        
        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
          clearInterval(checkConnection);
          console.error("❌ MessagesModal: Connection timeout");
          setIsLoading(false);
        }, 10000);
        
        return () => {
          clearInterval(checkConnection);
          clearTimeout(timeout);
        };
      } else if (!client && !streamLoading) {
        // Stream Chat not available or not initialized
        console.warn("⚠️ MessagesModal: Stream Chat client not available");
        setIsLoading(false);
      }
    }
  }, [isOpen, user, client, streamLoading, isConnected]);

  // If initialSellerId is provided, auto-select that conversation
  useEffect(() => {
    if (isOpen && initialSellerId && !selectedConversation) {
      setSelectedConversation(initialSellerId);
    }
  }, [isOpen, initialSellerId, selectedConversation]);

  const loadConversations = async () => {
    if (!user || !client) {
      console.warn("loadConversations: Missing user or client", { user: !!user, client: !!client });
      setIsLoading(false);
      return;
    }

    // CRITICAL: Ensure client is fully connected before querying
    // Check both userID and that the client is in a connected state
    if (!client.userID) {
      console.warn("Stream Chat client not connected yet. userID:", client.userID);
      console.warn("Client state:", { 
        userID: client.userID, 
        wsConnection: client.wsConnection?.isHealthy,
      });
      setIsLoading(false);
      return; // Don't retry - let useEffect handle it
    }

    try {
      setIsLoading(true);
      
      // Final safety check right before querying
      if (!client.userID || client.userID !== user.id) {
        console.error("Stream Chat connection issue:", {
          clientUserId: client.userID,
          expectedUserId: user.id,
          match: client.userID === user.id
        });
        setIsLoading(false);
        return;
      }
      
      // Check if client is actually connected and ready
      // Stream Chat needs both userID and connection state
      
      // Check WebSocket connection
      if (!client.wsConnection || !client.wsConnection.isHealthy) {
        console.warn("Stream Chat WS connection not healthy, waiting...");
        // Wait a bit and retry
        setTimeout(() => {
          if (client.userID && client.wsConnection?.isHealthy) {
            loadConversations();
          } else {
            console.error("Stream Chat connection still not ready after wait");
            setIsLoading(false);
          }
        }, 2000);
        return;
      }
      
      // Final check: ensure client is ready to query
      if (!client.userID || !client.wsConnection?.isHealthy) {
        console.error("Stream Chat client not ready for queries:", {
          userID: client.userID,
          wsHealthy: client.wsConnection?.isHealthy
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Querying Stream Chat channels for user:", user.id);
      console.log("Client state:", {
        userID: client.userID,
        wsHealthy: client.wsConnection?.isHealthy,
        connected: !!client.userID && client.wsConnection?.isHealthy,
      });
      
      // Final safety check before querying - ensure client is fully connected
      if (!client.userID || !client.wsConnection?.isHealthy) {
        console.error("Cannot query channels: client not fully connected", {
          userID: client.userID,
          wsHealthy: client.wsConnection?.isHealthy
        });
        setIsLoading(false);
        return;
      }
      
      // Get all channels the user is a member of
      const filter = { type: 'messaging', members: { $in: [user.id] } };
      // Stream Chat expects sort with AscDesc type (1 | -1 as literal, not number)
      // Pass undefined to use default sorting, or use proper type
      const channels = await client.queryChannels(filter, undefined, { limit: 20 });
      console.log("✅ Successfully queried channels:", channels.length);

      // Transform Stream channels to our Conversation format
      const convs: Conversation[] = await Promise.all(
        channels.map(async (ch) => {
          const members = Object.values(ch.state.members || {});
          const partner = members.find((m: any) => m.user_id !== user.id);
          // Ensure partnerId is always a string (required by Conversation interface)
          const partnerId: string = (partner?.user_id || ch.id || 'unknown') as string;
          const partnerUser = partner?.user || await client.queryUsers({ id: partnerId }).then(r => r.users[0]);
          
          const lastMessage = ch.state.messages[ch.state.messages.length - 1];
          const unreadCount = ch.countUnread();

          return {
            partner_id: partnerId,
            partner_name: partnerUser?.name || partnerUser?.id || 'Unknown',
            partner_avatar: partnerUser?.image || null,
            last_message: lastMessage?.text || 'No messages yet',
            last_message_time: lastMessage?.created_at?.toISOString() || new Date().toISOString(),
            unread_count: unreadCount || 0,
            listing_title: undefined, // Not stored in channel data - would need to fetch from listing_id if needed
          };
        })
      );

      setConversations(convs);
    } catch (error: any) {
      // Handle Stream Chat specific errors - don't log as errors if it's just not connected
      if (error?.message?.includes('tokens are not set') || error?.message?.includes('connectUser')) {
        // This is expected if Stream Chat isn't configured or connection failed
        // Don't show as error, just set empty state
        console.log("Stream Chat not connected - messaging unavailable");
        setConversations([]);
        setIsLoading(false);
        return;
      } else {
        console.error("❌ Error loading conversations:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : String(error),
          userID: client?.userID,
          wsHealthy: client?.wsConnection?.isHealthy,
        });
      }
      
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedConversation || !client || !user) {
      setChannel(null);
      setMessages([]);
      return;
    }

    // Ensure client is fully connected before setting up channel
    // Must have both userID and healthy WebSocket connection
    if (!client.userID) {
      console.warn("Stream Chat client not connected (no userID), cannot setup channel");
      return;
    }

    if (!client.wsConnection || !client.wsConnection.isHealthy) {
      console.warn("Stream Chat WebSocket not healthy, waiting...");
      // Wait a bit and retry - but don't set up channel yet
      return;
    }

    const setupChannel = async () => {
      try {
        // Final check: ensure client is still connected
        if (!client || !client.userID || !client.wsConnection?.isHealthy) {
          console.error("Stream Chat client not connected, cannot setup channel");
          return;
        }

        // Find or create a channel with the selected user
        // Create a deterministic channel ID that's <= 64 characters
        // Hash the two user IDs together to create a shorter, unique ID
        const userIds = [user.id, selectedConversation].sort();
        const combined = userIds.join('-');
        
        // Simple hash function to create a shorter ID (max 64 chars)
        // If combined is already short enough, use it; otherwise hash it
        let channelId: string;
        if (combined.length <= 64) {
          channelId = combined;
        } else {
          // Create a hash from the combined string
          // Using a simple approach: take first 16 chars of each UUID (without dashes) + dash
          const hash1 = userIds[0].replace(/-/g, '').substring(0, 16);
          const hash2 = userIds[1].replace(/-/g, '').substring(0, 16);
          channelId = `${hash1}-${hash2}`;
          
          // If still too long, truncate
          if (channelId.length > 64) {
            channelId = channelId.substring(0, 64);
          }
        }
        
        console.log("Creating Stream Chat channel with ID:", channelId, "Length:", channelId.length);
        
        // Deduplicate members to avoid "Duplicate members" error
        const members = [user.id, selectedConversation].filter((id, index, arr) => arr.indexOf(id) === index);
        
        const channelData: any = {
          members: members,
        };
        
        // Add listing context if provided
        if (initialListingId) {
          channelData.listing_id = initialListingId;
        }
        
        // Final check before creating channel - ensure client is fully connected
        if (!client.userID || client.userID !== user.id) {
          console.error("Cannot create channel: Client not connected to current user", {
            clientUserId: client.userID,
            currentUserId: user.id
          });
          return;
        }

        // Ensure tokens are set before creating channel
        if (!client.tokenManager?.token) {
          console.error("Cannot create channel: Stream Chat tokens not set");
          return;
        }

        // CRITICAL: Verify the connection is actually ready for operations
        // Stream Chat needs both token AND the connection to be established
        if (!client.wsConnection || !client.wsConnection.isHealthy) {
          console.warn("Stream Chat WS connection not healthy, waiting before channel creation...");
          // Wait a bit and retry
          setTimeout(() => {
            if (client.userID && client.tokenManager?.token && client.wsConnection?.isHealthy) {
              setupChannel();
            } else {
              console.error("Stream Chat connection still not ready after wait");
            }
          }, 1000);
          return;
        }

        // Additional check: verify token is actually valid by checking if client is in connected state
        // Stream Chat SDK sets an internal connection state
        if (!client.tokenManager.token) {
          console.error("Cannot create channel: Token manager has no token");
          return;
        }

        const channel = client.channel('messaging', channelId, channelData);

        // Watch the channel with error handling
        try {
          await channel.watch();
          setChannel(channel);

          // Listen for new messages
          channel.on('message.new', () => {
            setMessages([...channel.state.messages]);
          });

          // Load existing messages
          setMessages([...channel.state.messages]);
        } catch (watchError: any) {
          // Check if it's a connection error
          if (watchError?.message?.includes('tokens are not set') || watchError?.message?.includes('connectUser')) {
            console.warn("Stream Chat not connected - cannot watch channel");
            return;
          }
          console.error("Error watching channel:", watchError);
          // Try to query the channel instead as fallback
          try {
            await channel.query();
            setChannel(channel);
            setMessages([...channel.state.messages]);
          } catch (queryError: any) {
            if (queryError?.message?.includes('tokens are not set') || queryError?.message?.includes('connectUser')) {
              console.warn("Stream Chat not connected - cannot query channel");
              return;
            }
            console.error("Error querying channel:", queryError);
          }
        }
      } catch (error: any) {
        // Don't log connection errors as errors - they're expected if Stream Chat isn't configured
        if (error?.message?.includes('tokens are not set') || error?.message?.includes('connectUser')) {
          console.log("Stream Chat not connected - channel setup skipped");
          return;
        }
        console.error("Error setting up channel:", error);
      }
    };

    setupChannel();
  }, [selectedConversation, client, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !channel) return;

    // CRITICAL: Check if client is connected before sending
    if (!client) {
      console.error("Cannot send message: Stream Chat client not available");
      return;
    }

    if (!client.userID) {
      console.error("Cannot send message: Stream Chat client not connected (no userID)");
      return;
    }

    if (!client.tokenManager?.token) {
      console.error("Cannot send message: Stream Chat tokens not set");
      return;
    }

    // Verify client is connected to the correct user
    if (client.userID !== user.id) {
      console.error("Cannot send message: Client connected to different user", {
        clientUserId: client.userID,
        currentUserId: user.id
      });
      return;
    }

    // CRITICAL: Verify WebSocket connection is healthy before sending
    // This is the most reliable indicator that Stream Chat is ready for operations
    if (!client.wsConnection || !client.wsConnection.isHealthy) {
      console.error("Cannot send message: WebSocket connection not healthy", {
        hasWS: !!client.wsConnection,
        isHealthy: client.wsConnection?.isHealthy,
        userID: client.userID,
        hasToken: !!client.tokenManager?.token
      });
      return;
    }

    try {
      setIsSending(true);
      await channel.sendMessage({
        text: newMessage.trim(),
      });
      setNewMessage("");
      // Messages will update via the channel listener
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Handle specific Stream Chat connection errors
      if (error?.message?.includes('tokens are not set') || 
          error?.message?.includes('connectUser') ||
          error?.message?.includes('not connected')) {
        console.error("Stream Chat connection error when sending message:", {
          userID: client.userID,
          hasToken: !!client.tokenManager?.token,
          wsHealthy: client.wsConnection?.isHealthy
        });
        // Could show a user-friendly error message here
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle Stream Chat not available
  if (!client && !streamLoading) {
    return (
      <TSModal isOpen={isOpen} onClose={onClose} title="Messages">
        <div className="py-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">Messaging unavailable</p>
          <p className="text-xs text-white/50">Please ensure Stream Chat is configured</p>
        </div>
      </TSModal>
    );
  }

  return (
    <TSModal
      isOpen={isOpen}
      onClose={onClose}
      title="Messages"
    >
      {/* Show loading while connecting or initializing */}
      {isLoading || streamLoading || !client || !client?.userID || !client?.tokenManager?.token || !isConnected || !client?.wsConnection?.isHealthy ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/70 mb-3" />
          <p className="text-sm text-white/70">Connecting to chat...</p>
          {!client && (
            <p className="text-xs text-white/50 mt-1">Initializing Stream Chat</p>
          )}
          {client && !client.userID && (
            <p className="text-xs text-white/50 mt-1">Authenticating...</p>
          )}
          {client && client.userID && !client.wsConnection?.isHealthy && (
            <p className="text-xs text-white/50 mt-1">Establishing connection...</p>
          )}
        </div>
      ) : conversations.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No messages yet</p>
          <p className="text-xs text-white/50">Start a conversation from a listing</p>
        </div>
      ) : !selectedConversation ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.partner_id}
              onClick={() => setSelectedConversation(conv.partner_id)}
              className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#EFBF05" }}
                >
                  {conv.partner_avatar ? (
                    <img src={conv.partner_avatar} alt={conv.partner_name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {conv.partner_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate">{conv.partner_name}</p>
                    {conv.unread_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EFBF05" }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate">{conv.last_message}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{conv.last_message_time}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-[400px]">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-white/60">No messages yet</p>
              </div>
            ) : (
              messages.map((msg: any) => {
                const isOwn = msg.user?.id === user?.id;
                const text = msg.text || '';
                const createdAt = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-lg ${
                        isOwn
                          ? "bg-[#191970] text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <p className="text-sm">{text}</p>
                      {createdAt && (
                        <p className="text-[10px] opacity-60 mt-1">{createdAt}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message input - only show when fully connected */}
          {client && client.userID && client.tokenManager?.token && isConnected && client.wsConnection?.isHealthy && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Only send if client is connected
                    if (client && client.userID && client.tokenManager?.token && isConnected) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder={
                  !client || !client.userID || !isConnected || !client.wsConnection?.isHealthy
                    ? "Connecting to chat..."
                    : "Type a message..."
                }
                disabled={
                  !client || 
                  !client.userID || 
                  !client.tokenManager?.token || 
                  !isConnected ||
                  !client.wsConnection?.isHealthy
                }
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EFBF05]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
                <button
              onClick={handleSendMessage}
              disabled={
                !newMessage.trim() || 
                isSending || 
                !client || 
                !client.userID || 
                !client.tokenManager?.token ||
                !isConnected ||
                !client.wsConnection?.isHealthy
              }
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#191970" }}
              title={
                !client || !client.userID || !isConnected
                  ? "Connecting to chat..."
                  : !newMessage.trim()
                  ? "Type a message"
                  : "Send message"
              }
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedConversation && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            ← Back to conversations
          </button>
        </div>
      )}
    </TSModal>
  );
}

