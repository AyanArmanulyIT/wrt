"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Calendar, Home, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import dynamic from "next/dynamic";

const CreatePostModal = dynamic(() => import("./CreatePostModal"), { ssr: false });

const items = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/events", icon: Calendar, label: "События" },
  { href: "#create", icon: Plus, label: "", center: true as const },
  { href: "/notifications", icon: Bell, label: "Уведом." },
  { href: "/profile", icon: User, label: "Профиль", isProfile: true as const },
];

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const profileHref = `/profile/${user?.profile?.username ?? "me"}`;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl shadow-mobile-nav bottom-nav-safe"
        role="navigation"
        aria-label="Основная навигация"
      >
        <div className="flex items-center justify-around h-[var(--nav-height)] px-2">
          {items.map(({ href, icon: Icon, label, center, isProfile }) => {
            const link = isProfile ? profileHref : href === "#create" ? "" : href;
            const active = link ? pathname === link || pathname.startsWith(link + "/") : false;

            if (center) {
              return (
                <button
                  key="create"
                  onClick={() => setShowCreate(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-soft-lg -mt-6 transition-transform active:scale-95 hover:opacity-90"
                  aria-label="Создать пост"
                >
                  <Plus className="h-6 w-6" />
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={link}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-xs transition-colors min-w-[56px] py-1",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Create Post Modal */}
      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
}