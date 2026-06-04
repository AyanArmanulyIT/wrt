import { api } from "./api";

export interface PollOptionData {
  id: string;
  text: string;
  image: string | null;
  vote_count: number;
  voted: boolean;
  created_at: string;
}

export interface PollListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  is_active: boolean;
  ends_at: string | null;
  max_votes_per_user: number;
  total_votes: number;
  options_count: number;
  created_at: string;
}

export interface PollDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  is_active: boolean;
  ends_at: string | null;
  is_over: boolean;
  max_votes_per_user: number;
  total_votes: number;
  options: PollOptionData[];
  created_at: string;
}

export interface PollResultItem {
  id: string;
  text: string;
  image: string | null;
  vote_count: number;
  percentage: number;
}

export interface PollResults {
  poll_id: string;
  title: string;
  total_votes: number;
  results: PollResultItem[];
}

export async function fetchActivePolls(): Promise<PollListItem[]> {
  const { data } = await api.get<PollListItem[]>("/polls/");
  return data;
}

export async function fetchPollDetail(pollId: string): Promise<PollDetail> {
  const { data } = await api.get<PollDetail>(`/polls/${pollId}/`);
  return data;
}

export async function votePoll(pollId: string, optionId: string): Promise<void> {
  await api.post(`/polls/${pollId}/vote/`, { option_id: optionId });
}

export async function fetchPollResults(pollId: string): Promise<PollResults> {
  const { data } = await api.get<PollResults>(`/polls/${pollId}/results/`);
  return data;
}