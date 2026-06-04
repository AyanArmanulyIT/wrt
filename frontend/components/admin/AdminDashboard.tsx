"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Wifi,
  FileText,
  GraduationCap,
  UserCheck,
  Ban,
  Loader2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAdminActivity, fetchAdminStats } from "@/services/admin.service";

const CARD_ICONS = {
  total_users: Users,
  online_users: Wifi,
  total_posts: FileText,
  posts_today: FileText,
  active_classes: GraduationCap,
  pending_verifications: UserCheck,
  banned_users: Ban,
} as const;

const CARD_LABELS: Record<string, string> = {
  total_users: "Всего пользователей",
  online_users: "Онлайн",
  total_posts: "Всего постов",
  posts_today: "Постов сегодня",
  active_classes: "Активных классов",
  pending_verifications: "На проверке",
  banned_users: "Заблокировано",
};

const CARD_COLORS: Record<string, string> = {
  total_users: "text-accent",
  online_users: "text-green-400",
  total_posts: "text-purple-400",
  posts_today: "text-blue-400",
  active_classes: "text-amber-400",
  pending_verifications: "text-orange-400",
  banned_users: "text-red-400",
};

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => fetchAdminActivity(14),
  });

  if (statsLoading || activityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const cards: { key: string; value: number | string }[] = [
    { key: "total_users", value: stats.total_users },
    { key: "online_users", value: stats.online_users },
    { key: "posts_today", value: stats.posts_today },
    { key: "total_posts", value: stats.total_posts },
    { key: "active_classes", value: stats.active_classes },
    { key: "pending_verifications", value: stats.pending_verifications },
    { key: "banned_users", value: stats.banned_users },
  ];

  const maxActivity = Math.max(
    ...activity.flatMap((d) => [d.posts, d.comments, d.likes, d.new_users]),
    1
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Аналитика школы в реальном времени
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ key, value }) => {
          const Icon = CARD_ICONS[key as keyof typeof CARD_ICONS] ?? Users;
          return (
            <div
              key={key}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {CARD_LABELS[key] ?? key}
                </p>
                <Icon
                  className={cn(
                    "h-5 w-5",
                    CARD_COLORS[key] ?? "text-muted-foreground"
                  )}
                />
              </div>
              <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
            </div>
          );
        })}
      </div>

      {/* Growth chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">
            Активность за 14 дней
          </h2>
          <Calendar className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>

        {activity.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Пока нет данных
          </p>
        ) : (
          <div className="space-y-6">
            {/* Day bars */}
            <div className="space-y-3">
              {activity.map((day) => (
                <div key={day.date} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    {new Date(day.date + "T00:00:00").toLocaleDateString(
                      "ru-RU",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }
                    )}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <MiniBar
                      label="Посты"
                      value={day.posts}
                      max={maxActivity}
                      color="bg-purple-500"
                    />
                    <MiniBar
                      label="Коммент."
                      value={day.comments}
                      max={maxActivity}
                      color="bg-blue-500"
                    />
                    <MiniBar
                      label="Лайки"
                      value={day.likes}
                      max={maxActivity}
                      color="bg-pink-500"
                    />
                    <MiniBar
                      label="Новые"
                      value={day.new_users}
                      max={maxActivity}
                      color="bg-green-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary totals */}
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border">
              <SummaryStat
                label="Посты"
                value={activity.reduce((s, d) => s + d.posts, 0)}
                color="text-purple-400"
              />
              <SummaryStat
                label="Коммент."
                value={activity.reduce((s, d) => s + d.comments, 0)}
                color="text-blue-400"
              />
              <SummaryStat
                label="Лайки"
                value={activity.reduce((s, d) => s + d.likes, 0)}
                color="text-pink-400"
              />
              <SummaryStat
                label="Новые"
                value={activity.reduce((s, d) => s + d.new_users, 0)}
                color="text-green-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-0.5 text-muted-foreground">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}