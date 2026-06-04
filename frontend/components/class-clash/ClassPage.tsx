"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  Award,
  ChevronLeft,
  Crown,
  Flame,
  History,
  Loader2,
  Medal,
  Swords,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  MessageSquare,
  Star,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  fetchClassDetail,
  fetchClassStats,
  fetchClassMembers,
  fetchClassAchievements,
  fetchClassSeasonHistory,
  fetchClassTopPlayers,
  fetchClassFeed,
  type ClassDetailData,
  type ClassStatsData,
  type ClassMember,
  type ClassAchievementsData,
  type SeasonHistoryEntry,
  type TopPlayer,
  type ClassFeedPost,
} from "@/services/classClash.service";

const TABS = [
  { id: "feed", label: "Лента класса", icon: MessageSquare },
  { id: "stats", label: "Статистика", icon: TrendingUp },
  { id: "members", label: "Участники", icon: Users },
  { id: "achievements", label: "Достижения", icon: Award },
  { id: "history", label: "История сезонов", icon: History },
  { id: "top-players", label: "Топ игроков", icon: Crown },
];

const ACTION_LABELS: Record<string, string> = {
  post: "Посты",
  comment: "Комментарии",
  like_given: "Лайки (поставленные)",
  like_received: "Лайки (полученные)",
  daily_login: "Ежедневные входы",
};

