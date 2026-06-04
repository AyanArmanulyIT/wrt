"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Loader2,
  Medal,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchClassLevel,
  fetchQuests,
  fetchStreakRewards,
  fetchAchievementProgress,
  type ClassLevelData,
  type QuestData,
  type StreakRewardsData,
  type ClassAchievementProgress,
} from "@/services/classClash.service";

export function ClassLevelCard() {
  const { data: level, isLoading } = useQuery({
    queryKey: ["class-level"],
    queryFn: fetchClassLevel,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!level) return null;

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-accent" />
              <span className="text-xs font-medium text-accent uppercase tracking-wider">
                Уровень класса
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{level.level}</span>
              <span className="text-sm text-muted-foreground">{level.title}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{level.total_points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">всего очков</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        {level.next_level_points != null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>До следующего уровня</span>
              <span className="tabular-nums">{level.progress_pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-accent/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-700"
                style={{ width: `${level.progress_pct}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuestsCard() {
  const { data: quests, isLoading } = useQuery({
    queryKey: ["quests"],
    queryFn: fetchQuests,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const daily = quests?.daily ?? [];
  const weekly = quests?.weekly ?? [];
  const dailyCompleted = daily.filter((q) => q.completed).length;
  const weeklyCompleted = weekly.filter((q) => q.completed).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          Задания
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Quests */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ежедневные
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {dailyCompleted}/{daily.length}
            </span>
          </div>
          <div className="space-y-2">
            {daily.map((quest) => (
              <QuestRow key={quest.id} quest={quest} />
            ))}
          </div>
        </div>

        {/* Weekly Quests */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Еженедельные
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {weeklyCompleted}/{weekly.length}
            </span>
          </div>
          <div className="space-y-2">
            {weekly.map((quest) => (
              <QuestRow key={quest.id} quest={quest} />
            ))}
          </div>
        </div>

        {daily.length === 0 && weekly.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Начните активничать, чтобы получить задания!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuestRow({ quest }: { quest: QuestData }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
  const Icon = getIcon(quest.icon);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all",
        quest.completed
          ? "border-green-500/30 bg-green-500/5"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          quest.completed
            ? "bg-green-500/10 text-green-500"
            : "bg-muted text-muted-foreground"
        )}
      >
        {quest.completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{quest.title}</span>
          {quest.completed && (
            <Badge className="text-[10px] px-1.5 py-0">Готово</Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">{quest.description}</span>
          <span className="text-xs font-medium text-accent tabular-nums ml-2">
            +{quest.reward}
          </span>
        </div>
        {!quest.completed && (
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function StreakRewardsCard() {
  const { data: streak, isLoading } = useQuery({
    queryKey: ["streak-rewards"],
    queryFn: fetchStreakRewards,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  const nextMilestone = streak.milestones?.find((m) => !m.reached);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Награды за стрик
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current streak */}
        <div className="flex items-center gap-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 mb-3">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-lg font-bold text-orange-500 tabular-nums">
              {streak.current_streak} дн.
            </p>
            <p className="text-xs text-muted-foreground">
              Текущая серия
            </p>
          </div>
          {nextMilestone && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">До {nextMilestone.days} дн.</p>
              <p className="text-xs font-medium text-accent">+{nextMilestone.reward}</p>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          {streak.milestones?.map((milestone) => (
            <div
              key={milestone.days}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                milestone.reached
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border opacity-60"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm",
                  milestone.reached
                    ? "bg-green-500/10 text-green-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {milestone.reached ? "✓" : milestone.days}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{milestone.title}</p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      milestone.reached ? "bg-green-500" : "bg-accent/50"
                    )}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-accent tabular-nums">
                +{milestone.reward}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementProgressCard() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ["achievement-progress"],
    queryFn: fetchAchievementProgress,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const achievements = progress?.achievements ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-500" />
          Достижения класса
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {achievements.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Достижения появятся по мере активности класса
          </p>
        ) : (
          achievements.map((ach) => (
            <div
              key={ach.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                ach.earned
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-border"
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  ach.earned
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {ach.earned ? (
                  <Medal className="h-5 w-5" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{ach.title}</span>
                  {ach.earned && (
                    <Badge className="text-[10px] px-1.5 py-0">Получено</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
                {!ach.earned && ach.target > 0 && (
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500/70 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((ach.progress / ach.target) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function getIcon(name: string) {
  const icons: Record<string, typeof Zap> = {
    MessageSquare: Zap,
    Heart: Zap,
    MessageCircle: Zap,
    Zap: Zap,
    FileText: Zap,
    ThumbsUp: Zap,
    TrendingUp: Zap,
  };
  return icons[name] ?? Zap;
}