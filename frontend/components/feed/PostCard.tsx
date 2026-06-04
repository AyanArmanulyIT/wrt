"use client";

import { useState, memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, ThumbsUp, Laugh, Flame, Skull, Maximize2 } from "lucide-react";
import { toggleReaction } from "@/services/posts.service";
import { Card, CardContent } from "@/ui/card";
import { Avatar } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  createComment,
  fetchComments,
  toggleLike,
} from "@/services/posts.service";
import { getErrorMessage } from "@/services/api";
import type { Post } from "@/types/api.types";
import { useAuthStore } from "@/store/auth.store";

interface PostCardProps {
  post: Post;
  onImageClick?: (post: Post) => void;
}

const REACTION_EMOJIS: { key: string; emoji: string; icon: typeof ThumbsUp }[] = [
  { key: "like", emoji: "👍", icon: ThumbsUp },
  { key: "fire", emoji: "🔥", icon: Flame },
  { key: "laugh", emoji: "😂", icon: Laugh },
  { key: "skull", emoji: "💀", icon: Skull },
];

export const PostCard = memo(function PostCard({ post: initialPost, onImageClick }: PostCardProps) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.verification_status === "verified";
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(post.id),
    onSuccess: (data) => {
      setPost((p) => ({
        ...p,
        is_liked: data.liked,
        likes_count: data.likes_count,
      }));
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const { data: comments = [], refetch } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => fetchComments(post.id),
    enabled: showComments,
    staleTime: 30_000,
  });

  const commentMutation = useMutation({
    mutationFn: () => createComment(post.id, commentText),
    onSuccess: () => {
      setCommentText("");
      setPost((p) => ({ ...p, comments_count: p.comments_count + 1 }));
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ emoji }: { emoji: string }) => toggleReaction(post.id, emoji),
    onMutate: async ({ emoji: newEmoji }) => {
      // Optimistic update
      setPost((p) => ({
        ...p,
        reactions: p.reactions?.map((r) =>
          r.emoji === newEmoji
            ? { ...r, user_reacted: !r.user_reacted, count: r.user_reacted ? r.count - 1 : r.count + 1 }
            : r
        ) ?? [],
      }));
    },
    onError: () => {
      // Revert on error by refetching
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleLike = useCallback(() => {
    if (isVerified && !likeMutation.isPending) likeMutation.mutate();
  }, [isVerified, likeMutation]);

  const handleCommentSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) commentMutation.mutate();
  }, [commentText, commentMutation]);

  const handleImageClick = useCallback(() => {
    if (onImageClick) onImageClick(post);
  }, [onImageClick, post]);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-soft">
      <CardContent className="pt-5 space-y-3">
        {/* Author header */}
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.username}`} className="shrink-0">
            <Avatar
              name={post.author.username}
              src={post.author.avatar}
              size="md"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold text-sm hover:text-accent line-clamp-1"
            >
              @{post.author.username}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {post.author.class_name ? (
                <Badge>{post.author.class_name}</Badge>
              ) : null}
              <span className="tabular-nums">{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{post.content}</p>

        {/* Image with optimized aspect ratio */}
        {post.image && (
          <button
            onClick={handleImageClick}
            className="relative w-full rounded-2xl overflow-hidden border border-border bg-muted group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Открыть изображение"
          >
            <div className="relative w-full" style={{ maxHeight: "70vh" }}>
              <Image
                src={post.image}
                alt=""
                width={600}
                height={400}
                className="w-full h-auto object-contain max-h-[70vh]"
                sizes="(max-width: 768px) 100vw, 600px"
                loading="lazy"
              />
              {/* Zoom icon overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-white/0 group-hover:text-white/80 transition-all" />
              </div>
            </div>
          </button>
        )}

        {/* Quick Reactions */}
        <div className="flex items-center gap-1 pt-1" role="group" aria-label="Реакции">
          {REACTION_EMOJIS.map(({ key, emoji, icon: Icon }) => {
            const reaction = post.reactions?.find((r) => r.emoji === emoji);
            const count = reaction?.count ?? 0;
            const userReacted = reaction?.user_reacted ?? false;
            return (
              <button
                key={key}
                disabled={!isVerified || reactionMutation.isPending}
                onClick={() => isVerified && reactionMutation.mutate({ emoji: key })}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all min-h-[32px] min-w-[40px]",
                  userReacted
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !isVerified && "opacity-50 cursor-not-allowed"
                )}
                aria-label={`${emoji}${count ? ` (${count})` : ""}`}
                title={emoji}
              >
                <Icon className="h-4 w-4" />
                {count > 0 && <span className="tabular-nums">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Like / Comment buttons */}
        <div className="flex items-center gap-4 pt-1 border-t border-border">
          <button
            type="button"
            disabled={!isVerified || likeMutation.isPending}
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors min-h-[36px] min-w-[48px] rounded-lg px-2",
              post.is_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-red-500/5",
              !isVerified && "opacity-50 cursor-not-allowed"
            )}
            aria-label={post.is_liked ? "Убрать лайк" : "Поставить лайк"}
          >
            <Heart className={cn("h-5 w-5", post.is_liked && "fill-current")} />
            <span className="tabular-nums">{post.likes_count}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors min-h-[36px] rounded-lg px-2"
            aria-label={showComments ? "Скрыть комментарии" : "Показать комментарии"}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="tabular-nums">{post.comments_count}</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments ? (
          <div className="space-y-3 pt-2 border-t border-border">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Нет комментариев
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <span className="font-medium">@{c.author_username}</span>
                  {c.author_class ? (
                    <span className="text-muted-foreground text-xs ml-1">
                      {c.author_class}
                    </span>
                  ) : null}
                  <p className="text-muted-foreground mt-0.5 break-words">{c.content}</p>
                </div>
              ))
            )}
            {isVerified ? (
              <form className="flex gap-2" onSubmit={handleCommentSubmit}>
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="flex-1"
                  aria-label="Текст комментария"
                />
                <Button
                  type="submit"
                  size="sm"
                  loading={commentMutation.isPending}
                  disabled={!commentText.trim()}
                >
                  Отпр.
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Комментарии доступны после подтверждения школы
              </p>
            )}
            {commentMutation.isError && (
              <p className="text-xs text-red-500" role="alert">
                {getErrorMessage(commentMutation.error)}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
});