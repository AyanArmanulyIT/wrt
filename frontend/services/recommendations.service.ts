import { api } from "./api";
import type { Post } from "@/types/api.types";

export interface TrendingUser {
  id: string;
  username: string;
  avatar: string | null;
  class_name: string | null;
  total_points: number;
  posts_count: number;
}

export interface ActiveClass {
  id: string;
  name: string;
  slug: string;
  weekly_points: number;
  total_points: number;
}

export interface Recommendations {
  popular_posts: Post[];
  trending_users: TrendingUser[];
  active_classes: ActiveClass[];
}

export async function fetchRecommendations(): Promise<Recommendations> {
  const { data } = await api.get<Recommendations>("/recommendations/");
  return data;
}
