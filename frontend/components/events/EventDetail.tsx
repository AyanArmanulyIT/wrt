"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  CalendarCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  fetchEventDetail,
  registerForEvent,
  unregisterFromEvent,
  CATEGORY_META,
  STATUS_META,
} from "@/services/events.service";

export function EventDetail() {
  const params = useParams();
  const queryClient = useQueryClient();
  const eventId = params?.id as string;

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
  });

  const registerMutation = useMutation({
    mutationFn: () => registerForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: () => unregisterFromEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-detail", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Событие не найдено</h2>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Все события
        </Link>
      </div>
    );
  }

  const category = CATEGORY_META[event.category] ?? CATEGORY_META.other;
  const status = STATUS_META[event.status] ?? STATUS_META.upcoming;
  const startDate = new Date(event.starts_at);
  const canRegister = event.status === "upcoming" || event.status === "ongoing";
  const isPending = registerMutation.isPending || unregisterMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        События
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className={cn("h-2", category.color.split(" ")[0])} />
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{category.icon}</span>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", status.color)}>
              {status.label}
            </span>
            <Badge>{category.label}</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground whitespace-pre-line mb-4">
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <div>
                <p className="font-medium text-foreground">
                  {startDate.toLocaleDateString("ru-RU", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-xs">{startDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <div>
                  <p className="font-medium text-foreground">{event.location}</p>
                  <p className="text-xs">Место</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <div>
                <p className="font-medium text-foreground">
                  {event.participant_count}
                  {event.max_participants ? ` / ${event.max_participants}` : ""}
                </p>
                <p className="text-xs">Участников</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Register / Unregister */}
      {canRegister && !event.is_full && (
        <Card>
          <CardContent className="pt-6">
            {event.is_registered ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500">
                  <CalendarCheck className="h-5 w-5" />
                  <span className="font-medium">Вы зарегистрированы</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => unregisterMutation.mutate()}
                  disabled={isPending}
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                  {unregisterMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" />
                      Отменить регистрацию
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={isPending}
                className="w-full"
                size="lg"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Зарегистрироваться
                  </>
                )}
              </Button>
            )}
            {event.is_full && (
              <p className="text-center text-sm text-red-500 mt-2">Все места заняты</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Участники ({event.participant_count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пока нет участников
            </p>
          ) : (
            <div className="space-y-2">
              {event.participants.map((p) => (
                <Link
                  key={p.username}
                  href={`/profile/${p.username}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                >
                  <Avatar name={p.username} size="sm" className="ring-1 ring-white/10" />
                  <span className="font-medium">@{p.username}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatRelativeTime(p.registered_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {registerMutation.isError && (
        <p className="text-sm text-red-500 text-center">Ошибка при регистрации</p>
      )}
    </div>
  );
}