import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ForumLayout } from '@/features/forum/components/ForumLayout';
import { CategoryList } from '@/features/forum/components/CategoryList';
import { ThreadList } from '@/features/forum/components/ThreadList';
import { ThreadDetail } from '@/features/forum/components/ThreadDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalModalStore } from '@/components/modal';
import { MessageSquare } from 'lucide-react';
import type {
  ForumCategoryWithCounts,
  ForumThreadWithAuthor,
  ThreadsResponse,
} from '@/features/forum/services';

interface CourseForumTabProps {
  courseId: string;
}

export default function CourseForumTab({ courseId }: CourseForumTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThreadWithAuthor | null>(null);
  const { openModal } = useGlobalModalStore();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ForumCategoryWithCounts[]>({
    queryKey: ['/api/forum/courses', courseId, 'categories'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/forum/courses/${courseId}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!courseId,
    staleTime: 60 * 1000,
  });

  const { data: threadsData, isLoading: threadsLoading } = useQuery<ThreadsResponse>({
    queryKey: ['/api/forum/courses', courseId, 'threads', { category: selectedCategory || 'all' }],
    queryFn: async () => {
      const categoryParam = selectedCategory && selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const res = await apiRequest('GET', `/api/forum/courses/${courseId}/threads?page=1&limit=50${categoryParam}`);
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });

  const threads = threadsData?.threads || [];

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    setSelectedThread(null);
  };

  const handleThreadClick = (thread: ForumThreadWithAuthor) => {
    setSelectedThread(thread);
  };

  const handleBack = () => {
    setSelectedThread(null);
  };

  const currentCategory = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find(c => c.slug === selectedCategory) || null;
  }, [selectedCategory, categories]);

  const renderSidebar = () => {
    if (categoriesLoading) {
      return (
        <div className="space-y-2" data-testid="course-forum-categories-skeleton">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="text-center py-8 text-[var(--text-muted)]" data-testid="course-forum-no-categories">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay categorías configuradas</p>
          <p className="text-xs mt-1">El administrador debe crear categorías para este foro</p>
        </div>
      );
    }

    return (
      <CategoryList
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
    );
  };

  const renderContent = () => {
    if (selectedThread) {
      return (
        <ThreadDetail
          threadSlug={selectedThread.slug}
          onBack={handleBack}
        />
      );
    }

    if (categories.length === 0 && !categoriesLoading) {
      return (
        <div className="text-center py-12" data-testid="course-forum-empty">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
          <h3 className="text-lg font-medium text-[var(--text-default)] mb-2">
            Foro no configurado
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            El foro de este curso aún no tiene categorías configuradas.
          </p>
        </div>
      );
    }

    return (
      <ThreadList
        threads={threads}
        isLoading={threadsLoading}
        onThreadClick={handleThreadClick}
        selectedCategory={currentCategory}
        onNewThread={() => openModal('forum-thread', { categoryId: currentCategory?.id, courseId })}
      />
    );
  };

  return (
    <div data-testid="course-forum-tab">
      <ForumLayout
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        sidebar={renderSidebar()}
      >
        {renderContent()}
      </ForumLayout>
    </div>
  );
}
