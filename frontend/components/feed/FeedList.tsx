"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/services/posts.service";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { RecommendationsBlock } from "./RecommendationsBlock";
import { Button } from "@/ui/button";

export function FeedList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.next ? pages.length + 1 : undefined,
  });

  const posts = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <CreatePost />
      <RecommendationsBlock />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-3xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-center text-muted-foreground py-12">
          Не удалось загрузить ленту. Проверьте backend.
        </p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-border">
          <p className="text-lg font-medium">Пока тихо</p>
          <p className="text-sm text-muted-foreground mt-1">
            Создайте первый пост в вашей школе
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
                Загрузить ещё
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
