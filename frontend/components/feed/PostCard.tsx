"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
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
}

export function PostCard({ post: initialPost }: PostCardProps) {
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
  });

  const commentMutation = useMutation({
    mutationFn: () => createComment(post.id, commentText),
    onSuccess: () => {
      setCommentText("");
      setPost((p) => ({ ...p, comments_count: p.comments_count + 1 }));
      refetch();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-soft">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar
              name={post.author.username}
              src={post.author.avatar}
              size="md"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold text-sm hover:text-accent"
            >
              @{post.author.username}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {post.author.class_name ? (
                <Badge>{post.author.class_name}</Badge>
              ) : null}
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {post.image ? (
          <div className="relative rounded-2xl overflow-hidden border border-border aspect-video max-h-96">
            <Image
              src={post.image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        ) : null}

        <div className="flex items-center gap-4 pt-1 border-t border-border">
          <button
            type="button"
            disabled={!isVerified || likeMutation.isPending}
            onClick={() => isVerified && likeMutation.mutate()}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              post.is_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500",
              !isVerified && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart className={cn("h-5 w-5", post.is_liked && "fill-current")} />
            {post.likes_count}
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            {post.comments_count}
          </button>
        </div>

        {showComments ? (
          <div className="space-y-3 pt-2 border-t border-border">
            {comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">@{c.author_username}</span>
                {c.author_class ? (
                  <span className="text-muted-foreground text-xs ml-1">
                    {c.author_class}
                  </span>
                ) : null}
                <p className="text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            ))}
            {isVerified ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) commentMutation.mutate();
                }}
              >
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="flex-1"
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
              <p className="text-xs text-muted-foreground">
                Комментарии доступны после подтверждения школы
              </p>
            )}
            {commentMutation.isError ? (
              <p className="text-xs text-red-500">
                {getErrorMessage(commentMutation.error)}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
