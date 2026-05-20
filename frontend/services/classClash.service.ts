import { api } from "./api";

export interface ClassRankEntry {
  id: string;
  name: string;
  slug: string;
  points: number;
  total_points: number;
  weekly_points: number;
}

export interface ClassOfWeek {
  id: string;
  name: string;
  weekly_points: number;
}

export interface MyContribution {
  total_points: number;
  week_points: number;
  class_name: string | null;
  by_action: Record<string, number>;
}

export async function fetchLeaderboard(): Promise<ClassRankEntry[]> {
  const { data } = await api.get<{ results: ClassRankEntry[] }>(
    "/class-clash/leaderboard/"
  );
  return data.results;
}

export async function fetchWeeklyLeaderboard(): Promise<{
  results: ClassRankEntry[];
  week_start: string;
}> {
  const { data } = await api.get<{
    results: ClassRankEntry[];
    week_start: string;
  }>("/class-clash/weekly/");
  return data;
}

export async function fetchClassOfWeek(): Promise<{
  class: ClassOfWeek | null;
  week_start: string;
}> {
  const { data } = await api.get<{
    class: ClassOfWeek | null;
    week_start: string;
  }>("/class-clash/class-of-week/");
  return data;
}

export async function fetchMyContribution(): Promise<MyContribution> {
  const { data } = await api.get<MyContribution>("/class-clash/my-contribution/");
  return data;
}
