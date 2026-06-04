'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface OnlineStatusProps {
  userId?: string;
  showLabel?: boolean;
}

export function OnlineStatus({ userId, showLabel = true }: OnlineStatusProps) {
  const authUser = useAuthStore((s) => s.user);
  const [onlineMap, setOnlineMap] = useState<Map<string, boolean>>(new Map());
  const [classOnlineCount, setClassOnlineCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!authUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications/`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Online status WS connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'status_update') {
        setOnlineMap((prev) => new Map(prev).set(data.user_id, data.is_online));
      } else if (data.type === 'class_online_count') {
        setClassOnlineCount(data.count);
      }
    };

    ws.current.onclose = () => {
      console.log('Online status WS disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [authUser]);

  if (!userId) {
    if (classOnlineCount > 0) {
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          {classOnlineCount} онлайн
        </span>
      );
    }
    return null;
  }

  const isOnline = onlineMap.get(userId) ?? false;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
        )}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'В сети' : 'Не в сети'}
        </span>
      )}
    </div>
  );
}