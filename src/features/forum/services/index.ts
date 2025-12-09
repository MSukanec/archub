import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export const FORUM_QUERY_KEYS = {
  categories: ['/api/forum/categories'] as const,
  threads: ['/api/forum/threads'] as const,
  thread: (threadSlug: string) => ['/api/forum/threads', threadSlug] as const,
  threadReactions: (threadId: string) => ['/api/forum/threads', threadId, 'reactions'] as const,
};

export interface ForumAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface ForumOrganization {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  allowed_roles: string[];
  is_read_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ForumCategoryWithCounts extends ForumCategory {
  thread_count?: number;
  post_count?: number;
}

export interface ForumThreadWithAuthor {
  id: string;
  category_id: string;
  organization_id: string;
  author_id: string;
  title: string;
  slug: string;
  content: { text: string } | null;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  view_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  author: ForumAuthor | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    allowed_roles?: string[];
    is_read_only?: boolean;
  } | null;
  organization?: ForumOrganization | null;
}

export interface ForumPostWithAuthor {
  id: string;
  thread_id: string;
  organization_id: string;
  author_id: string;
  parent_id: string | null;
  content: { text: string };
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: ForumAuthor | null;
  organization?: ForumOrganization | null;
  replies?: ForumPostWithAuthor[];
}

export interface ForumThreadWithPosts extends ForumThreadWithAuthor {
  posts: ForumPostWithAuthor[];
}

export interface ThreadsResponse {
  threads: ForumThreadWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReactionsResponse {
  thread: {
    likes: number;
    userReaction: string | null;
  };
  posts: Record<string, number>;
}

export function useForumCategories() {
  return useQuery<ForumCategoryWithCounts[]>({
    queryKey: FORUM_QUERY_KEYS.categories,
  });
}

export function useForumThreads(categorySlug: string | null, page: number = 1, limit: number = 20) {
  return useQuery<ThreadsResponse>({
    queryKey: [...FORUM_QUERY_KEYS.threads, { category: categorySlug || 'all', page, limit }],
    queryFn: async () => {
      const categoryParam = categorySlug && categorySlug !== 'all' ? `&category=${categorySlug}` : '';
      const res = await fetch(`/api/forum/threads?page=${page}&limit=${limit}${categoryParam}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
  });
}

export function useForumThread(threadSlug: string) {
  return useQuery<ForumThreadWithPosts>({
    queryKey: FORUM_QUERY_KEYS.thread(threadSlug),
    enabled: !!threadSlug,
  });
}

export function useThreadReactions(threadId: string) {
  return useQuery<ReactionsResponse>({
    queryKey: FORUM_QUERY_KEYS.threadReactions(threadId),
    enabled: !!threadId,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { category_id: string; title: string; content: string }) => {
      const res = await apiRequest('POST', '/api/forum/threads', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORUM_QUERY_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: FORUM_QUERY_KEYS.threads });
    },
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, data }: { threadId: string; data: { title?: string; content?: string } }) => {
      const res = await apiRequest('PATCH', `/api/forum/threads/${threadId}`, data);
      return res.json();
    },
    onSuccess: (updatedThread) => {
      if (updatedThread?.slug) {
        queryClient.invalidateQueries({
          queryKey: FORUM_QUERY_KEYS.thread(updatedThread.slug),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/forum/categories'] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { thread_id: string; thread_slug?: string; content: string; parent_id?: string }) => {
      const res = await apiRequest('POST', '/api/forum/posts', {
        thread_id: data.thread_id,
        content: data.content,
        parent_id: data.parent_id,
      });
      return { ...await res.json(), thread_slug: data.thread_slug };
    },
    onSuccess: (result) => {
      if (result.thread_slug) {
        queryClient.invalidateQueries({
          queryKey: FORUM_QUERY_KEYS.thread(result.thread_slug),
        });
      }
      queryClient.invalidateQueries({ queryKey: FORUM_QUERY_KEYS.threads });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const res = await apiRequest('PATCH', `/api/forum/posts/${postId}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/forum/threads' && query.queryKey.length >= 2,
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest('DELETE', `/api/forum/posts/${postId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/forum/threads' && query.queryKey.length >= 2,
      });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { item_type: 'thread' | 'post'; item_id: string; reaction_type?: string }) => {
      const res = await apiRequest('POST', '/api/forum/reactions', {
        item_type: data.item_type,
        item_id: data.item_id,
        reaction_type: data.reaction_type || 'like',
      });
      return res.json();
    },
    onMutate: async (variables) => {
      if (variables.item_type === 'thread') {
        await queryClient.cancelQueries({
          queryKey: FORUM_QUERY_KEYS.threadReactions(variables.item_id),
        });

        const previousData = queryClient.getQueryData<ReactionsResponse>(
          FORUM_QUERY_KEYS.threadReactions(variables.item_id)
        );

        if (previousData) {
          const isCurrentlyLiked = previousData.thread.userReaction === 'like';
          queryClient.setQueryData<ReactionsResponse>(
            FORUM_QUERY_KEYS.threadReactions(variables.item_id),
            {
              ...previousData,
              thread: {
                likes: isCurrentlyLiked
                  ? previousData.thread.likes - 1
                  : previousData.thread.likes + 1,
                userReaction: isCurrentlyLiked ? null : 'like',
              },
            }
          );
        }

        return { previousData };
      }
      return {};
    },
    onError: (err, variables, context: any) => {
      if (variables.item_type === 'thread' && context?.previousData) {
        queryClient.setQueryData(
          FORUM_QUERY_KEYS.threadReactions(variables.item_id),
          context.previousData
        );
      }
    },
    onSettled: (_, __, variables) => {
      if (variables.item_type === 'thread') {
        queryClient.invalidateQueries({
          queryKey: FORUM_QUERY_KEYS.threadReactions(variables.item_id),
        });
      }
    },
  });
}

export function useIncrementViewCount() {
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiRequest('POST', `/api/forum/threads/${threadId}/view`);
      return res.json();
    },
  });
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  allowed_roles?: string[];
  sort_order?: number;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      const res = await apiRequest('POST', '/api/forum/categories', data);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al crear categoría');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORUM_QUERY_KEYS.categories });
    },
  });
}
