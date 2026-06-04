"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  ThumbsUp,
  Vote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchPollDetail,
  fetchPollResults,
  votePoll,
} from "@/services/polls.service";

export function PollDetail() {
  const params = useParams();
  const queryClient = useQueryClient();
  const pollId = params?.id as string;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { data: poll, isLoading } = useQuery({
    queryKey: ["poll-detail", pollId],
    queryFn: () => fetchPollDetail(pollId),
    enabled: !!pollId,
  });

  const { data: results } = useQuery({
    queryKey: ["poll-results", pollId],
    queryFn: () => fetchPollResults(pollId),
    enabled: !!pollId,
  });

  const voteMutation = useMutation({
    mutationFn: () => votePoll(pollId, selectedOption!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll-detail", pollId] });
      queryClient.invalidateQueries({ queryKey: ["poll-results", pollId] });
      queryClient.invalidateQueries({ queryKey: ["active-polls"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Vote className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Голосование не найдено</h2>
        <Link
          href="/polls"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Все голосования
        </Link>
      </div>
    );
  }

  const hasVoted = poll.options.some((o) => o.voted);
  const totalVotes = poll.total_votes;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/polls"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Голосования
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <Badge className="mb-2">{getCategoryLabel(poll.category)}</Badge>
          <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
          {poll.description && (
            <p className="text-muted-foreground mb-3">{poll.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {totalVotes} голосов
            </span>
            {poll.ends_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Заканчивается {new Date(poll.ends_at).toLocaleDateString("ru-RU")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options / Voting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {hasVoted ? "Результаты" : "Выберите вариант"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {poll.options.map((option) => {
            const percentage = totalVotes > 0
              ? Math.round((option.vote_count / totalVotes) * 100)
              : 0;
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => {
                  if (!hasVoted) {
                    setSelectedOption(option.id);
                  }
                }}
                disabled={hasVoted || voteMutation.isPending}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition-all duration-200",
                  hasVoted
                    ? "border-border cursor-default"
                    : isSelected
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-border hover:border-accent/50 hover:bg-muted",
                  option.voted && "border-green-500/50 bg-green-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm font-semibold tabular-nums text-accent">
                      {percentage}%
                    </span>
                  )}
                  {option.voted && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
                  )}
                </div>
                {hasVoted && (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        option.voted ? "bg-green-500" : "bg-accent/50"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
                {hasVoted && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.vote_count} голосов
                  </p>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Vote button */}
      {!hasVoted && (
        <Button
          onClick={() => voteMutation.mutate()}
          disabled={!selectedOption || voteMutation.isPending}
          className="w-full"
          size="lg"
        >
          {voteMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Vote className="h-5 w-5 mr-2" />
              Проголосовать
            </>
          )}
        </Button>
      )}

      {voteMutation.isError && (
        <p className="text-sm text-red-500 text-center">
          Ошибка при голосовании
        </p>
      )}
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    meme: "Лучший мем недели",
    photo: "Лучшее фото",
    friendly_class: "Самый дружный класс",
    custom: "Голосование",
  };
  return labels[category] ?? category;
}