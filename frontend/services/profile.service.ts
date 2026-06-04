import { api } from "./api";

export interface ProfileTheme {
  slug: string;
  label_ru: string;
  primary_color: string;
  gradient_from: string;
  gradient_to: string;
  card_border: string;
  is_premium: boolean;
}

export interface Achievement {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon_name: string;
  condition_code: string;
}

export interface UserAchievement {
  achievement: Achievement;
  unlocked_at: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export interface PublicProfile {
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  bio: string;
  total_points: number;
  posts_count: number;
  comments_count: number;
  likes_received: number;
  class_name: string | null;
  school_name: string | null;
  created_at: string;
  achievements: UserAchievement[];
  streak: UserStreak | null;
  theme: ProfileTheme | null;
  week_points: number;
  class_rank: number;
  class_total: number;
  contribution_by_action: Record<string, number>;
  is_verified: boolean;
  is_staff: boolean;
}

export async function fetchProfile(username: string): Promise<PublicProfile> {
  const { data } = await api.get<PublicProfile>(`/auth/profile/${username}/`);
  return data;
}