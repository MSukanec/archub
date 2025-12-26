import { useEffect } from 'react'
import { useNavigationStore } from '@/stores/navigationStore'
import { CoursesCatalogContent } from '@/features/shared-content/courses/CoursesCatalogContent'
import { HeroSection } from './components/HeroSection'

export function LearningDashboardView() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore()

  useEffect(() => {
    setSidebarContext('learning')
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning')
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel])

  return (
    <div className="h-full overflow-auto">
      <HeroSection />
      <div className="space-y-6 px-4 sm:px-6 md:px-12 py-6 md:py-12">
        <CoursesCatalogContent mode="dashboard" showTabs={true} />
      </div>
    </div>
  );
}
