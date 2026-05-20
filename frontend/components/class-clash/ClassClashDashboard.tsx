"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Zap, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchClassOfWeek,
  fetchLeaderboard,
  fetchMyContribution,
  fetchWeeklyLeaderboard,
} from "@/services/classClash.service";

const ACTION_LABELS: Record<string, string> = {
  post: "Посты",
  comment: "Комментарии",
  like_given: "Лайки",
  like_received: "Лайки на постах",
  daily_login: "Входы",
};

export function ClassClashDashboard() {
  const { data: classOfWeek } = useQuery({
    queryKey: ["class-of-week"],
    queryFn: fetchClassOfWeek,
  });

  const { data: weekly, isLoading: weeklyLoading } = useQuery({
    queryKey: ["clash-weekly"],
    queryFn: fetchWeeklyLeaderboard,
  });

  const { data: allTime, isLoading: allLoading } = useQuery({
    queryKey: ["clash-leaderboard"],
    queryFn: fetchLeaderboard,
  });

  const { data: contribution } = useQuery({
    queryKey: ["my-contribution"],
    queryFn: fetchMyContribution,
  });

  const maxWeekly = weekly?.results[0]?.weekly_points ?? 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {classOfWeek?.class ? (
        <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-3xl bg-accent flex items-center justify-center text-accent-foreground">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Класс недели</p>
              <p className="text-2xl font-bold">{classOfWeek.class.name}</p>
              <p className="text-sm text-accent font-medium">
                {classOfWeek.class.weekly_points} очков за неделю
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Класс недели появится, когда классы начнут набирать очки
          </CardContent>
        </Card>
      )}

      {contribution ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Ваш вклад
            </CardTitle>
            <CardDescription>
              {contribution.class_name
                ? `Класс ${contribution.class_name}`
                : "Выберите класс в профиле"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-muted p-3 text-center">
                <p className="text-2xl font-bold text-accent">
                  {contribution.week_points}
                </p>
                <p className="text-xs text-muted-foreground">За неделю</p>
              </div>
              <div className="rounded-2xl bg-muted p-3 text-center">
                <p className="text-2xl font-bold">{contribution.total_points}</p>
                <p className="text-xs text-muted-foreground">Всего</p>
              </div>
            </div>
            {Object.keys(contribution.by_action).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(contribution.by_action).map(([action, pts]) => (
                  <div
                    key={action}
                    className="flex justify-between text-sm py-1 border-b border-border last:border-0"
                  >
                    <span>{ACTION_LABELS[action] ?? action}</span>
                    <span className="font-medium">+{pts}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Создайте пост или поставьте лайк, чтобы заработать очки
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Рейтинг за неделю
          </CardTitle>
          {weekly?.week_start ? (
            <CardDescription>
              С {new Date(weekly.week_start).toLocaleDateString("ru-RU")}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyLoading ? (
            <LeaderboardSkeleton />
          ) : (
            weekly?.results.map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                rank={i + 1}
                name={entry.name}
                points={entry.weekly_points}
                maxPoints={maxWeekly}
                highlight={i === 0}
              />
            ))
          )}
          {!weeklyLoading && weekly?.results.length === 0 ? (
            <EmptyLeaderboard />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Общий рейтинг</CardTitle>
          <CardDescription>За всё время</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allLoading ? (
            <LeaderboardSkeleton />
          ) : (
            allTime?.map((entry, i) => (
              <LeaderboardRow
                key={entry.id}
                rank={i + 1}
                name={entry.name}
                points={entry.total_points}
                maxPoints={allTime[0]?.total_points ?? 1}
              />
            ))
          )}
          {!allLoading && allTime?.length === 0 ? <EmptyLeaderboard /> : null}
        </CardContent>
      </Card>

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
  points,
  maxPoints,
  highlight,
}: {
  rank: number;
  name: string;
  points: number;
  maxPoints: number;
  highlight?: boolean;
}) {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 transition-colors",
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
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
      ))}
    </>
  );
}

function EmptyLeaderboard() {
  return (
    <p className="text-center text-sm text-muted-foreground py-4">
      Пока нет очков — начните с ленты
    </p>
  );
}
