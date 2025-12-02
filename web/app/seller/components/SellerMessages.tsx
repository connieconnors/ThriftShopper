"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ChevronRight } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url: string | null;
  };
  listing?: {
    title: string;
    clean_image_url: string | null;
  };
}

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  listing_title?: string;
}

interface SellerMessagesProps {
  userId: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

// Simple \"time ago\" formatter without external deps
function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export default function SellerMessages({ userId, expanded = false, onToggleExpand }: SellerMessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // For MVP, show placeholder conversations
  // In production, this would fetch from a messages table
  useEffect(() => {
    // Simulated data for MVP demo
    const mockConversations: Conversation[] = [
      {
        partner_id: "buyer-1",
        partner_name: "Sarah M.",
        partner_avatar: null,
        last_message: "Is this still available?",
        last_message_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        unread_count: 1,
        listing_title: "Vintage Brass Lamp",
      },
      {
        partner_id: "buyer-2",
        partner_name: "Mike T.",
        partner_avatar: null,
        last_message: "Thanks for shipping so fast!",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        unread_count: 0,
        listing_title: "Mid-Century Chair",
      },
    ];

    // Uncomment when messages table exists:
    // fetchConversations();
    
    setConversations(mockConversations);
    setIsLoading(false);
  }, [userId]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // Collapsed view - just shows unread count
  if (!expanded) {
    return (
      <button
        onClick={onToggleExpand}
        className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MessageCircle size={24} className="text-gray-600" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">
                {totalUnread > 0 ? `${totalUnread} unread` : "No new messages"}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>
      </button>
    );
  }

  // Expanded view - shows conversations
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle size={20} />
          Messages
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
              {totalUnread}
            </span>
          )}
        </h2>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Collapse
          </button>
        )}
      </div>

      {/* Conversation List */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p>No messages yet</p>
          <p className="text-sm">Buyer inquiries will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map((conversation) => (
            <button
              key={conversation.partner_id}
              onClick={() => setSelectedConversation(conversation.partner_id)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                conversation.unread_count > 0 ? "bg-blue-50/50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  {conversation.partner_avatar ? (
                    <img
                      src={conversation.partner_avatar}
                      alt={conversation.partner_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {conversation.partner_name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-medium ${conversation.unread_count > 0 ? "text-gray-900" : "text-gray-700"}`}>
                      {conversation.partner_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(conversation.last_message_time)}
                    </span>
                  </div>
                  {conversation.listing_title && (
                    <p className="text-xs text-gray-400 mb-0.5">
                      Re: {conversation.listing_title}
                    </p>
                  )}
                  <p className={`text-sm truncate ${conversation.unread_count > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                    {conversation.last_message}
                  </p>
                </div>

                {/* Unread indicator */}
                {conversation.unread_count > 0 && (
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick note about MVP */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          💬 Full messaging coming soon • For now, contact info shown on orders
        </p>
      </div>
    </div>
  );
}

