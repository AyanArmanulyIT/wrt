"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePost, fetchAdminPosts } from "@/services/admin.service";
import { Button } from "@/ui/button";

export function AdminPostsPanel() {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => fetchAdminPosts(false),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Посты</h1>
        <p className="text-gray-500 text-sm mt-1">Модерация контента</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-gray-500">Загрузка...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500">Нет постов</p>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">
                  @{p.author_username} · {p.school_name} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("ru-RU")}
                </p>
                <p className="mt-2 text-sm line-clamp-3">{p.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {p.likes_count} лайков · {p.comments_count} комментариев
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMutation.isPending}
                onClick={() => {
                  if (confirm("Удалить этот пост?")) deleteMutation.mutate(p.id);
                }}
              >
                Удалить
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
