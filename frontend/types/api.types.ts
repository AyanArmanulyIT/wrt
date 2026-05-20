export type VerificationStatus = "pending" | "verified" | "rejected";

export interface UserProfile {
  username: string;
  avatar: string | null;
  bio: string;
  total_points: number;
  posts_count: number;
  comments_count: number;
  likes_received: number;
  class_name: string | null;
  school_name: string | null;
}

export interface User {
  id: string;
  email: string;
  verification_status: VerificationStatus;
  is_verified: boolean;
  school: string | null;
  school_class: string | null;
  profile: UserProfile;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_school_moderator?: boolean;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  verification_mode: "invite" | "email" | "class_code" | "manual";
  allowed_email_domains: string[];
}

export interface SchoolClass {
  id: string;
  name: string;
  slug: string;
  school_name: string;
  weekly_points: number;
  total_points: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatar: string | null;
  class_name: string | null;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  image: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  post: string;
  author_username: string;
  author_class: string | null;
  content: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}
