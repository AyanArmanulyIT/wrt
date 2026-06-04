"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Home,
  Search,
  Settings,
  Shield,
  Swords,
  User,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/auth.store";
import { Avatar } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { OnlineStatus } from "@/components/chat/online-status";

const nav = [
  { href: "/feed", label: "Лента", icon: Home },
  { href: "/chat", label: "Чаты", icon: MessageSquare },
  { href: "/events", label: "События", icon: Calendar },
  { href: "/class-clash", label: "Class Clash", icon: Swords },
  { href: "/polls", label: "Голосования", icon: BarChart3 },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/settings", label: "Настройки", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Админ", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const username = user?.profile?.username ?? "guest";

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div>
          <p className="font-semibold text-sm tracking-tight">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">Work, Relax, Talk</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-foreground text-background shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        {/* Admin link — only for staff/moderators */}
        {(user?.is_staff || user?.is_superuser || user?.is_school_moderator) ? (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 mb-2">
              Управление
            </p>
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-foreground text-background shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
              )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <OnlineStatus />
            </div>
        <Link
          href={`/profile/${username}`}
          className="flex items-center gap-3 rounded-2xl p-3 hover:bg-muted transition-colors hover:translate-x-0.5"
        >
          <Avatar name={username} src={user?.profile?.avatar} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">@{username}</p>
            {user?.profile?.class_name ? (
              <Badge className="mt-0.5">{user.profile.class_name}</Badge>
            ) : null}
          </div>
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
