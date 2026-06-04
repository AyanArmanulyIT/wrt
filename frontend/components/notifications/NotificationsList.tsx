"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Avatar } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications.service";
import type { Notification } from "@/services/notifications.service";

const TYPE_ICONS = {
  like: Heart,
  comment: MessageCircle,
  class_rank: Trophy,
};

export function NotificationsList() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(1),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const items = data?.results ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Уведомления
          </CardTitle>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              loading={readAllMutation.isPending}
              onClick={() => readAllMutation.mutate()}
            >
              Прочитать все
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-center text-muted-foreground py-8">
              Не удалось загрузить уведомления
            </p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Пока уведомлений нет
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={() => {
                    if (!n.is_read) markReadMutation.mutate(n.id);
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const Icon = TYPE_ICONS[n.type] ?? Bell;
  const href = n.post_id ? `/feed` : n.type === "class_rank" ? "/class-clash" : "/feed";

  return (
    <li>
      <Link
        href={href}
        onClick={onRead}
        className={cn(
          "flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-muted",
          !n.is_read && "bg-accent/5 border border-accent/20"
        )}
      >
        {n.actor_username ? (
          <Link
            href={`/profile/${n.actor_username}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <Avatar
              name={n.actor_username}
              src={n.actor_avatar}
              size="sm"
              className="ring-1 ring-white/10"
            />
          </Link>
        ) : (
          <div
            className={cn(
              "h-9 w-9 rounded-2xl flex items-center justify-center shrink-0",
              n.type === "like" && "bg-red-500/10 text-red-500",
              n.type === "comment" && "bg-white/10 text-white",
              n.type === "class_rank" && "bg-accent/10 text-accent"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            {n.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(n.created_at)}
            </p>
            {n.actor_username ? (
              <span className="text-xs text-muted-foreground">
                · @{n.actor_username}
              </span>
            ) : null}
          </div>
        </div>
        {!n.is_read ? (
          <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />
        ) : null}
      </Link>
    </li>
  );
}