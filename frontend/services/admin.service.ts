import { api } from "./api";

export interface AdminStats {
  total_users: number;
  online_users: number;
  total_posts: number;
  active_classes: number;
  pending_verifications: number;
  banned_users: number;
}

export interface ActivityDay {
  date: string;
  posts: number;
  comments: number;
  likes: number;
  new_users: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  school_name: string | null;
  verification_status: string;
  is_banned: boolean;
  is_active: boolean;
  is_school_moderator: boolean;
  created_at: string;
  last_seen_at: string | null;
}

export interface AdminPost {
  id: string;
  author_username: string;
  school_name: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_deleted: boolean;
  created_at: string;
}

export async function fetchAdminAccess() {
  const { data } = await api.get<{
    allowed: boolean;
    is_superuser: boolean;
    school_name: string | null;
  }>("/admin/access/");
  return data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/stats/");
  return data;
}

export async function fetchAdminActivity(days = 7): Promise<ActivityDay[]> {
  const { data } = await api.get<{ days: ActivityDay[] }>("/admin/activity/", {
    params: { days },
  });
  return data.days;
}

export async function fetchAdminUsers(params?: {
  search?: string;
  status?: string;
}): Promise<AdminUser[]> {
  const { data } = await api.get<AdminUser[]>("/admin/users/", { params });
  return data;
}

export async function fetchAdminPosts(deleted = false): Promise<AdminPost[]> {
  const { data } = await api.get<AdminPost[]>("/admin/posts/", {
    params: deleted ? { deleted: "true" } : {},
  });
  return data;
}

export async function banUser(id: string, reason?: string): Promise<void> {
  await api.post(`/admin/users/${id}/ban/`, { reason });
}

export async function unbanUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/unban/`);
}

export async function verifyUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/verify/`);
}

export async function deletePost(id: string): Promise<void> {
  await api.post(`/admin/posts/${id}/delete/`);
}
