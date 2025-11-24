import { DashboardLayout as Layout } from "@/layouts"
import { useState, useEffect } from 'react'
import { useCourseListData, type CourseTabFilter, UnifiedCourseGrid } from '@/features/learning'
import { BookOpen } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'

export default function CourseList() {
  const [activeTab, setActiveTab] = useState<CourseTabFilter>('all')
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore()

  useEffect(() => {
    setSidebarContext('learning')
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning')
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel])

  const {
    courseViewModels,
    enrolledCount,
    completedCount,
    isLoading,
    emptyState
  } = useCourseListData(activeTab, () => setActiveTab('all'));

  const headerProps = {
    title: "Cursos",
    icon: BookOpen,
    tabs: [],
    onTabChange: () => {},
    actions: []
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  // Transform courseViewModels to UnifiedCourseGrid format
  const coursesData = courseViewModels.map((courseVM) => ({
    id: courseVM.id,
    slug: courseVM.slug,
    title: courseVM.displayTitle,
    short_description: undefined,
    cover_url: courseVM.coverUrl,
    price: undefined,
    instructor_name: undefined,
    instructor_title: undefined,
    badge_text: undefined,
    isEnrolled: courseVM.enrollmentStatus === 'enrolled' || courseVM.enrollmentStatus === 'completed',
    progress: courseVM.showProgress ? {
      completed: Math.round(courseVM.progressPercent * courseVM.progressPercent / 100), // Approximate
      total: 100,
      percentage: courseVM.progressPercent
    } : undefined,
    onViewCourse: courseVM.onClick,
    showCartIcon: courseVM.showCartIcon,
  }));

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {emptyState.show && <div style={{ display: 'none' }} />}
        <UnifiedCourseGrid 
          courses={emptyState.show ? [] : coursesData}
          isLoading={isLoading}
          showTabs={true}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as CourseTabFilter)}
          enrolledCount={enrolledCount}
          completedCount={completedCount}
        />
      </div>
    </Layout>
  );
}
