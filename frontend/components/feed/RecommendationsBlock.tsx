"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Avatar } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { fetchRecommendations } from "@/services/recommendations.service";
import { PostCard } from "./PostCard";

export function RecommendationsBlock() {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mb-4 h-32 rounded-3xl bg-muted animate-pulse" />
    );
  }

  if (!data) return null;

  const hasContent =
    data.popular_posts.length > 0 ||
    data.trending_users.length > 0 ||
    data.active_classes.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mb-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground px-1">
        Рекомендации для вас
      </h2>

      {data.active_classes.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Активные классы
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.active_classes.map((c, i) => (
              <Link key={c.id} href="/class-clash">
                <Badge
                  className={
                    i === 0
                      ? "bg-accent text-accent-foreground px-3 py-1.5 text-sm"
                      : "px-3 py-1.5 text-sm"
                  }
                >
                  {c.name} · {c.weekly_points} очк.
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data.trending_users.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Популярные в школе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.trending_users.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.username}`}
                className="flex items-center gap-3 rounded-2xl p-2 hover:bg-muted transition-colors"
              >
                <Avatar name={u.username} src={u.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">@{u.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.total_points} очков · {u.posts_count} постов
                  </p>
                </div>
                {u.class_name ? <Badge>{u.class_name}</Badge> : null}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data.popular_posts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-base font-semibold">Популярные посты</span>
          </div>
          {data.popular_posts.map((post) => (
            <PostCard key={`rec-${post.id}`} post={post} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
