"use client";

import { useEffect, useRef } from "react";
import { CreatePost } from "@/components/feed/CreatePost";

interface CreatePostModalProps {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: CreatePostModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-border">
          <h2 className="font-semibold text-lg">Новый пост</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <CreatePost onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}