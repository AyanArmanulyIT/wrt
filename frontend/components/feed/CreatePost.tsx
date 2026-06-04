"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Textarea } from "@/ui/textarea";
import { createPost } from "@/services/posts.service";
import { getErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

interface CreatePostProps {
  onSuccess?: () => void;
}

export function CreatePost({ onSuccess }: CreatePostProps = {}) {
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isVerified = user?.verification_status === "verified";

  const mutation = useMutation({
    mutationFn: () => createPost({ content, image: image ?? undefined }),
    onSuccess: () => {
      setContent("");
      setImage(null);
      setPreview(null);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      onSuccess?.();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (!isVerified) {
    return (
      <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-amber-700 dark:text-amber-300">
          Подтвердите школу, чтобы публиковать посты. Статус:{" "}
          {user?.verification_status === "pending" ? "на проверке" : "не подтверждён"}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Что нового?"
          rows={3}
          className="w-full resize-none bg-muted/30"
        />
        {preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Превью"
              className="max-h-48 rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImage(file);
                setPreview(URL.createObjectURL(file));
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Фото
          </Button>
          <Button
            size="sm"
            loading={mutation.isPending}
            disabled={!content.trim()}
            onClick={() => mutation.mutate()}
          >
            Опубликовать
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
