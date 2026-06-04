"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
  MessageSquare,
  Users,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import { OnlineStatus } from "@/components/chat/online-status";
import { ChatWindow } from "@/components/chat/chat-window";

interface ChatUser {
  id: string;
  email: string;
}

interface Chat {
  id: string;
  chat_type: "private" | "class";
  participant_1: ChatUser | null;
  participant_2: ChatUser | null;
  school_class: string | null;
  messages: {
    id: string;
    content: string;
    created_at: string;
    sender: { id: string; email: string };
  }[];
  created_at: string;
}

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/v1/chats/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setChats(data.results || data);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user]);

  // Search users for new private chat
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/v1/auth/users/search/?q=${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || data);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  // Create a new private chat
  const createPrivateChat = async (otherUserId: string) => {
    try {
      const res = await fetch("/api/v1/chats/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          chat_type: "private",
          user_id: otherUserId,
        }),
      });
      if (res.ok) {
        const chat = await res.json();
        setChats((prev) => [chat, ...prev]);
        setSelectedChat(chat.id);
        setShowNewChat(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const getChatName = (chat: Chat): string => {
    if (chat.chat_type === "class") {
      return chat.school_class || "Class Chat";
    }
    const other =
      chat.participant_1?.id === user?.id
        ? chat.participant_2
        : chat.participant_1;
    return other ? `@${other.email.split("@")[0]}` : "Unknown";
  };

  const getOtherUserId = (chat: Chat): string | null => {
    if (chat.chat_type === "class") return null;
    const other =
      chat.participant_1?.id === user?.id
        ? chat.participant_2
        : chat.participant_1;
    return other?.id || null;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-8 w-24" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 border border-border rounded-2xl bg-card overflow-hidden">
            <div className="skeleton h-12 rounded-none" />
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-none mx-0" />)}
          </div>
          <div className="lg:col-span-2">
            <div className="skeleton h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 stagger-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Чаты</h1>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Новый чат
        </button>
      </div>

      {/* New chat search */}
      {showNewChat && (
        <div className="mb-6 p-4 border border-border rounded-2xl bg-card">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск пользователей..."
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1">
              {searchResults
                .filter((u) => u.id !== user?.id)
                .map((result) => (
                  <button
                    key={result.id}
                    onClick={() => createPrivateChat(result.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <Avatar name={result.email.split("@")[0]} size="sm" />
                    <span className="text-sm font-medium">
                      @{result.email.split("@")[0]}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Chat list + Active chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat list sidebar */}
        <div className="lg:col-span-1 border border-border rounded-2xl bg-card overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Диалоги</span>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Нет чатов. Начните новый диалог!
              </div>
            ) : (
              chats.map((chat) => {
                const otherUserId = getOtherUserId(chat);
                const lastMsg = chat.messages?.[chat.messages.length - 1];
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors",
                      selectedChat === chat.id && "bg-muted"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        name={getChatName(chat)}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {getChatName(chat)}
                        </p>
                        {chat.chat_type === "class" && (
                          <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lastMsg.sender.email.split("@")[0]}:{" "}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                    <OnlineStatus userId={otherUserId || undefined} showLabel={false} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active chat */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <ChatWindow key={selectedChat} chatId={selectedChat} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] border border-border rounded-2xl bg-card text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p>Выберите чат или создайте новый</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}