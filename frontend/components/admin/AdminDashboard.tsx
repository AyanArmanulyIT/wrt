"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Wifi, FileText, GraduationCap, UserCheck, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAdminActivity, fetchAdminStats } from "@/services/admin.service";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => fetchAdminActivity(7),
  });

  const cards = [
    { label: "Пользователей", value: stats?.total_users ?? "—", icon: Users, color: "text-blue-400" },
    { label: "Онлайн", value: stats?.online_users ?? "—", icon: Wifi, color: "text-green-400" },
    { label: "Постов", value: stats?.total_posts ?? "—", icon: FileText, color: "text-purple-400" },
    { label: "Активных классов", value: stats?.active_classes ?? "—", icon: GraduationCap, color: "text-amber-400" },
    { label: "На проверке", value: stats?.pending_verifications ?? "—", icon: UserCheck, color: "text-orange-400" },
    { label: "Заблокировано", value: stats?.banned_users ?? "—", icon: Ban, color: "text-red-400" },
  ];

  const maxActivity = Math.max(
    ...activity.flatMap((d) => [d.posts, d.comments, d.likes]),
    1
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Обзор</h1>
        <p className="text-gray-500 text-sm mt-1">Аналитика школы в реальном времени</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{label}</p>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">Активность за 7 дней</h2>
        {activity.length === 0 ? (
          <p className="text-gray-500 text-sm">Пока нет данных</p>
        ) : (
          <div className="space-y-4">
            {activity.map((day) => (
              <div key={day.date} className="space-y-2">
                <p className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString("ru-RU", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Bar label="Посты" value={day.posts} max={maxActivity} color="bg-indigo-500" />
                  <Bar label="Коммент." value={day.comments} max={maxActivity} color="bg-blue-500" />
                  <Bar label="Лайки" value={day.likes} max={maxActivity} color="bg-pink-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Bar({
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
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between mb-1 text-gray-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
