import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'
import { DiscordWidget } from '@/components/learning/DiscordWidget'

interface CourseDataTabProps {
  courseId?: string;
}

export default function CourseDataTab({ courseId }: CourseDataTabProps) {
  // Get lessons count
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select(`
          id,
          course_modules!inner(course_id)
        `)
        .eq('course_modules.course_id', courseId)
        .eq('is_active', true);
        
      if (error) {
        console.error('Error fetching lessons:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  // Get all progress for the current course
  const { data: courseProgress = [] } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch(`/api/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!courseId && !!supabase,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Calculate course statistics
  const courseStats = useMemo(() => {
    const totalLessons = lessons.length;
    const completedLessons = courseProgress.filter((p: any) => p.is_completed).length;
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    return {
      totalLessons,
      completedLessons,
      overallProgress
    };
  }, [lessons, courseProgress]);

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Progreso del Curso
          </CardTitle>
          <CardDescription>
            {courseStats.overallProgress}% del curso completado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">0%</span>
              <span className="font-bold text-lg">{courseStats.overallProgress}%</span>
              <span className="text-muted-foreground">100%</span>
            </div>
            <Progress value={courseStats.overallProgress} className="h-4 bg-gray-200" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{courseStats.completedLessons}</div>
                <div className="text-xs text-muted-foreground">Lecciones completadas</div>
              </div>
              <div className="text-center border-l">
                <div className="text-3xl font-bold">{courseStats.totalLessons}</div>
                <div className="text-xs text-muted-foreground">Total de lecciones</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discord Community Widget */}
      <DiscordWidget />
    </div>
  )
}
