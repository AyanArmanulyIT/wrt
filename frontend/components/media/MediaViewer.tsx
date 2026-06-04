"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  RotateCcw,
} from "lucide-react";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

interface MediaViewerProps {
  images: {
    src: string;
    alt?: string;
    postId?: string;
    authorUsername?: string;
    authorAvatar?: string | null;
    content?: string;
    likesCount?: number;
    commentsCount?: number;
    createdAt?: string;
  }[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaViewer({ images, initialIndex = 0, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const current = images[currentIndex];

  // ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) setCurrentIndex((i) => i - 1);
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, currentIndex, images.length]);

  // Swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoomed) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [zoomed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (zoomed) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [zoomed]);

  const handleTouchEnd = useCallback(() => {
    if (zoomed || touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipe = 80;
    if (Math.abs(distance) > minSwipe) {
      if (distance > 0 && currentIndex < images.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (distance < 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  }, [zoomed, touchStart, touchEnd, currentIndex, images.length]);

  const prevImage = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const nextImage = () => setCurrentIndex((i) => Math.min(images.length - 1, i + 1));

  if (!current) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col lg:flex-row"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        aria-label="Закрыть"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Zoom toggle */}
      {!zoomed && (
        <button
          onClick={() => setZoomed(true)}
          className="absolute top-4 left-4 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors lg:hidden"
          aria-label="Увеличить"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Prev / Next arrows */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors hidden lg:flex"
              aria-label="Предыдущее"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors hidden lg:flex"
              aria-label="Следующее"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </>
      )}

      {/* Image area — takes up available space, flex-shrink */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-[50vh]">
        <div
          className={cn(
            "relative transition-transform duration-200",
            zoomed ? "cursor-zoom-out max-w-none" : "cursor-zoom-in max-w-full max-h-[80vh]"
          )}
          onClick={() => setZoomed(!zoomed)}
          style={zoomed ? { transform: "scale(1.5)", overflow: "auto" } : undefined}
        >
          <Image
            src={current.src}
            alt={current.alt ?? ""}
            width={zoomed ? 1200 : 800}
            height={zoomed ? 1600 : 800}
            className="object-contain max-h-[80vh] w-auto h-auto rounded-lg select-none"
            priority
            draggable={false}
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
      </div>

      {/* Post info sidebar (desktop) / bottom panel (mobile) */}
      {current.postId && (
        <div className="lg:w-96 lg:max-w-md bg-black/80 lg:bg-black/60 border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              <Link href={`/profile/${current.authorUsername}`}>
                <Avatar
                  name={current.authorUsername ?? ""}
                  src={current.authorAvatar}
                  size="md"
                  className="ring-2 ring-white/20"
                />
              </Link>
              <div>
                <Link
                  href={`/profile/${current.authorUsername}`}
                  className="font-semibold text-white text-sm hover:underline"
                >
                  @{current.authorUsername}
                </Link>
                {current.createdAt && (
                  <p className="text-xs text-white/50">
                    {formatRelativeTime(current.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Content/caption */}
            {current.content && (
              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {current.content}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                {current.likesCount}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                {current.commentsCount}
              </span>
            </div>

            {/* View post button */}
            {current.postId && (
              <Link
                href={`/post/${current.postId}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-sm font-medium transition-colors"
                onClick={onClose}
              >
                <MessageCircle className="h-4 w-4" />
                Открыть пост
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent re-renders when not active
export const MemoizedMediaViewer = MediaViewer;