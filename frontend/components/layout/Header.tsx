"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { Input } from "@/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/ui/badge";

export function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 lg:h-16 items-center gap-4 px-4 lg:px-8 max-w-3xl mx-auto w-full">
        <Link href="/feed" className="lg:hidden font-bold text-accent">
          WRT
        </Link>
        <div className="hidden sm:flex flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск людей и постов..."
            className="pl-10 bg-muted/50 border-transparent"
            readOnly
            onClick={() => (window.location.href = "/search")}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {user?.verification_status === "pending" ? (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
              На проверке
            </Badge>
          ) : null}
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
