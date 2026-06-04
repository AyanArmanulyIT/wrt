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
  slug: string;
  weekly_points: number;
}

export interface MyContribution {
  total_points: number;
  week_points: number;
  class_name: string | null;
  by_action: Record<string, number>;
}

export interface SeasonData {
  season_number: number;
  name: string;
  days_remaining: number;
  end_date: string;
}

export interface TopContributor {
  username: string;
  points: number;
}

export interface ClassBadgeData {
  badge_type: string;
  label: string;
  awarded_at: string;
  season: number | null;
}

export interface ClashDashboardData {
  season: SeasonData | null;
  class_of_week: ClassOfWeek | null;
  weekly_leaderboard: ClassRankEntry[];
  all_time_leaderboard: ClassRankEntry[];
  top_contributors: TopContributor[];
  class_streak: number;
  badges: ClassBadgeData[];
  week_start: string;
}

export interface ClassDetailData {
  id: string;
  name: string;
  slug: string;
  total_points: number;
  weekly_points: number;
  student_count: number;
}

export interface WeeklyByAction {
  label: string;
  count: number;
  points: number;
}

export interface ClassStatsData {
  total_points: number;
  weekly_points: number;
  streak_days: number;
  total_posts: number;
  total_comments: number;
  total_likes: number;
  weekly_by_action: Record<string, WeeklyByAction>;
  week_start: string;
  member_count: number;
}

export interface ClassMember {
  username: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  total_points: number;
  posts_count: number;
  comments_count: number;
  is_moderator: boolean;
  joined_at: string;
}

export interface ClassBadge {
  type: string;
  label: string;
  awarded_at: string;
  season_number: number | null;
}

export interface MemberAchievement {
  username: string;
  achievement_name: string;
  achievement_slug: string;
  icon_name: string;
  category: string;
  unlocked_at: string;
}

export interface ClassAchievementsData {
  badges: ClassBadge[];
  recent_member_achievements: MemberAchievement[];
}

export interface SeasonHistoryEntry {
  season_number: number;
  name: string;
  total_points: number;
  weekly_avg: number;
  badges: string[];
}

export interface TopPlayer {
  rank: number;
  username: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  total_points: number;
  week_points: number;
  posts_count: number;
  comments_count: number;
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

export async function fetchClashDashboard(): Promise<ClashDashboardData> {
  const { data } = await api.get<ClashDashboardData>("/class-clash/dashboard/");
  return data;
}

export interface ClassFeedPost {
  id: string;
  author_username: string;
  author_avatar: string | null;
  content: string;
  image: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface PaginatedFeedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClassFeedPost[];
}

// --- Class page endpoints ---

export async function fetchClassDetail(slug: string): Promise<ClassDetailData> {
  const { data } = await api.get<ClassDetailData>(`/class-clash/class/${slug}/`);
  return data;
}

export async function fetchClassStats(slug: string): Promise<ClassStatsData> {
  const { data } = await api.get<ClassStatsData>(`/class-clash/class/${slug}/stats/`);
  return data;
}

export async function fetchClassMembers(slug: string): Promise<ClassMember[]> {
  const { data } = await api.get<{ members: ClassMember[] }>(`/class-clash/class/${slug}/members/`);
  return data.members;
}

export async function fetchClassAchievements(slug: string): Promise<ClassAchievementsData> {
  const { data } = await api.get<ClassAchievementsData>(`/class-clash/class/${slug}/achievements/`);
  return data;
}

export async function fetchClassSeasonHistory(slug: string): Promise<SeasonHistoryEntry[]> {
  const { data } = await api.get<{ history: SeasonHistoryEntry[] }>(`/class-clash/class/${slug}/history/`);
  return data.history;
}

export async function fetchClassTopPlayers(slug: string): Promise<TopPlayer[]> {
  const { data } = await api.get<{ players: TopPlayer[] }>(`/class-clash/class/${slug}/top-players/`);
  return data.players;
}

export async function fetchClassFeed(slug: string, page = 1): Promise<PaginatedFeedResponse> {
  const { data } = await api.get<PaginatedFeedResponse>(
    `/class-clash/class/${slug}/feed/`,
    { params: { page } }
  );
  return data;
}

export interface BestClassMonth {
  id: string;
  name: string;
  slug: string;
  points: number;
}

export interface BestStudentMonth {
  username: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  points: number;
  class_name: string | null;
}

export interface MostActiveUser {
  username: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  streak: number;
  week_points: number;
  total_points: number;
  class_name: string | null;
}

export interface BestPostWeek {
  id: string;
  author_username: string;
  author_avatar: string | null;
  content: string;
  likes_count: number;
  comments_count: number;
  engagement_score: number;
  created_at: string;
}

export interface HallOfFameData {
  best_class_month: BestClassMonth | null;
  best_student_month: BestStudentMonth | null;
  most_active_user: MostActiveUser | null;
  best_post_week: BestPostWeek | null;
  week_start: string;
  month_start: string;
}

export async function fetchHallOfFame(): Promise<HallOfFameData> {
  const { data } = await api.get<HallOfFameData>("/class-clash/hall-of-fame/");
  return data;
}

export interface ClassLevelData {
  level: number;
  title: string;
  total_points: number;
  progress_pct: number;
  next_level_points: number | null;
}

export interface QuestData {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  reward: number;
  type: "daily" | "weekly";
}

export interface QuestsResponse {
  daily: QuestData[];
  weekly: QuestData[];
}

export interface StreakMilestone {
  days: number;
  title: string;
  reward: number;
  reached: boolean;
  progress: number;
}

export interface StreakRewardsData {
  current_streak: number;
  longest_streak: number;
  milestones: StreakMilestone[];
  next_milestone: StreakMilestone | null;
}

export interface ClassAchievementProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  earned: boolean;
  reward_title: string;
}

export interface AchievementProgressResponse {
  achievements: ClassAchievementProgress[];
}

export async function fetchClassLevel(): Promise<ClassLevelData> {
  const { data } = await api.get<ClassLevelData>("/class-clash/class-level/");
  return data;
}

export async function fetchQuests(): Promise<QuestsResponse> {
  const { data } = await api.get<QuestsResponse>("/class-clash/quests/");
  return data;
}

export async function fetchStreakRewards(): Promise<StreakRewardsData> {
  const { data } = await api.get<StreakRewardsData>("/class-clash/streak-rewards/");
  return data;
}

export async function fetchAchievementProgress(): Promise<AchievementProgressResponse> {
  const { data } = await api.get<AchievementProgressResponse>("/class-clash/achievement-progress/");
  return data;
}
