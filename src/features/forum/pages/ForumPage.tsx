import { useState, useMemo } from 'react';
import { ForumLayout } from '../components/ForumLayout';
import { CategoryList } from '../components/CategoryList';
import { ThreadList } from '../components/ThreadList';
import { ThreadDetail } from '../components/ThreadDetail';
import {
  useForumCategories,
  useForumThreads,
  type ForumCategoryWithCounts,
  type ForumThreadWithAuthor,
} from '../services';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalModalStore } from '@/components/modal';
interface ForumPageProps {
  allowedRoles?: string[];
}
export function ForumPage({ allowedRoles }: ForumPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThreadWithAuthor | null>(null);
  const { openModal } = useGlobalModalStore();
  const { data: allCategories, isLoading: categoriesLoading } = useForumCategories();
  const categories = useMemo(() => {
    if (!allCategories) return [];
    if (!allowedRoles || allowedRoles.length === 0) return allCategories;
    return allCategories.filter((category) => {
      if (!category.allowed_roles || category.allowed_roles.length === 0) {
        return true;
      }
      return category.allowed_roles.some((role) => allowedRoles.includes(role));
    });
  }, [allCategories, allowedRoles]);
  const { data: threadsData, isLoading: threadsLoading } = useForumThreads(
    selectedCategory,
    1,
    50
  );
  const threads = useMemo(() => {
    if (!threadsData?.threads) return [];
    if (!allowedRoles || allowedRoles.length === 0) return threadsData.threads;
    return threadsData.threads.filter((thread) => {
      if (!thread.category?.allowed_roles || thread.category.allowed_roles.length === 0) {
        return true;
      }
      return thread.category.allowed_roles.some((role) => allowedRoles.includes(role));
    });
  }, [threadsData, allowedRoles]);
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
  const renderSidebar = () => {
    if (categoriesLoading) {
      return (
        <div className="space-y-2" data-testid="categories-skeleton">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
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
  const currentCategory = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find(c => c.slug === selectedCategory) || null;
  }, [selectedCategory, categories]);
  const renderContent = () => {
    if (selectedThread) {
      return (
        <ThreadDetail
          threadSlug={selectedThread.slug}
          onBack={handleBack}
        />
      );
    }
    return (
      <ThreadList
        threads={threads}
        isLoading={threadsLoading}
        onThreadClick={handleThreadClick}
        selectedCategory={currentCategory}
        onNewThread={() => openModal('forum-thread', { categoryId: currentCategory?.id })}
      />
    );
  };
  return (
    <ForumLayout
      categories={categories}
      selectedCategory={selectedCategory}
      onCategorySelect={handleCategorySelect}
      sidebar={renderSidebar()}
    >
      {renderContent()}
    </ForumLayout>
  );
}
