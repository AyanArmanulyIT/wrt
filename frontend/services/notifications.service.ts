import { api } from "./api";
import type { PaginatedResponse } from "@/types/api.types";

export interface Notification {
  id: string;
  type: "like" | "comment" | "class_rank";
  message: string;
  actor_username: string | null;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(
  page = 1
): Promise<PaginatedResponse<Notification>> {
  const { data } = await api.get<PaginatedResponse<Notification>>(
    "/notifications/",
    { params: { page } }
  );
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ unread_count: number }>(
    "/notifications/unread-count/"
  );
  return data.unread_count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read/`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all/");
}
