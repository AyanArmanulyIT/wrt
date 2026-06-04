"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Calendar,
  Flame,
  Zap,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Avatar } from "@/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { API_URL } from "@/lib/constants";
import type { PublicProfile } from "@/services/profile.service";

const ACTION_LABELS: Record<string, string> = {
  post: "Посты",
  comment: "Комментарии",
  like_given: "Лайки",
  like_received: "Лайки на постах",
  daily_login: "Входы",
};

const CATEGORY_COLORS: Record<string, string> = {
  social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  content: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  streak: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  class: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  special: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

// Skeleton components
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ""}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <div className="rounded-3xl border border-border p-6 bg-card">
        <div className="flex items-start gap-5">
          <SkeletonBlock className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-full max-w-sm" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const currentUser = useAuthStore((s) => s.user);
  const isOwn = currentUser?.profile?.username?.toLowerCase() === username.toLowerCase();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    const token = localStorage.getItem("wrt_access");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API_URL}/auth/profile/${encodeURIComponent(username)}/?t=${Date.now()}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: PublicProfile) => {
        setProfile(data);
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <p className="text-muted-foreground text-lg">Пользователь не найден</p>
        <Link href="/feed" className="text-accent mt-4 inline-block hover:underline">
          Вернуться в ленту
        </Link>
      </div>
    );
  }

  const theme = profile.theme;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 stagger-enter">
      {/* Profile Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 card-hover ${theme ? "" : "bg-card text-card-foreground"}`}
        style={{
          borderColor: theme?.card_border ?? undefined,
          background: theme
            ? `linear-gradient(135deg, ${theme.gradient_from}, ${theme.gradient_to})`
            : undefined,
        }}
      >
        {theme && (
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: theme.primary_color }}
          />
        )}

        <div className="relative flex items-start gap-5">
          <Avatar
            name={profile.username}
            src={profile.avatar}
            size="lg"
            className="ring-2 ring-white/10"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : `@${profile.username}`}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base text-muted-foreground/80 font-medium">
                @{profile.username}
              </span>
              {(profile.is_verified || profile.is_staff) && (
                <BadgeCheck className="h-4 w-4 text-foreground shrink-0" />
              )}
              {isOwn && (
                <span className="ml-2 text-xs rounded-full border border-foreground/20 px-2 py-0.5 text-muted-foreground">
                  Это вы
                </span>
              )}
            </div>
            {(profile.school_name || profile.class_name) && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {profile.class_name ? `${profile.class_name} · ` : ""}
                {profile.school_name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed text-pretty">
              {profile.bio || "Био пока пустует"}
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-4 gap-2">
          <ProfileStat label="Посты" value={profile.posts_count} />
          <ProfileStat label="Коммент." value={profile.comments_count} />
          <ProfileStat label="Лайки" value={profile.likes_received} />
          <ProfileStat label="Очки" value={profile.total_points} />
        </div>
      </div>

      {/* Streak */}
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Серия
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.streak ? (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-muted p-4 elevate-hover">
                <p className="text-3xl font-bold text-orange-500">{profile.streak.current_streak}</p>
                <p className="text-xs text-muted-foreground mt-1">Текущая серия</p>
              </div>
              <div className="rounded-2xl bg-muted p-4 elevate-hover">
                <p className="text-3xl font-bold text-accent">{profile.streak.longest_streak}</p>
                <p className="text-xs text-muted-foreground mt-1">Лучшая серия</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3">Нет данных о сериях</p>
          )}
        </CardContent>
      </Card>

      {/* Class Clash Contribution */}
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Вклад в Class Clash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted p-4 text-center elevate-hover">
              <p className="text-2xl font-bold text-accent">{profile.week_points}</p>
              <p className="text-xs text-muted-foreground mt-1">За неделю</p>
            </div>
            <div className="rounded-2xl bg-muted p-4 text-center elevate-hover">
              <p className="text-2xl font-bold">{profile.class_rank}/{profile.class_total}</p>
              <p className="text-xs text-muted-foreground mt-1">Рейтинг класса</p>
            </div>
          </div>
          {Object.keys(profile.contribution_by_action).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">По действиям</p>
              {Object.entries(profile.contribution_by_action).map(([action, pts]) => (
                <div key={action} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0 hover:bg-muted/50 px-2 -mx-2 rounded-lg transition-colors">
                  <span>{ACTION_LABELS[action] ?? action}</span>
                  <span className="font-medium text-accent">+{pts}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Достижения
            {profile.achievements.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal ml-1">({profile.achievements.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пока нет достижений — активность в ленте и Class Clash поможет их получить!
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 stagger-enter">
              {profile.achievements.map((ua) => (
                <div key={ua.achievement.slug} className={`flex items-start gap-3 rounded-2xl border p-3 elevate-hover ${CATEGORY_COLORS[ua.achievement.category] ?? "bg-accent/5 text-accent border-accent/20"}`}>
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-black/10">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{ua.achievement.name}</p>
                    <p className="text-xs opacity-70 mt-0.5">{ua.achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join Date */}
      <p className="text-center text-xs text-muted-foreground animate-fade-in">
        <Calendar className="inline h-3 w-3 mr-1" />
        В WRT с{" "}
        {new Date(profile.created_at).toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted p-3 text-center elevate-hover">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}