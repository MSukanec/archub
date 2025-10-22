import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useMemo } from 'react'
import { useCourses } from '@/hooks/use-courses'
import { BookOpen, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useNavigationStore } from '@/stores/navigationStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PayButton from '@/components/learning/PayButton'
import CourseCard from '@/components/ui/cards/CourseCard'

export default function CourseList() {
  const [activeTab, setActiveTab] = useState('courses')
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore()
  
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const [, navigate] = useLocation()

  const [searchValue, setSearchValue] = useState('')

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    },
    enabled: !!supabase
  });

  useEffect(() => {
    setSidebarContext('learning')
    // Only set to 'learning' if not in 'general' mode (respects user's hub selection)
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning')
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel])

  // Get all progress for the current user across all courses
  const { data: allProgress = [] } = useQuery<any[]>({
    queryKey: ['/api/user/all-progress'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch('/api/user/all-progress', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!supabase
  });

  // Get enrollments for the current user
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ['/api/user/enrollments'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch('/api/user/enrollments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!supabase,
    staleTime: 0
  });

  // Get lessons count per course
  const { data: courseLessons = [] } = useQuery({
    queryKey: ['all-course-lessons'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, module_id, course_modules!inner(course_id)')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  // Calculate progress per course
  const courseProgress = useMemo(() => {
    const progressMap = new Map<string, { completed: number; total: number; percentage: number }>();
    
    courses.forEach(course => {
      // Get all lessons for this course
      const lessons = courseLessons.filter((l: any) => 
        l.course_modules?.course_id === course.id
      );
      
      const totalLessons = lessons.length;
      
      // Get completed lessons for this course
      const completedLessons = allProgress.filter((p: any) => 
        p.is_completed && lessons.some((l: any) => l.id === p.lesson_id)
      );
      
      const completedCount = completedLessons.length;
      const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      
      progressMap.set(course.id, {
        completed: completedCount,
        total: totalLessons,
        percentage
      });
    });
    
    return progressMap;
  }, [courses, courseLessons, allProgress]);

  // Apply search filter
  const filteredCourses = courses.filter(course => {
    const searchLower = searchValue.toLowerCase();
    const titleMatch = course.title?.toLowerCase().includes(searchLower);
    const descriptionMatch = course.short_description?.toLowerCase().includes(searchLower);
    const searchMatch = !searchValue || titleMatch || descriptionMatch;
    
    // Only show active courses for students
    return searchMatch && course.is_active;
  });

  const handleClearFilters = () => {
    setSearchValue('');
  };

  const handleViewDetail = (courseSlug: string) => {
    navigate(`/learning/courses/${courseSlug}`);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        style={{ 
          backgroundColor: isActive ? 'var(--accent)' : '#6b7280', 
          color: 'white' 
        }}
        className="text-xs"
      >
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  // Table columns configuration
  const columns = [
    {
      key: 'title',
      label: 'Curso',
      render: (course: any) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-medium text-sm">{course.title}</div>
            {course.short_description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {course.short_description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (course: any) => getStatusBadge(course.is_active)
    },
    {
      key: 'access',
      label: 'Acceso',
      render: (course: any) => {
        const enrollment = enrollments.find((e: any) => e.course_id === course.id);
        
        if (!enrollment) {
          return (
            <div className="text-xs text-muted-foreground">
              Sin inscripción
            </div>
          );
        }
        
        return (
          <div className="space-y-1">
            <div className="text-xs">
              <span className="text-muted-foreground">Inicio: </span>
              <span className="font-medium">
                {format(new Date(enrollment.started_at), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            {enrollment.expires_at && (
              <div className="text-xs">
                <span className="text-muted-foreground">Vence: </span>
                <span className="font-medium">
                  {format(new Date(enrollment.expires_at), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'progress',
      label: 'Progreso',
      render: (course: any) => {
        const progress = courseProgress.get(course.id) || { completed: 0, total: 0, percentage: 0 };
        
        return (
          <div className="space-y-1 min-w-[200px]">
            <div className="text-xs text-muted-foreground">
              {progress.completed} de {progress.total} lecciones
            </div>
            <div className="text-xs font-medium">{progress.percentage}%</div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (course: any) => {
        const enrollment = enrollments.find((e: any) => e.course_id === course.id);
        const hasActiveEnrollment = enrollment && enrollment.status === 'active';
        
        return (
          <div className="flex items-center gap-2">
            {!hasActiveEnrollment ? (
              <PayButton
                courseSlug={course.slug}
                currency="ARS"
                variant="default"
                size="sm"
              />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleViewDetail(course.slug)}
                className="h-8 gap-2"
                data-testid={`button-view-course-${course.id}`}
              >
                <Eye className="h-4 w-4" />
                <span>Ver curso</span>
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  const headerProps = {
    title: "Cursos",
    icon: BookOpen,
    tabs: [
      {
        id: 'courses',
        label: 'Cursos',
        isActive: activeTab === 'courses'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: []
  };

  if (coursesLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="p-8 text-center text-muted-foreground">
          Cargando cursos...
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'courses' && (
          <>
            {/* Desktop View */}
            <div className="hidden lg:block">
              {filteredCourses.length > 0 ? (
                <Table
                  data={filteredCourses}
                  columns={columns}
                  isLoading={coursesLoading}
                  emptyState={
                    <EmptyState
                      icon={<BookOpen className="w-12 h-12" />}
                      title="No hay cursos que coincidan"
                      description="Ajusta los filtros de búsqueda para encontrar cursos"
                    />
                  }
                  topBar={{
                    showSearch: true,
                    searchValue: searchValue,
                    onSearchChange: setSearchValue,
                    showClearFilters: searchValue !== '',
                    onClearFilters: handleClearFilters,
                    showFilter: false
                  }}
                />
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-12 h-12" />}
                  title="No hay cursos disponibles"
                  description="Actualmente no hay cursos activos para mostrar"
                />
              )}
            </div>

            {/* Mobile View */}
            <div className="lg:hidden">
              {filteredCourses.length > 0 ? (
                <div className="space-y-3">
                  {filteredCourses.map(course => {
                    const progress = courseProgress.get(course.id);
                    const enrollment = enrollments.find((e: any) => e.course_id === course.id && e.status === 'active');
                    
                    return (
                      <CourseCard
                        key={course.id}
                        course={course}
                        progress={progress}
                        enrollment={enrollment}
                        onViewDetail={handleViewDetail}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-12 h-12" />}
                  title="No hay cursos disponibles"
                  description="Actualmente no hay cursos activos para mostrar"
                />
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
