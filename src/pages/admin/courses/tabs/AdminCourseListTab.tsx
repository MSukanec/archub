import { Button } from '@/components/ui/button'
import { Plus, BookOpen } from 'lucide-react'
import { useCourses } from '@/hooks/use-courses'
import { useToast } from '@/hooks/use-toast'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useLocation } from 'wouter'

export default function AdminCourseListTab() {
  const { toast } = useToast()
  const { openModal } = useGlobalModalStore()
  const [, navigate] = useLocation()
  
  const { data: courses = [], isLoading: coursesLoading } = useCourses()

  const handleCreateCourse = () => {
    openModal('course', {});
  };

  const handleEditCourse = (course: any) => {
    openModal('course', { course, isEditing: true });
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
      key: 'created_at',
      label: 'Creado',
      render: (course: any) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(course.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (course: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleViewCourse(course.id)}
            className="h-8 px-3 text-xs"
            data-testid={`button-view-course-${course.id}`}
          >
            Editar
          </Button>
          <TableActionButtons
            onEdit={() => handleEditCourse(course)}
            onDelete={() => toast({ title: "Eliminar curso", description: "Función en desarrollo" })}
          />
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
