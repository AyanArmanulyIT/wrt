"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  Search,
  Settings,
  Swords,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/store/auth.store";
import { Avatar } from "@/ui/avatar";
import { Badge } from "@/ui/badge";

const nav = [
  { href: "/feed", label: "Лента", icon: Home },
  { href: "/class-clash", label: "Class Clash", icon: Swords },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const username = user?.profile?.username ?? "guest";

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="h-9 w-9 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          W
        </div>
        <div>
          <p className="font-semibold text-sm">{APP_NAME}</p>
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
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
        </div>
        <Link
          href={`/profile/${username}`}
          className="flex items-center gap-3 rounded-2xl p-3 hover:bg-muted transition-colors"
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
