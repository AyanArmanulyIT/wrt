import { api } from "./api";
import type { AuthTokens, User } from "@/types/api.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  school_slug: string;
  school_class_id?: string;
  invite_code?: string;
  class_code?: string;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/login/", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/register/", payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

export async function verifySchool(payload: {
  invite_code?: string;
  class_code?: string;
}): Promise<User> {
  const { data } = await api.post<User>("/auth/verify/", payload);
  return data;
}
