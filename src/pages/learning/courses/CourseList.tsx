import { Layout } from '@/layout/desktop/Layout'
import { useState, useEffect } from 'react'
import { useCourseListData, type CourseTabFilter } from '@/features/learning'
import { BookOpen, Clock, ShoppingCart } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useNavigationStore } from '@/stores/navigationStore'
import { Tabs } from '@/components/ui-custom/Tabs'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <Tabs
          tabs={[
            { value: 'all', label: 'Todos' },
            { value: 'enrolled', label: `Inscripto${enrolledCount > 0 ? ` (${enrolledCount})` : ''}` },
            { value: 'completed', label: `Finalizados${completedCount > 0 ? ` (${completedCount})` : ''}` }
          ]}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CourseTabFilter)}
        />

        {emptyState.show ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title={emptyState.title}
            description={emptyState.description}
            action={
              emptyState.ctaText && emptyState.onCtaClick ? (
                <Button
                  variant="default"
                  onClick={emptyState.onCtaClick}
                  data-testid="button-view-all-courses"
                >
                  {emptyState.ctaText}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courseViewModels.map((courseVM) => (
              <Card 
                key={courseVM.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
                data-testid={`course-card-${courseVM.id}`}
              >
                <div 
                  className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer relative overflow-hidden"
                  onClick={courseVM.onClick}
                >
                  {courseVM.coverUrl ? (
                    <img 
                      src={courseVM.coverUrl} 
                      alt={courseVM.displayTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-primary/20" />
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 
                    className="font-semibold text-base mb-3 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={courseVM.onClick}
                    data-testid={`course-title-${courseVM.id}`}
                  >
                    {courseVM.displayTitle}
                  </h3>

                  <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{courseVM.lessonsCountText}</span>
                    </div>
                    {courseVM.hasDuration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{courseVM.durationText} de contenido</span>
                      </div>
                    )}
                  </div>

                  {courseVM.showProgress && (
                    <div className="space-y-2 mb-4 mt-auto">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-semibold">{courseVM.progressPercent}%</span>
                      </div>
                      <Progress value={courseVM.progressPercent} className="h-2" />
                    </div>
                  )}

                  <div className={courseVM.showProgress ? '' : 'mt-auto'}>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={courseVM.onClick}
                      disabled={courseVM.ctaDisabled}
                      className="w-full"
                      data-testid={`button-course-action-${courseVM.id}`}
                    >
                      {courseVM.showCartIcon && (
                        <ShoppingCart className="h-4 w-4 mr-1" />
                      )}
                      {courseVM.ctaText}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
