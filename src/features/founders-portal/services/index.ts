import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
export const FOUNDERS_QUERY_KEYS = {
  directory: ['/api/founders/directory'] as const,
  events: ['/api/founders/events'] as const,
  event: (id: string) => ['/api/founders/events', id] as const,
  votes: ['/api/founders/votes'] as const,
  vote: (id: string) => [`/api/founders/votes/${id}`] as const,
  voteResults: (id: string) => [`/api/founders/votes/${id}/results`] as const,
};
export interface FounderOrganization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  created_by?: string;
  creator_name?: string;
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
  event_end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  max_attendees: number | null;
  is_deleted: boolean;
  created_at: string;
  registrations_count?: number;
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
  status: 'draft'| 'active'| 'closed';
  voting_deadline: string | null;
  created_at: string;
  options: VoteOption[];
  vote_counts?: Record<string, number>;
  total_votes?: number;
  user_voted_option_id?: string | null;
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
