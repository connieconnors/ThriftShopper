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
    if (isOpen && user && client && isConnected) {
      // Client is connected, safe to query
      loadConversations();
    } else if (isOpen && user && client && !isConnected && !streamLoading) {
      // Client exists but not connected yet, wait a bit
      const timer = setTimeout(() => {
        if (client.userID) {
          loadConversations();
        } else {
          setIsLoading(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isOpen && user && !client && !streamLoading) {
      // Stream Chat not available, show empty state
      setIsLoading(false);
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
        connectionID: client.connectionID 
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
      // Check if client has been disconnected
      if (client.disconnectPromise) {
        console.warn("Stream Chat client is disconnecting, waiting...");
        await client.disconnectPromise;
        setIsLoading(false);
        return;
      }
      
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
        connectionID: client.connectionID
      });
      
      // Get all channels the user is a member of
      const filter = { type: 'messaging', members: { $in: [user.id] } };
      const sort = { last_message_at: -1 };
      const channels = await client.queryChannels(filter, sort, { limit: 20 });
      console.log("✅ Successfully queried channels:", channels.length);

      // Transform Stream channels to our Conversation format
      const convs: Conversation[] = await Promise.all(
        channels.map(async (ch) => {
          const members = Object.values(ch.state.members || {});
          const partner = members.find((m: any) => m.user_id !== user.id);
          const partnerId = partner?.user_id || ch.id;
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
            listing_title: ch.data?.listing_title || undefined,
          };
        })
      );

      setConversations(convs);
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        userID: client.userID,
        wsHealthy: client.wsConnection?.isHealthy,
        connectionID: client.connectionID
      });
      
      // If connection was lost, try to reconnect
      if (error instanceof Error && error.message.includes("token")) {
        console.warn("Connection lost, may need to reconnect");
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

    // Ensure client is connected before setting up channel
    if (!client.userID) {
      console.warn("Stream Chat client not connected, cannot setup channel");
      return;
    }

    const setupChannel = async () => {
      try {
        // Ensure client is fully connected before proceeding
        if (!client.userID) {
          console.warn("Stream Chat client userID not set, cannot setup channel");
          return;
        }

        // Wait for WebSocket to be healthy if needed
        if (client.wsConnection && !client.wsConnection.isHealthy) {
          console.log("Waiting for Stream Chat WebSocket to be healthy...");
          let retries = 0;
          while (retries < 10 && (!client.wsConnection || !client.wsConnection.isHealthy)) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
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
          console.error("Error watching channel:", watchError);
          // Try to query the channel instead as fallback
          try {
            await channel.query();
            setChannel(channel);
            setMessages([...channel.state.messages]);
          } catch (queryError) {
            console.error("Error querying channel:", queryError);
            throw queryError;
          }
        }
      } catch (error: any) {
        console.error("Error setting up channel:", error);
        // Don't throw - just log the error so the UI doesn't break
      }
    };

    setupChannel();
  }, [selectedConversation, client, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !channel) return;

    try {
      setIsSending(true);
      await channel.sendMessage({
        text: newMessage.trim(),
      });
      setNewMessage("");
      // Messages will update via the channel listener
    } catch (error) {
      console.error("Error sending message:", error);
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
      {isLoading || streamLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-white/70" />
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

          {/* Message input */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#EFBF05]/50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#191970" }}
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

