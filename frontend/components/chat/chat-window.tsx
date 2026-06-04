'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  sender_email: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to WebSocket
  useEffect(() => {
    if (!user || !chatId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${chatId}/`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            sender_id: data.sender_id,
            sender_email: data.sender_email,
            content: data.content,
            created_at: data.created_at,
          },
        ]);
      } else if (data.type === 'user_online') {
        setOnlineUsers((prev) => new Set(prev).add(data.user_id));
      } else if (data.type === 'user_offline') {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
      } else if (data.type === 'online_users') {
        setOnlineUsers(new Set(data.user_ids));
      } else if (data.type === 'user_typing') {
        setTypingUsers((prev) => new Set(prev).add(data.user_id));
        // Auto-remove after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.user_id);
            return next;
          });
        }, 3000);
      } else if (data.type === 'stop_typing') {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [chatId, user]);

  // Fetch previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/v1/chats/${chatId}/messages/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.results || data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [chatId, user]);

  // Send typing indicator
  const handleTyping = useCallback(() => {
    if (!ws.current || !isConnected) return;

    ws.current.send(JSON.stringify({
      type: 'typing',
      username: user?.profile?.username || user?.email?.split('@')[0] || 'Someone',
    }));

    // Reset auto stop typing timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (ws.current) {
        ws.current.send(JSON.stringify({ type: 'stop_typing' }));
      }
    }, 2000);
  }, [isConnected, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !isConnected || !ws.current) {
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: 'chat_message',
        content: inputValue,
      })
    );

    setInputValue('');
  };

  // Find typing users names
  const typingNames = Array.from(typingUsers)
    .filter((id) => id !== user?.id)
    .map((id) => {
      // Find the message sender name for this ID
      const msg = messages.find((m) => m.sender_id === id);
      return msg ? msg.sender_email.split('@')[0] : 'Someone';
    });

  const onlineCount = onlineUsers.size;

  return (
    <div className="flex flex-col h-[600px] bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
      {/* Header with online count */}
      <div className="bg-foreground text-background p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Чат
          </h2>
          <div className="flex items-center gap-3">
            {/* Online count */}
            {onlineCount > 0 && (
              <span className="text-xs text-background/80 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                {onlineCount} онлайн
              </span>
            )}
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Пока нет сообщений</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-2xl ${
                    isMine
                      ? 'bg-foreground text-background rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      @{message.sender_email.split('@')[0]}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMine ? 'text-background/60' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic animate-pulse">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>
              {typingNames.length === 1
                ? `${typingNames[0]} печатает...`
                : `${typingNames.join(', ')} печатают...`}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border p-4 flex gap-2 bg-background"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleTyping();
          }}
          placeholder="Напишите сообщение..."
          disabled={!isConnected}
          className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !inputValue.trim()}
          className="px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Send className="h-4 w-4" />
          Отправить
        </button>
      </form>
    </div>
  );
}