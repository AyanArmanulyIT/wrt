"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/services/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [firstName, setFirstName] = useState(user?.profile?.first_name || "");
  const [lastName, setLastName] = useState(user?.profile?.last_name || "");
  const [bio, setBio] = useState(user?.profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      await api.patch("/auth/profile/update/", {
        first_name: firstName,
        last_name: lastName,
        bio: bio,
      });
      setSaved(true);
      // Обновляем пользователя в сторе
      const { data: freshUser } = await api.get("/auth/me/");
      setUser(freshUser);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Ошибка сохранения";
      setSaveError(msg);
      console.error("Error saving profile", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Профиль: Имя, Фамилия, Био */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Имя и фамилия</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Имя"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  placeholder="Фамилия"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Биография</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о себе..."
                className="w-full h-24 rounded-2xl border border-border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
                maxLength={300}
              />
            </div>
            {saveError && (
              <p className="text-xs text-red-500">{saveError}</p>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={handleSave}
              >
                Сохранить
              </Button>
              {saved && (
                <span className="text-xs text-green-500">Сохранено!</span>
              )}
            </div>
          </div>

          <div className="border-t border-border my-2" />

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
              <span className="text-muted-foreground">Username: </span>
              @{user?.profile?.username}
            </p>
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
