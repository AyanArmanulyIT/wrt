"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Тема</p>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                Светлая
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                Тёмная
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-muted p-4 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Email: </span>
              {user?.email}
            </p>
            <p>
              <span className="text-muted-foreground">Статус: </span>
              {user?.verification_status === "verified"
                ? "Подтверждён"
                : user?.verification_status === "pending"
                  ? "На проверке"
                  : "Отклонён"}
            </p>
            <p>
              <span className="text-muted-foreground">Школа: </span>
              {user?.profile?.school_name ?? "—"}
            </p>
          </div>
          {user?.is_superuser || user?.is_staff || user?.is_school_moderator ? (
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl border border-accent/30 bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Панель администратора
            </Link>
          ) : null}
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Выйти
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
