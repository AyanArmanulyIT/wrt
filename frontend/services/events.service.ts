import { api } from "./api";

export interface EventListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string;
  max_participants: number | null;
  participant_count: number;
  is_full: boolean;
  is_registered: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

export interface EventParticipant {
  username: string;
  registered_at: string;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string;
  max_participants: number | null;
  participant_count: number;
  is_full: boolean;
  is_registered: boolean;
  starts_at: string;
  ends_at: string | null;
  created_by_username: string | null;
  participants: EventParticipant[];
  created_at: string;
}

export async function fetchEvents(): Promise<EventListItem[]> {
  const { data } = await api.get<EventListItem[]>("/events/");
  return data;
}

export async function fetchEventDetail(eventId: string): Promise<EventDetail> {
  const { data } = await api.get<EventDetail>(`/events/${eventId}/`);
  return data;
}

export async function registerForEvent(eventId: string): Promise<void> {
  await api.post(`/events/${eventId}/register/`);
}

export async function unregisterFromEvent(eventId: string): Promise<void> {
  await api.post(`/events/${eventId}/unregister/`);
}

export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  sports: { label: "Спорт", icon: "🏆", color: "border-green-500/30 bg-green-500/10 text-green-500" },
  esports: { label: "Киберспорт", icon: "🎮", color: "border-blue-500/30 bg-blue-500/10 text-blue-500" },
  academic: { label: "Олимпиада", icon: "📚", color: "border-purple-500/30 bg-purple-500/10 text-purple-500" },
  ceremony: { label: "Церемония", icon: "🎓", color: "border-amber-500/30 bg-amber-500/10 text-amber-500" },
  other: { label: "Другое", icon: "🎪", color: "border-accent/30 bg-accent/10 text-accent" },
};

export const STATUS_META: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Предстоит", color: "text-blue-500 bg-blue-500/10" },
  ongoing: { label: "Идёт сейчас", color: "text-green-500 bg-green-500/10" },
  finished: { label: "Завершено", color: "text-muted-foreground bg-muted" },
  cancelled: { label: "Отменено", color: "text-red-500 bg-red-500/10" },
};