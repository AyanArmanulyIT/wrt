"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Plus, Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const items = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/class-clash", icon: Swords, label: "Clash" },
  { href: "/feed", icon: Plus, label: "Создать", center: true },
  { href: "/notifications", icon: Bell, label: "Уведом." },
  { href: "/settings", icon: User, label: "Профиль" },
];

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const profileHref = `/profile/${user?.profile?.username ?? "me"}`;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, icon: Icon, label, center }) => {
          const link = label === "Профиль" ? profileHref : href;
          const active = pathname === link;
          if (center) {
            return (
              <Link
                key="create"
                href="/feed"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-soft-lg -mt-6"
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          }
          return (
            <Link
              key={label}
              href={link}
              className={cn(
                "flex flex-col items-center gap-0.5 text-xs transition-colors",
                active ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
