import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Edit, Trash2 } from 'lucide-react'
import { useAdminCourses } from '@/features/learning/hooks'
import { useToast } from '@/hooks/use-toast'
import { Table } from '@/components/shared/trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '@/components/shared/EmptyState'
import { useGlobalModalStore } from '@/components/modal'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

export default function AdminCourseListTab() {
  const { toast } = useToast()
  const { openModal } = useGlobalModalStore()
  const [, navigate] = useLocation()
  
  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses()

  const handleCreateCourse = () => {
    openModal('course', {});
  };

  const handleEditCourse = (course: any) => {
    openModal('course', { course, isEditing: true });
  };

  const handleDeleteCourse = (course: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar curso',
      description: `Estás por eliminar el curso "${course.title}". Esta acción no se puede deshacer y se eliminarán todos los módulos, lecciones, inscripciones y progreso asociados.`,
      itemName: course.title,
      destructiveActionText: 'Eliminar curso',
      onDelete: async () => {
        try {
          const response = await fetch(`/api/admin/courses/${course.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to delete course');
          }

          toast({
            title: 'Curso eliminado',
            description: 'El curso fue eliminado correctamente'
          });

          // Invalidate cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
        } catch (error) {
          toast({
            title: 'Error al eliminar',
            description: 'No se pudo eliminar el curso',
            variant: 'destructive'
          });
        }
      }
    });
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/admin/courses/${courseId}`);
  };

  const courseColumns = [
    {
      key: 'title',
      label: 'Título',
      render: (course: any) => (
        <div>
          <div className="font-medium text-sm">{course.title}</div>
          <div className="text-xs text-muted-foreground">{course.slug}</div>
        </div>
      )
    },
    {
      key: 'visibility',
      label: 'Visibilidad',
      render: (course: any) => {
        const colors = {
          public: '#22c55e',
          private: '#ef4444',
          draft: '#f59e0b'
        }
        const labels = {
          public: 'Público',
          private: 'Privado',
          draft: 'Borrador'
        }
        return (
          <Badge style={{ backgroundColor: colors[course.visibility as keyof typeof colors], color: 'white' }}>
            {labels[course.visibility as keyof typeof labels]}
          </Badge>
        )
      }
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (course: any) => (
        <Badge style={{ backgroundColor: course.is_active ? 'var(--accent)' : '#6b7280', color: 'white' }}>
          {course.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'enrolled_count',
      label: 'Inscritos',
      render: (course: any) => (
        <div className="text-sm font-medium">
          {course.enrolled_count || 0}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (course: any) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(course.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    }
  ];

  return (
    <>
      {courses.length > 0 ? (
        <Table
          data={courses}
          columns={courseColumns}
          isLoading={coursesLoading}
          onRowClick={(course) => handleViewCourse(course.id)}
          rowActions={(course) => [
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEditCourse(course)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDeleteCourse(course),
              variant: 'destructive' as const
            }
          ]}
          emptyState={
            <EmptyState
              icon={<BookOpen className="w-12 h-12" />}
              title="No hay cursos"
              description="Comienza creando tu primer curso"
            />
          }
        />
      ) : (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="No hay cursos creados"
          description="Comienza creando tu primer curso de capacitación"
          action={
            <Button
              onClick={handleCreateCourse}
              className="mt-4"
              data-testid="button-create-course-empty"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Curso
            </Button>
          }
        />
      )}
    </>
  )
}
