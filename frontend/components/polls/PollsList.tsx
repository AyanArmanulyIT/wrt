"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  MessageSquareQuote,
  ThumbsUp,
  Users,
  Vote,
} from "lucide-react";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchActivePolls,
  type PollListItem,
} from "@/services/polls.service";

const CATEGORY_META: Record<string, { label: string; icon: typeof Award; color: string }> = {
  meme: {
    label: "Лучший мем недели",
    icon: MessageSquareQuote,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  photo: {
    label: "Лучшее фото",
    icon: ImageIcon,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  friendly_class: {
    label: "Самый дружный класс",
    icon: Users,
    color: "text-green-500 bg-green-500/10 border-green-500/20",
  },
  custom: {
    label: "Голосование",
    icon: Vote,
    color: "text-accent bg-accent/10 border-accent/20",
  },
};

export function PollsList() {
  const { data: polls, isLoading } = useQuery({
    queryKey: ["active-polls"],
    queryFn: fetchActivePolls,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-bold">Голосования</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Голосуйте за лучшее в вашей школе
        </p>
      </div>

      {!polls || polls.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Vote className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Активных голосований нет</p>
            <p className="text-sm mt-1">Скоро появятся новые</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}

function PollCard({ poll }: { poll: PollListItem }) {
  const meta = CATEGORY_META[poll.category] ?? CATEGORY_META.custom;
  const Icon = meta.icon;

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
              meta.color
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{poll.title}</h3>
              <Badge className="shrink-0">{meta.label}</Badge>
            </div>
            {poll.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {poll.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                {poll.total_votes} голосов
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {poll.options_count} вариантов
              </span>
              {poll.ends_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  до {new Date(poll.ends_at).toLocaleDateString("ru-RU")}
                </span>
              )}
            </div>
            <Link
              href={`/polls/${poll.id}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Проголосовать
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}