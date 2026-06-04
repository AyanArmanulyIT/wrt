import { api } from "./api";
import type {
  Comment,
  LikeResponse,
  PaginatedResponse,
  Post,
} from "@/types/api.types";

export async function fetchFeed(page = 1, search = ""): Promise<PaginatedResponse<Post>> {
  const { data } = await api.get<PaginatedResponse<Post>>("/feed/", {
    params: { page, search: search || undefined },
  });
  return data;
}

export async function fetchFeedNew(page = 1, search = ""): Promise<PaginatedResponse<Post>> {
  const { data } = await api.get<PaginatedResponse<Post>>("/feed/new/", {
    params: { page, search: search || undefined },
  });
  return data;
}

export async function fetchFeedTrending(): Promise<PaginatedResponse<Post>> {
  const { data } = await api.get<PaginatedResponse<Post>>("/feed/trending/");
  return data;
}

export async function fetchFeedClass(): Promise<PaginatedResponse<Post>> {
  const { data } = await api.get<PaginatedResponse<Post>>("/feed/class/");
  return data;
}

export async function fetchPinnedPosts(): Promise<Post[]> {
  const { data } = await api.get<Post[]>("/feed/pinned/");
  return data;
}

export async function fetchHotTopics(): Promise<{ text: string; post_count: number }[]> {
  const { data } = await api.get<{ text: string; post_count: number }[]>("/hot-topics/");
  return data;
}

export async function fetchClassRank(): Promise<{
  class_name: string;
  total_points: number;
  weekly_points: number;
  rank: number;
  total_classes: number;
  next_class: string | null;
  gap_to_next: number;
} | null> {
  const { data } = await api.get("/class-rank/");
  return data;
}

export async function toggleReaction(postId: string, emoji: string): Promise<{ emoji: string; reacted: boolean }> {
  const { data } = await api.post(`/posts/${postId}/react/`, { emoji });
  return data;
}

export async function createPost(payload: {
  content: string;
  image?: File;
}): Promise<Post> {
  const form = new FormData();
  form.append("content", payload.content);
  if (payload.image) {
    form.append("image", payload.image);
  }
  const { data } = await api.post<Post>("/posts/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function toggleLike(postId: string): Promise<LikeResponse> {
  const { data } = await api.post<LikeResponse>(`/posts/${postId}/like/`);
  return data;
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await api.get<Comment[] | PaginatedResponse<Comment>>(
    `/posts/${postId}/comments/`
  );
  return Array.isArray(data) ? data : data.results;
}

export async function createComment(
  postId: string,
  content: string
): Promise<Comment> {
  const { data } = await api.post<Comment>(`/posts/${postId}/comments/`, {
    content,
  });
  return data;
}

export async function fetchPost(postId: string): Promise<Post> {
  const { data } = await api.get<Post>(`/posts/${postId}/`);
  return data;
}