"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  fetchFeedNew,
  fetchFeedTrending,
  fetchFeedClass,
  fetchPinnedPosts,
  fetchHotTopics,
  fetchClassRank,
} from "@/services/posts.service";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Flame, Sparkles, School, Trophy, Pin, TrendingUp } from "lucide-react";

// Lazy load - actual PostCard is now size-optimized
const CreatePost = dynamic(() => import("./CreatePost").then(m => ({ default: m.CreatePost })), {
  loading: () => <SkeletonPost />,
  ssr: false,
});
const PostCard = dynamic(() => import("./PostCard").then(m => ({ default: m.PostCard })), {
  loading: () => <SkeletonPost />,
});
const RecommendationsBlock = dynamic(
  () => import("./RecommendationsBlock").then(m => ({ default: m.RecommendationsBlock })),
  { ssr: false }
);
const MediaViewer = dynamic(
  () => import("@/components/media/MediaViewer").then(m => ({ default: m.MediaViewer })),
  { ssr: false }
);

type Tab = "new" | "trending" | "class";

const TABS: { key: Tab; label: string; icon: typeof Sparkles }[] = [
  { key: "trending", label: "Популярное", icon: Flame },
  { key: "new", label: "Новое", icon: Sparkles },
  { key: "class", label: "Мой класс", icon: School },
];

function SkeletonPost() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
      <div className="h-48 bg-muted rounded-2xl" />
    </div>
  );
}

export const FeedList = memo(function FeedList() {
  const [tab, setTab] = useState<Tab>("new");
  const [mediaPost, setMediaPost] = useState<any>(null);
  const user = useAuthStore((s) => s.user);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Pinned posts
  const { data: pinnedPosts = [] } = useQuery({
    queryKey: ["feed-pinned"],
    queryFn: fetchPinnedPosts,
    staleTime: 30_000,
  });

  // Hot topics
  const { data: hotTopics = [] } = useQuery({
    queryKey: ["hot-topics"],
    queryFn: fetchHotTopics,
    staleTime: 60_000,
  });

  // Class rank
  const { data: classRank } = useQuery({
    queryKey: ["class-rank"],
    queryFn: fetchClassRank,
    staleTime: 30_000,
  });

  const feedQueryFn = useCallback(async ({ pageParam = 1 }: { pageParam?: number }) => {
    switch (tab) {
      case "trending":
        return fetchFeedTrending();
      case "class":
        return fetchFeedClass();
      default:
        return fetchFeedNew(pageParam);
    }
  }, [tab]);

  const getNextPageParam = useCallback((lastPage: any, pages: any[]) => {
    return tab === "new" && lastPage.next ? pages.length + 1 : undefined;
  }, [tab]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["feed", tab],
    queryFn: feedQueryFn,
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const posts = data?.pages?.flatMap((p: any) => p.results ?? []) ?? [];

  // Infinite scroll with cleanup
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleImageClick = useCallback((post: any) => {
    setMediaPost(post);
  }, []);

  const handleCloseMedia = useCallback(() => {
    setMediaPost(null);
  }, []);

  // Media viewer data
  const mediaViewerData = mediaPost?.image ? {
    images: [{
      src: mediaPost.image,
      postId: mediaPost.id,
      authorUsername: mediaPost.author?.username ?? "unknown",
      authorAvatar: mediaPost.author?.avatar,
      content: mediaPost.content,
      likesCount: mediaPost.likes_count,
      commentsCount: mediaPost.comments_count,
      createdAt: mediaPost.created_at,
    }],
    initialIndex: 0,
    onClose: handleCloseMedia,
  } : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      <CreatePost />

      {/* Class Rank Card */}
      {classRank && (
        <div className="rounded-2xl border border-border bg-card p-4 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {classRank.class_name} — #{classRank.rank}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {classRank.total_points.toLocaleString()} очков
                </p>
              </div>
            </div>
            {classRank.next_class && (
              <div className="text-right text-xs text-muted-foreground shrink-0 ml-2">
                <p className="truncate">До {classRank.next_class}</p>
                <p className="text-amber-500 font-medium">+{classRank.gap_to_next}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hot Topics */}
      {hotTopics.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
            <span>Сегодня обсуждают:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotTopics.map((topic) => (
              <span
                key={topic.text}
                className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer"
              >
                {topic.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          {pinnedPosts.map((post) => (
            <div key={post.id} className="relative">
              <div className="absolute -left-1 -top-1 z-10">
                <Pin className="h-4 w-4 text-accent" />
              </div>
              <PostCard post={post} onImageClick={handleImageClick} />
            </div>
          ))}
        </div>
      )}

      <RecommendationsBlock />

      {/* Feed Tabs */}
      <div className="flex gap-1 rounded-2xl bg-muted p-1 sticky top-0 z-10" role="tablist">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center",
              tab === key
                ? "bg-foreground text-background shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="space-y-4 mt-2" aria-label="Загрузка постов">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16" role="alert">
          <p className="text-muted-foreground">Не удалось загрузить ленту</p>
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            className="mt-4"
          >
            Попробовать снова
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-border mt-2">
          <p className="text-lg font-medium">Пока тихо</p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "class"
              ? "В вашем классе ещё нет постов"
              : "Создайте первый пост в вашей школе"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post: any, idx: number) => (
              <div key={post.id}>
                <PostCard post={post} onImageClick={handleImageClick} />
              </div>
            ))}
          </div>
          <div ref={loadMoreRef} className="h-10" />
          {isFetchingNextPage && (
            <div className="flex justify-center pt-2">
              <div className="skeleton h-8 w-32 rounded-xl" />
            </div>
          )}
          {!hasNextPage && posts.length > 0 && (
            <p className="text-center text-xs text-muted-foreground pt-4">
              Все посты загружены
            </p>
          )}
        </>
      )}

      {/* Media Viewer */}
      {mediaViewerData && (
        <MediaViewer
          images={mediaViewerData.images}
          initialIndex={mediaViewerData.initialIndex}
          onClose={mediaViewerData.onClose}
        />
      )}
    </div>
  );
});