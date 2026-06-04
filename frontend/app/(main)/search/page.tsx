"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Sparkles, X, Heart, MessageCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { fetchFeed } from "@/services/posts.service";

const SUGGESTIONS = [
  "новости",
  "вопросы",
  "Class Clash",
  "школа",
  "подготовка",
  "разговор",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Дебаунс ввода для оптимизации количества запросов к бэкенду
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["search-posts", debouncedQuery],
    queryFn: ({ pageParam }) => fetchFeed(pageParam, debouncedQuery),
    initialPageParam: 1,
    enabled: debouncedQuery.length > 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.next ? pages.length + 1 : undefined,
  });

  const posts = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Шапка и поисковая строка */}
      <Card className="border-border shadow-soft overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent/40 via-primary to-accent/40" />
        <CardHeader className="pb-4 pt-8">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-accent" />
            Поиск постов
          </CardTitle>
          <CardDescription>
            Введите ключевые слова, темы или имя пользователя для поиска по вашей школе.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Что вы хотите найти?"
              className="pl-12 pr-10 h-12 text-base rounded-2xl bg-muted/30 border-border/80 focus:bg-card transition-all"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Очистить поиск"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Контент поиска */}
      {debouncedQuery.length === 0 ? (
        /* Начальное состояние (Рекомендации) */
        <Card className="border-border/60 shadow-soft">
          <CardContent className="py-12 flex flex-col items-center text-center space-y-5">
            <div className="p-4 rounded-full bg-accent/5 dark:bg-accent/10 text-accent animate-pulse">
              <Sparkles className="h-10 w-10" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-semibold text-lg">Быстрый старт</h3>
              <p className="text-sm text-muted-foreground">
                Нажмите на любой из популярных тегов ниже, чтобы быстро найти релевантные публикации в школе.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
              {SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="px-4 py-2 text-sm font-medium rounded-full bg-muted/60 border border-border/50 hover:border-accent/40 hover:bg-accent/10 hover:text-accent transition-all duration-200 shadow-sm"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        /* Состояние загрузки (Скелетоны) */
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-card border border-border p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3.5 w-full bg-muted rounded" />
                <div className="h-3.5 w-4/5 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Ошибка */
        <Card className="border-red-500/10 bg-red-500/5">
          <CardContent className="py-8 text-center flex flex-col items-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <div className="space-y-1">
              <p className="font-medium text-red-700 dark:text-red-400">
                Не удалось выполнить поиск
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 max-w-sm">
                Пожалуйста, проверьте подключение к интернету или статус работы бэкенда.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Повторить попытку
            </Button>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        /* Ничего не найдено */
        <Card className="border-border/60 shadow-soft">
          <CardContent className="py-16 text-center flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
              <Search className="h-10 w-10" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="font-semibold text-lg">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground">
                По запросу <span className="font-medium text-foreground">«{debouncedQuery}»</span> не найдено ни одного поста. Попробуйте изменить формулировку.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="text-accent hover:text-accent/80 hover:bg-accent/5"
            >
              Сбросить поиск
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Результаты поиска */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Найдено результатов: {posts.length}
            </p>
          </div>
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
                Загрузить ещё результаты
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
