"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  Activity,
  ArrowUp,
  BookOpen,
  Crown,
  Flame,
  Loader2,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FounderDashboardData {
  users: {
    total: number;
    verified: number;
    pending: number;
    online_now: number;
    dau: number;
    wau: number;
    mau: number;
    stickiness_pct: number;
  };
  retention: {
    day_1: number | null;
    day_7: number | null;
    day_30: number | null;
  };
  content: {
    total_posts: number;
    posts_today: number;
    posts_this_week: number;
    posts_this_month: number;
    total_likes: number;
    total_comments: number;
    avg_likes_per_post: number;
    avg_comments_per_post: number;
    top_posts: Array<{
      id: string;
      content: string;
      author_username: string;
      likes_count: number;
      comments_count: number;
      engagement_score: number;
      created_at: string;
    }>;
  };
  classes: {
    total: number;
    active: number;
    active_pct: number;
    top_classes: Array<{
      name: string;
      total_points: number;
      weekly_points: number;
      student_count: number;
    }>;
  };
  growth: Record<string, number>;
  activity: Array<{
    date: string;
    posts: number;
    comments: number;
    likes: number;
    new_users: number;
  }>;
  report_date: string;
}

export function FounderDashboard() {
  const { data, isLoading } = useQuery<FounderDashboardData>({
    queryKey: ["founder-dashboard"],
    queryFn: () => api.get("/admin/dashboard/").then((r) => r.data),
    refetchInterval: 60_000, // auto-refresh every minute
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { users, retention, content, classes: classData, growth, activity } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Founder Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Обновлено: {new Date(data.report_date).toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 text-green-500" />
          <span>Автообновление каждую минуту</span>
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-accent" />
          Пользователи
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard label="Всего" value={users.total.toLocaleString()} icon={Users} />
          <KpiCard label="Подтверждено" value={users.verified.toLocaleString()} icon={Users} accent />
          <KpiCard label="На проверке" value={users.pending.toString()} icon={Users} color="text-amber-500" />
          <KpiCard label="Онлайн" value={users.online_now.toString()} icon={Flame} color="text-green-500" />
          <KpiCard label="DAU" value={users.dau.toLocaleString()} icon={Zap} accent />
          <KpiCard label="WAU" value={users.wau.toLocaleString()} icon={TrendingUp} />
          <KpiCard label="MAU" value={users.mau.toLocaleString()} icon={Users} />
          <KpiCard label="Stickiness" value={`${users.stickiness_pct}%`} icon={Activity} color="text-purple-500" />
        </div>
      </div>

      {/* Retention Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-accent" />
          Удержание (Retention)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <RetentionCard label="Day 1" value={retention.day_1} />
          <RetentionCard label="Day 7" value={retention.day_7} />
          <RetentionCard label="Day 30" value={retention.day_30} />
        </div>
      </div>

      {/* Content Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-accent" />
          Контент
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Всего постов" value={content.total_posts.toLocaleString()} icon={MessageSquare} />
          <KpiCard label="Сегодня" value={content.posts_today.toString()} icon={MessageSquare} accent />
          <KpiCard label="За неделю" value={content.posts_this_week.toString()} icon={MessageSquare} />
          <KpiCard label="За месяц" value={content.posts_this_month.toString()} icon={MessageSquare} />
          <KpiCard label="Лайков" value={content.total_likes.toLocaleString()} icon={ThumbsUp} />
          <KpiCard label="Комментариев" value={content.total_comments.toLocaleString()} icon={MessageCircle} />
          <KpiCard label="Avg лайков/пост" value={content.avg_likes_per_post.toString()} icon={ThumbsUp} />
          <KpiCard label="Avg комм/пост" value={content.avg_comments_per_post.toString()} icon={MessageCircle} />
        </div>

        {/* Top Posts */}
        {content.top_posts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Топ-10 постов по вовлечению
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.top_posts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.content}</p>
                    <p className="text-xs text-muted-foreground">@{post.author_username}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span>❤️ {post.likes_count}</span>
                    <span>💬 {post.comments_count}</span>
                    <span className="text-accent font-medium">{post.engagement_score.toFixed(1)}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Classes Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Crown className="h-5 w-5 text-accent" />
          Классы
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <KpiCard label="Всего классов" value={classData.total.toString()} icon={Crown} />
          <KpiCard label="Активных" value={classData.active.toString()} icon={Activity} accent />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Топ-5 классов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {classData.top_classes.map((cls, i) => (
              <div key={cls.name} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">{cls.student_count} учеников</p>
                </div>
                <div className="text-right text-sm tabular-nums">
                  <p className="font-semibold text-accent">{cls.total_points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{cls.weekly_points} за нед.</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Активность за 30 дней
          </CardTitle>
          <CardDescription>Посты · Комментарии · Лайки · Новые пользователи</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1 min-w-[600px]">
              {activity.map((day) => {
                const maxVal = Math.max(day.posts, day.comments, day.likes, day.new_users, 1);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5" title={day.date}>
                    <div className="flex flex-col items-center gap-px h-24 justify-end">
                      <Bar value={day.posts} max={maxVal} color="bg-blue-500" />
                      <Bar value={day.comments} max={maxVal} color="bg-green-500" />
                      <Bar value={day.likes} max={maxVal} color="bg-purple-500" />
                      <Bar value={day.new_users} max={maxVal} color="bg-amber-500" />
                    </div>
                    <span className="text-[8px] text-muted-foreground">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  accent?: boolean;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="py-3 px-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn("h-3.5 w-3.5", color ?? (accent ? "text-accent" : "text-muted-foreground"))} />
          <span className="text-[10px] text-muted-foreground truncate">{label}</span>
        </div>
        <p className={cn("text-lg font-bold tabular-nums", accent ? "text-accent" : color)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RetentionCard({ label, value }: { label: string; value: number | null }) {
  const color = value === null ? "text-muted-foreground" : value >= 50 ? "text-green-500" : value >= 30 ? "text-amber-500" : "text-red-500";
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-3xl font-bold", color)}>
          {value !== null ? `${value}%` : "—"}
        </p>
      </CardContent>
    </Card>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const height = Math.max(2, (value / max) * 80);
  if (value === 0) return <div className="w-2 h-[2px] bg-transparent" />;
  return (
    <div
      className={cn("w-2 rounded-sm", color)}
      style={{ height: `${height}px` }}
      title={value.toString()}
    />
  );
}