export function ClassPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const activeTab = searchParams?.get("tab") ?? "feed";

  const { data: classDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["class-detail", slug],
    queryFn: () => fetchClassDetail(slug),
    enabled: !!slug,
  });

  const { data: stats } = useQuery({
    queryKey: ["class-stats", slug],
    queryFn: () => fetchClassStats(slug),
    enabled: !!slug && activeTab === "stats",
  });

  const { data: members } = useQuery({
    queryKey: ["class-members", slug],
    queryFn: () => fetchClassMembers(slug),
    enabled: !!slug && activeTab === "members",
  });

  const { data: achievements } = useQuery({
    queryKey: ["class-achievements", slug],
    queryFn: () => fetchClassAchievements(slug),
    enabled: !!slug && activeTab === "achievements",
  });

  const { data: history } = useQuery({
    queryKey: ["class-history", slug],
    queryFn: () => fetchClassSeasonHistory(slug),
    enabled: !!slug && activeTab === "history",
  });

  const { data: topPlayers } = useQuery({
    queryKey: ["class-top-players", slug],
    queryFn: () => fetchClassTopPlayers(slug),
    enabled: !!slug && activeTab === "top-players",
  });

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!classDetail) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Swords className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Класс не найден</h2>
        <p className="text-muted-foreground mb-6">
          Такого класса нет в вашей школе
        </p>
        <Link
          href="/class-clash"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад к Class Clash
        </Link>
      </div>
    );
  }

  const setTab = (tab: string) => {
    router.push(`/class-clash/${slug}?tab=${tab}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/class-clash"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Class Clash
      </Link>

      {/* Class header */}
      <ClassHeader detail={classDetail} />

      {/* Tab navigation */}
      <div className="flex overflow-x-auto gap-1 pb-2 -mx-4 px-4 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-foreground text-background shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "feed" && <ClassFeedTab slug={slug} />}
        {activeTab === "stats" && <ClassStatsTab stats={stats} />}
        {activeTab === "members" && <ClassMembersTab members={members} />}
        {activeTab === "achievements" && (
          <ClassAchievementsTab achievements={achievements} />
        )}
        {activeTab === "history" && <ClassHistoryTab history={history} />}
        {activeTab === "top-players" && (
          <ClassTopPlayersTab players={topPlayers} />
        )}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function ClassHeader({ detail }: { detail: ClassDetailData }) {
  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Swords className="h-6 w-6 text-accent" />
              <h1 className="text-3xl font-bold">{detail.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {detail.student_count} участников
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-lg font-bold text-accent">
              <Zap className="h-5 w-5" />
              <span>{detail.total_points}</span>
            </div>
            <p className="text-xs text-muted-foreground">всего очков</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{detail.weekly_points} за неделю</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassFeedTab({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["class-feed", slug],
    queryFn: () => fetchClassFeed(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Лента класса
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  const posts = data?.results ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          Лента класса
        </CardTitle>
        <CardDescription>
          Посты и активность класса
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            В классе пока нет постов
          </p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <ClassFeedCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClassFeedCard({ post }: { post: ClassFeedPost }) {
  const timeAgo = formatRelativeTime(post.created_at);
  return (
    <Link
      href={`/post/${post.id}`}
      className="block rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          name={post.author_username}
          src={post.author_avatar}
          size="sm"
          className="ring-1 ring-white/10"
        />
        <span className="text-sm font-medium">@{post.author_username}</span>
        <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line line-clamp-4">
        {post.content}
      </p>
      {post.image && (
        <div className="mt-3 rounded-xl overflow-hidden bg-muted">
          <img
            src={post.image}
            alt=""
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>❤️ {post.likes_count}</span>
        <span>💬 {post.comments_count}</span>
      </div>
    </Link>
  );
}

function ClassStatsTab({ stats }: { stats: ClassStatsData | undefined }) {
  if (!stats) {
    return <LoadingSkeleton />;
  }

  const actionColorMap: Record<string, string> = {
    post: "bg-blue-500",
    comment: "bg-green-500",
    like_given: "bg-purple-500",
    like_received: "bg-pink-500",
    daily_login: "bg-orange-500",
  };

  const maxPoints = Math.max(
    ...Object.values(stats.weekly_by_action).map((a) => a.points),
    1
  );

  return (
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="Всего очков"
          value={stats.total_points}
          accent
        />
        <StatCard
          icon={TrendingUp}
          label="За неделю"
          value={stats.weekly_points}
        />
        <StatCard
          icon={Flame}
          label="Стрик (дней)"
          value={stats.streak_days}
          color="text-orange-500"
        />
        <StatCard
          icon={Users}
          label="Участников"
          value={stats.member_count}
        />
      </div>

      {/* Activity breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Активность за неделю
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(stats.weekly_by_action).length > 0 ? (
            Object.entries(stats.weekly_by_action).map(([action, data]) => (
              <div key={action} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {ACTION_LABELS[action] ?? action}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {data.count} раз
                    </span>
                    <span className="font-semibold tabular-nums">
                      +{data.points}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      actionColorMap[action] ?? "bg-accent"
                    )}
                    style={{
                      width: `${(data.points / maxPoints) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет активности за эту неделю
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total counts */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStatCard label="Постов" value={stats.total_posts} />
        <MiniStatCard label="Комментариев" value={stats.total_comments} />
        <MiniStatCard label="Лайков" value={stats.total_likes} />
      </div>
    </div>
  );
}

function ClassMembersTab({ members }: { members: ClassMember[] | undefined }) {
  if (!members) {
    return <LoadingSkeleton />;
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          В этом классе пока нет участников
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <Link
          key={member.username}
          href={`/profile/${member.username}`}
          className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted"
        >
          <Avatar
            name={member.username}
            src={member.avatar}
            size="md"
            className="ring-1 ring-white/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">
                {member.first_name || member.last_name
                  ? `${member.first_name} ${member.last_name}`
                  : `@${member.username}`}
              </p>
              {member.is_moderator && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary/50 text-secondary-foreground">
                  Модератор
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{member.username}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-accent tabular-nums">
              {member.total_points}
            </p>
            <p className="text-xs text-muted-foreground">очков</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ClassAchievementsTab({
  achievements,
}: {
  achievements: ClassAchievementsData | undefined;
}) {
  if (!achievements) {
    return <LoadingSkeleton />;
  }

  const BADGE_STYLES: Record<string, string> = {
    most_active: "bg-orange-500/15 text-orange-500 border-orange-500/25",
    fastest_growing: "bg-blue-500/15 text-blue-500 border-blue-500/25",
    number_one: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  };

  const BADGE_ICONS: Record<string, typeof Medal> = {
    most_active: Flame,
    fastest_growing: TrendingUp,
    number_one: Crown,
  };

  return (
    <div className="space-y-4">
      {/* Class badges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="h-5 w-5 text-accent" />
            Значки класса
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {achievements.badges.map((badge, i) => {
                const Icon = BADGE_ICONS[badge.type] ?? Award;
                return (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                      BADGE_STYLES[badge.type] ??
                        "bg-accent/10 text-accent border-accent/20"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {badge.label}
                    {badge.season_number != null && (
                      <span className="opacity-60">
                        S{badge.season_number}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              У класса пока нет значков
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent member achievements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            Последние достижения участников
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.recent_member_achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.recent_member_achievements.map((ach, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ach.achievement_name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{ach.username}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ach.unlocked_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пока нет достижений
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClassHistoryTab({
  history,
}: {
  history: SeasonHistoryEntry[] | undefined;
}) {
  if (!history) {
    return <LoadingSkeleton />;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          История сезонов пока пуста
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((season) => (
        <Card key={season.season_number}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">{season.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Сезон #{season.season_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-accent tabular-nums">
                  {season.total_points}
                </p>
                <p className="text-xs text-muted-foreground">всего очков</p>
              </div>
            </div>

            {season.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {season.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClassTopPlayersTab({
  players,
}: {
  players: TopPlayer[] | undefined;
}) {
  if (!players) {
    return <LoadingSkeleton />;
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Пока нет данных об игроках
        </CardContent>
      </Card>
    );
  }

  const MEDAL_COLORS = ["text-amber-400", "text-gray-400", "text-amber-700"];

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <Link
          key={player.username}
          href={`/profile/${player.username}`}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-muted",
            player.rank === 1
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8">
            {player.rank <= 3 ? (
              <Medal className={cn("h-6 w-6", MEDAL_COLORS[player.rank - 1])} />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {player.rank}
              </span>
            )}
          </div>
          <Avatar
            name={player.username}
            src={player.avatar}
            size="md"
            className="ring-1 ring-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {player.first_name || player.last_name
                ? `${player.first_name} ${player.last_name}`
                : `@${player.username}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {player.posts_count} постов · {player.comments_count} комментариев
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-accent tabular-nums">
              {player.total_points}
            </p>
            <p className="text-xs text-muted-foreground">
              +{player.week_points} за неделю
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---- Shared helpers ----

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: number | string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon
            className={cn("h-4 w-4", color ?? (accent ? "text-accent" : "text-muted-foreground"))}
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p
          className={cn(
            "text-xl font-bold tabular-nums",
            accent ? "text-accent" : color
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="py-3 text-center">
        <p className="text-lg font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}