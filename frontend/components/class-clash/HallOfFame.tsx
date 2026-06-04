"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Award,
  Crown,
  Flame,
  Loader2,
  Medal,
  Star,
  Trophy,
  TrendingUp,
  MessageSquare,
  Heart,
  Zap,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  fetchHallOfFame,
  type HallOfFameData,
} from "@/services/classClash.service";

export function HallOfFame() {
  const { data, isLoading } = useQuery({
    queryKey: ["hall-of-fame"],
    queryFn: fetchHallOfFame,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-7 w-7 text-amber-500" />
          <h1 className="text-3xl font-bold">Hall of Fame</h1>
          <Sparkles className="h-7 w-7 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Лучшие ученики, классы и посты вашей школы
        </p>
      </div>

      <div className="grid gap-4">
        {/* 🏆 Best Class of the Month */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-3xl bg-amber-500 flex items-center justify-center text-white shrink-0">
              <Trophy className="h-8 w-8" />
            </div>
            {data?.best_class_month ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-500 font-medium uppercase tracking-wider mb-0.5">
                  🏆 Лучший класс месяца
                </p>
                <Link
                  href={`/class-clash/${data.best_class_month.slug}`}
                  className="text-xl font-bold hover:underline"
                >
                  {data.best_class_month.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-amber-500 font-medium">
                  <Zap className="h-4 w-4" />
                  <span>{data.best_class_month.points} очков</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">🏆 Лучший класс месяца</p>
                <p className="text-xs mt-0.5">Пока нет данных</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 👑 Best Student of the Month */}
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent overflow-hidden">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-3xl bg-blue-500 flex items-center justify-center text-white shrink-0">
              <Crown className="h-8 w-8" />
            </div>
            {data?.best_student_month ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wider mb-0.5">
                  👑 Лучший ученик месяца
                </p>
                <div className="flex items-center gap-2">
                  <Avatar
                    name={data.best_student_month.username}
                    src={data.best_student_month.avatar}
                    size="md"
                    className="ring-2 ring-blue-500/30"
                  />
                  <div>
                    <Link
                      href={`/profile/${data.best_student_month.username}`}
                      className="text-lg font-bold hover:underline"
                    >
                      {data.best_student_month.first_name || data.best_student_month.last_name
                        ? `${data.best_student_month.first_name} ${data.best_student_month.last_name}`
                        : `@${data.best_student_month.username}`}
                    </Link>
                    {data.best_student_month.class_name && (
                      <p className="text-xs text-muted-foreground">
                        {data.best_student_month.class_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-blue-500 font-medium">
                  <Zap className="h-4 w-4" />
                  <span>+{data.best_student_month.points} очков за месяц</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">👑 Лучший ученик месяца</p>
                <p className="text-xs mt-0.5">Пока нет данных</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 🔥 Most Active User */}
        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent overflow-hidden">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-3xl bg-orange-500 flex items-center justify-center text-white shrink-0">
              <Flame className="h-8 w-8" />
            </div>
            {data?.most_active_user ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-orange-500 font-medium uppercase tracking-wider mb-0.5">
                  🔥 Самый активный пользователь
                </p>
                <div className="flex items-center gap-2">
                  <Avatar
                    name={data.most_active_user.username}
                    src={data.most_active_user.avatar}
                    size="md"
                    className="ring-2 ring-orange-500/30"
                  />
                  <div>
                    <Link
                      href={`/profile/${data.most_active_user.username}`}
                      className="text-lg font-bold hover:underline"
                    >
                      {data.most_active_user.first_name || data.most_active_user.last_name
                        ? `${data.most_active_user.first_name} ${data.most_active_user.last_name}`
                        : `@${data.most_active_user.username}`}
                    </Link>
                    {data.most_active_user.class_name && (
                      <p className="text-xs text-muted-foreground">
                        {data.most_active_user.class_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-orange-500 font-medium flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    Стрик {data.most_active_user.streak} дн.
                  </span>
                  <span className="text-muted-foreground">
                    +{data.most_active_user.week_points} за неделю
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">🔥 Самый активный пользователь</p>
                <p className="text-xs mt-0.5">Пока нет данных</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ⭐ Best Post of the Week */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent overflow-hidden">
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="h-14 w-14 rounded-3xl bg-purple-500 flex items-center justify-center text-white shrink-0">
              <Star className="h-8 w-8" />
            </div>
            {data?.best_post_week ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-500 font-medium uppercase tracking-wider mb-0.5">
                  ⭐ Лучший пост недели
                </p>
                <Link
                  href={`/post/${data.best_post_week.id}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm leading-relaxed line-clamp-3 mb-2">
                    {data.best_post_week.content}
                  </p>
                </Link>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    name={data.best_post_week.author_username}
                    src={data.best_post_week.author_avatar}
                    size="sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    @{data.best_post_week.author_username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {formatRelativeTime(data.best_post_week.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {data.best_post_week.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {data.best_post_week.comments_count}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">⭐ Лучший пост недели</p>
                <p className="text-xs mt-0.5">Пока нет данных</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}