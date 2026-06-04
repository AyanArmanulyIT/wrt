"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Award,
  BarChart3,
  Calendar,
  Clock,
  Crown,
  Flame,
  Loader2,
  Medal,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchClashDashboard } from "@/services/classClash.service";
import type { ClashDashboardData } from "@/services/classClash.service";
import { ClassLevelCard, QuestsCard, StreakRewardsCard, AchievementProgressCard } from "./GamificationPanel";

const BADGE_STYLES: Record<string, string> = {
  most_active: "bg-orange-500/15 text-orange-500 border-orange-500/25",
  fastest_growing: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  number_one: "bg-amber-500/15 text-amber-500 border-amber-500/25",
};

const BADGE_ICONS: Record<string, typeof Flame> = {
  most_active: Flame,
  fastest_growing: TrendingUp,
  number_one: Crown,
};

const MEDAL_COLORS = ["text-amber-400", "text-gray-400", "text-amber-700"];

export function ClassClashDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["clash-dashboard"],
    queryFn: fetchClashDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Gamification Cards */}
      <ClassLevelCard />
      <QuestsCard />

      {/* ===== EVENTS LINK ===== */}
      <Link
        href="/events"
        className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-4 transition-colors hover:bg-green-500/10"
      >
        <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">События</p>
          <p className="text-xs text-muted-foreground">
            Спорт, турниры, олимпиады с регистрацией
          </p>
        </div>
        <Calendar className="h-5 w-5 text-green-500 ml-auto" />
      </Link>

      {/* ===== POLLS LINK ===== */}
      <Link
        href="/polls"
        className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-4 transition-colors hover:bg-accent/10"
      >
        <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Голосования</p>
          <p className="text-xs text-muted-foreground">
            Лучший мем, фото, самый дружный класс
          </p>
        </div>
        <BarChart3 className="h-5 w-5 text-accent ml-auto" />
      </Link>

      {/* ===== HALL OF FAME LINK ===== */}
      <Link
        href="/class-clash/hall-of-fame"
        className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-4 transition-colors hover:bg-amber-500/10"
      >
        <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Hall of Fame</p>
          <p className="text-xs text-muted-foreground">
            Лучшие ученики, классы и посты
          </p>
        </div>
        <Trophy className="h-5 w-5 text-amber-500 ml-auto" />
      </Link>

      <StreakRewardsCard />
      <AchievementProgressCard />

      {/* ===== SEASON BANNER ===== */}
      {data?.season ? (
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-accent uppercase tracking-wider">
                    {data.season.name}
                  </span>
                </div>
                <h2 className="text-xl font-bold">Сезонная битва классов</h2>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {data.season.days_remaining > 0
                      ? `${data.season.days_remaining} дн.`
                      : "Завершён"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">до конца сезона</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-accent/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{
                  width: `${Math.max(0, Math.min(100, ((7 - (data.season.days_remaining ?? 7)) / 7) * 100))}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ===== CLASS OF THE WEEK ===== */}
      {data?.class_of_week ? (
        <Link href={`/class-clash/${data.class_of_week.slug}`}>
          <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden hover:bg-accent/5 transition-colors">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-3xl bg-accent flex items-center justify-center text-accent-foreground">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Класс недели</p>
                <p className="text-2xl font-bold">{data.class_of_week.name}</p>
                <p className="text-sm text-accent font-medium">
                  {data.class_of_week.weekly_points} очков за неделю
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Класс недели появится, когда классы начнут набирать очки
          </CardContent>
        </Card>
      )}

      {/* ===== CLASS BADGES ===== */}
      {data?.badges && data.badges.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="h-5 w-5 text-accent" />
              Значки класса
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((b, i) => {
                const Icon = BADGE_ICONS[b.badge_type] ?? Award;
                return (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                      BADGE_STYLES[b.badge_type] ?? "bg-accent/10 text-accent border-accent/20"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {b.label}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ===== CLASS STREAK ===== */}
      {data?.class_streak != null && data.class_streak > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Активность класса
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-orange-500">
                  {data.class_streak} дней
                </p>
                <p className="text-xs text-muted-foreground">
                  Класс активен уже {data.class_streak} дней подряд
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ===== TOP CONTRIBUTORS ===== */}
      {data?.top_contributors && data.top_contributors.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Топ-3 игроков класса
              <span className="text-xs text-muted-foreground font-normal ml-1">
                за неделю
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.top_contributors.map((contributor, i) => (
                <Link
                  key={contributor.username}
                  href={`/profile/${contributor.username}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-muted",
                    i === 0 ? "border-amber-500/30 bg-amber-500/5" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    {i < 3 ? (
                      <Medal className={cn("h-6 w-6", MEDAL_COLORS[i])} />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <Avatar
                    name={contributor.username}
                    size="sm"
                    className="ring-1 ring-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      @{contributor.username}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-accent tabular-nums">
                    +{contributor.points}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ===== WEEKLY LEADERBOARD ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Рейтинг за неделю
          </CardTitle>
          {data?.week_start ? (
            <CardDescription>
              С {new Date(data.week_start).toLocaleDateString("ru-RU")}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.weekly_leaderboard && data.weekly_leaderboard.length > 0 ? (
            data.weekly_leaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                rank={i + 1}
                name={entry.name}
                slug={entry.slug}
                points={entry.weekly_points}
                maxPoints={data.weekly_leaderboard[0]?.weekly_points ?? 1}
                highlight={i === 0}
              />
            ))
          ) : (
            <EmptyLeaderboard />
          )}
        </CardContent>
      </Card>

      {/* ===== ALL-TIME LEADERBOARD ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Общий рейтинг</CardTitle>
          <CardDescription>За всё время</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.all_time_leaderboard && data.all_time_leaderboard.length > 0 ? (
            data.all_time_leaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                rank={i + 1}
                name={entry.name}
                slug={entry.slug}
                points={entry.total_points}
                maxPoints={data.all_time_leaderboard[0]?.total_points ?? 1}
              />
            ))
          ) : (
            <EmptyLeaderboard />
          )}
        </CardContent>
      </Card>

      {/* ===== RULES ===== */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Как начисляются очки</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Пост — +10 (до 5 в день)</p>
          <p>• Комментарий — +3 (до 20 в день)</p>
          <p>• Лайк — +1 классу (до 50 в день)</p>
          <p>• Лайк на ваш пост — +1 вашему классу</p>
          <p>• Ежедневный вход — +2</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardRow({
  rank,
  name,
  slug,
  points,
  maxPoints,
  highlight,
}: {
  rank: number;
  name: string;
  slug: string;
  points: number;
  maxPoints: number;
  highlight?: boolean;
}) {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  return (
    <Link
      href={`/class-clash/${slug}`}
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted",
        highlight ? "border-accent/50 bg-accent/5" : "border-border"
      )}
    >
      <span
        className={cn(
          "text-xl font-bold w-8",
          rank === 1 ? "text-accent" : "text-muted-foreground"
        )}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{name}</p>
          {rank === 1 ? <Badge>Лидер</Badge> : null}
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-semibold text-accent tabular-nums">
        {points}
      </span>
    </Link>
  );
}

function EmptyLeaderboard() {
  return (
    <p className="text-center text-sm text-muted-foreground py-4">
      Пока нет очков — начните с ленты
    </p>
  );
}