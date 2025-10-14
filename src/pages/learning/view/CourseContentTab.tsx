import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BookOpen } from 'lucide-react'

interface CourseContentTabProps {
  courseId?: string;
}

export default function CourseContentTab({ courseId }: CourseContentTabProps) {
  // Get course data
  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!courseId && !!supabase
  });

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Two Column Layout - Section descriptions left, content right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Información Básica */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fundamentales del curso.
          </p>
        </div>

        {/* Right Column - Información Básica Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título del Curso</label>
              <div className="text-sm text-foreground px-3 py-2 bg-muted/30 rounded-md">
                {courseData?.title || '-'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción Corta</label>
              <div className="text-sm text-foreground px-3 py-2 bg-muted/30 rounded-md min-h-[60px]">
                {courseData?.short_description || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
