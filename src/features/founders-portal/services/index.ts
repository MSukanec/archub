import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export const FOUNDERS_QUERY_KEYS = {
  directory: ['founders', 'directory'] as const,
  events: ['founders', 'events'] as const,
  event: (id: string) => ['founders', 'events', id] as const,
  votes: ['founders', 'votes'] as const,
  vote: (id: string) => ['founders', 'votes', id] as const,
  voteResults: (id: string) => ['founders', 'votes', id, 'results'] as const,
  threads: (category?: string) => ['founders', 'forum', 'threads', category] as const,
  thread: (id: string) => ['founders', 'forum', 'threads', id] as const,
};

export interface FounderOrganization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  settings: {
    is_founder?: boolean;
    country?: string;
    [key: string]: any;
  } | null;
  member_count?: number;
}

export interface FounderEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  meeting_url: string | null;
  max_attendees: number | null;
  is_deleted: boolean;
  created_at: string;
  registrations: { count: number }[];
  is_registered?: boolean;
}

export interface VoteOption {
  id: string;
  topic_id: string;
  option_text: string;
  option_order: number;
}

export interface VoteTopic {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'closed';
  voting_deadline: string | null;
  created_at: string;
  options: VoteOption[];
  ballots?: { count: number }[];
  vote_counts?: Record<string, number>;
  total_votes?: number;
  user_voted_option_id?: string | null;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string | null;
  category: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  posts: { count: number }[];
}

export interface ForumPost {
  id: string;
  thread_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface ThreadWithPosts extends Omit<ForumThread, 'posts'> {
  posts: ForumPost[];
}

export function useFounderDirectory() {
  return useQuery<FounderOrganization[]>({
    queryKey: FOUNDERS_QUERY_KEYS.directory,
  });
}

export function useFounderEvents() {
  return useQuery<FounderEvent[]>({
    queryKey: FOUNDERS_QUERY_KEYS.events,
  });
}

export function useFounderVotes() {
  return useQuery<VoteTopic[]>({
    queryKey: FOUNDERS_QUERY_KEYS.votes,
  });
}

export function useFounderVote(id: string) {
  return useQuery<VoteTopic>({
    queryKey: FOUNDERS_QUERY_KEYS.vote(id),
    enabled: !!id,
  });
}

export function useForumThreads(category?: string) {
  return useQuery<{ threads: ForumThread[]; pagination: any }>({
    queryKey: FOUNDERS_QUERY_KEYS.threads(category),
  });
}

export function useForumThread(id: string) {
  return useQuery<ThreadWithPosts>({
    queryKey: FOUNDERS_QUERY_KEYS.thread(id),
    enabled: !!id,
  });
}

export function useRegisterEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest('POST', `/api/founders/events/${eventId}/register`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOUNDERS_QUERY_KEYS.events });
    },
  });
}

export function useUnregisterEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest('DELETE', `/api/founders/events/${eventId}/register`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOUNDERS_QUERY_KEYS.events });
    },
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ topicId, optionId }: { topicId: string; optionId: string }) => {
      const res = await apiRequest('POST', `/api/founders/votes/${topicId}/cast`, { option_id: optionId });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FOUNDERS_QUERY_KEYS.votes });
      queryClient.invalidateQueries({ queryKey: FOUNDERS_QUERY_KEYS.vote(variables.topicId) });
    },
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; content: string; category: string }) => {
      const res = await apiRequest('POST', '/api/founders/forum/threads', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founders', 'forum', 'threads'] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const res = await apiRequest('POST', `/api/founders/forum/threads/${threadId}/posts`, { content });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FOUNDERS_QUERY_KEYS.thread(variables.threadId) });
      queryClient.invalidateQueries({ queryKey: ['founders', 'forum', 'threads'] });
    },
  });
}
