"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/posts", label: "Посты", icon: FileText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0c0e14] text-gray-100 flex">
      <aside className="w-56 border-r border-white/10 p-4 flex flex-col shrink-0">
        <div className="mb-8">
          <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
            WRT Admin
          </p>
          <p className="text-lg font-semibold mt-1">Панель управления</p>
        </div>
        <nav className="space-y-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                pathname === href
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/feed"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mt-4 pt-4 border-t border-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          В приложение
        </Link>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
