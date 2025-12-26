import { useEffect } from 'react';
import { CoursesCatalogContent } from '@/features/shared-content/courses/CoursesCatalogContent';
import { useNavigationStore } from '@/stores/navigationStore';
export function CourseListView() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  useEffect(() => {
    setSidebarContext('learning');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);
  return (
    <div className="space-y-6 p-6">
      <CoursesCatalogContent mode="dashboard" showTabs={true} />
    </div>
  );
}
