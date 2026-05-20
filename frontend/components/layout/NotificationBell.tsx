"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { fetchUnreadCount } from "@/services/notifications.service";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: count = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });

  return (
    <Link
      href="/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-muted transition-colors"
      aria-label="Уведомления"
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
            "rounded-full bg-red-500 text-white text-[10px] font-bold",
            "flex items-center justify-center"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
