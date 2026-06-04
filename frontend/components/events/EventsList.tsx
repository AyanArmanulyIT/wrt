"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  MapPin,
  Users,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchEvents,
  CATEGORY_META,
  STATUS_META,
  type EventListItem,
} from "@/services/events.service";

export function EventsList() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-bold">События</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Спорт, киберспорт, олимпиады и школьные мероприятия
        </p>
      </div>

      {!events || events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Активных событий нет</p>
            <p className="text-sm mt-1">Скоро появятся новые мероприятия</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventListItem }) {
  const category = CATEGORY_META[event.category] ?? CATEGORY_META.other;
  const status = STATUS_META[event.status] ?? STATUS_META.upcoming;

  const startDate = new Date(event.starts_at);
  const dateStr = startDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const timeStr = startDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover:bg-muted/30 transition-colors overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Date column */}
            <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-muted shrink-0">
              <span className="text-xs text-muted-foreground uppercase">
                {startDate.toLocaleDateString("ru-RU", { month: "short" })}
              </span>
              <span className="text-xl font-bold">{startDate.getDate()}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="text-base">{category.icon}</span>
                  {category.label}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {timeStr}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {event.participant_count}
                  {event.max_participants ? ` / ${event.max_participants}` : ""}
                </span>
              </div>

              {event.is_registered && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-500 px-2.5 py-0.5 text-xs font-medium">
                  ✓ Вы зарегистрированы
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}