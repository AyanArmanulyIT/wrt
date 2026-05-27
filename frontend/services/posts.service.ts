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
