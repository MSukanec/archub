import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, FolderPlus, FileVideo } from 'lucide-react'
import { useCourses } from '@/hooks/use-courses'
import { useToast } from '@/hooks/use-toast'
import { useNavigationStore } from '@/stores/navigationStore'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useLocation } from 'wouter'

export default function AdminCourses() {
  const [activeTab, setActiveTab] = useState('courses')
  const { setSidebarLevel } = useNavigationStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()
  const [, navigate] = useLocation()
  
  const { data: courses = [], isLoading: coursesLoading } = useCourses()

  useEffect(() => {
    setSidebarLevel('admin')
  }, [setSidebarLevel])

  // Get all modules
  const { data: modules = [] } = useQuery({
    queryKey: ['all-course-modules'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('*, courses(title)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  // Get all lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['all-lessons'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('lessons')
        .select('*, course_modules(title, course_id, courses(title))')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  // Modal handlers
  const handleCreateCourse = () => {
    openModal('course', {});
  };

  const handleEditCourse = (course: any) => {
    openModal('course', { course, isEditing: true });
  };

  const handleCreateModule = () => {
    openModal('course-module', {});
  };

  const handleEditModule = (module: any) => {
    openModal('course-module', { module, isEditing: true });
  };

  const handleCreateLesson = () => {
    openModal('lesson', {});
  };

  const handleEditLesson = (lesson: any) => {
    openModal('lesson', { lesson, isEditing: true });
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/admin/courses/${courseId}`);
  };

  // Course columns
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

  // Module columns
  const moduleColumns = [
    {
      key: 'title',
      label: 'Módulo',
      render: (module: any) => (
        <div>
          <div className="font-medium text-sm">{module.title}</div>
          <div className="text-xs text-muted-foreground">
            Curso: {module.courses?.title || 'Sin curso'}
          </div>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (module: any) => (
        <div className="text-sm max-w-md truncate">
          {module.description || 'Sin descripción'}
        </div>
      )
    },
    {
      key: 'sort_index',
      label: 'Orden',
      render: (module: any) => (
        <div className="text-sm">{module.sort_index}</div>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (module: any) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(module.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (module: any) => (
        <TableActionButtons
          onEdit={() => handleEditModule(module)}
          onDelete={() => toast({ title: "Eliminar módulo", description: "Función en desarrollo" })}
        />
      )
    }
  ];

  // Lesson columns
  const lessonColumns = [
    {
      key: 'title',
      label: 'Lección',
      render: (lesson: any) => (
        <div>
          <div className="font-medium text-sm">{lesson.title}</div>
          <div className="text-xs text-muted-foreground">
            {lesson.course_modules?.courses?.title || 'Sin curso'} → {lesson.course_modules?.title || 'Sin módulo'}
          </div>
        </div>
      )
    },
    {
      key: 'vimeo_video_id',
      label: 'Video ID',
      render: (lesson: any) => (
        <div className="text-sm font-mono">
          {lesson.vimeo_video_id || <span className="text-muted-foreground">Sin video</span>}
        </div>
      )
    },
    {
      key: 'duration_sec',
      label: 'Duración',
      render: (lesson: any) => {
        if (!lesson.duration_sec) return <span className="text-sm text-muted-foreground">-</span>;
        const mins = Math.floor(lesson.duration_sec / 60);
        const secs = lesson.duration_sec % 60;
        return <div className="text-sm">{mins}:{secs.toString().padStart(2, '0')}</div>
      }
    },
    {
      key: 'free_preview',
      label: 'Vista Previa',
      render: (lesson: any) => (
        <Badge variant={lesson.free_preview ? "default" : "outline"}>
          {lesson.free_preview ? 'Gratis' : 'Pago'}
        </Badge>
      )
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (lesson: any) => (
        <Badge style={{ backgroundColor: lesson.is_active ? 'var(--accent)' : '#6b7280', color: 'white' }}>
          {lesson.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (lesson: any) => (
        <TableActionButtons
          onEdit={() => handleEditLesson(lesson)}
          onDelete={() => toast({ title: "Eliminar lección", description: "Función en desarrollo" })}
        />
      )
    }
  ];

  const headerProps = {
    title: "Administración de Cursos",
    icon: BookOpen,
    tabs: [
      {
        id: 'courses',
        label: 'Cursos',
        isActive: activeTab === 'courses'
      },
      {
        id: 'modules',
        label: 'Módulos',
        isActive: activeTab === 'modules'
      },
      {
        id: 'lessons',
        label: 'Lecciones',
        isActive: activeTab === 'lessons'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: [
      activeTab === 'courses' && (
        <Button
          key="create-course"
          onClick={handleCreateCourse}
          className="h-8 px-3 text-xs"
          data-testid="button-create-course"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Curso
        </Button>
      ),
      activeTab === 'modules' && (
        <Button
          key="create-module"
          onClick={handleCreateModule}
          className="h-8 px-3 text-xs"
          data-testid="button-create-module"
        >
          <FolderPlus className="w-4 h-4 mr-1" />
          Nuevo Módulo
        </Button>
      ),
      activeTab === 'lessons' && (
        <Button
          key="create-lesson"
          onClick={handleCreateLesson}
          className="h-8 px-3 text-xs"
          data-testid="button-create-lesson"
        >
          <FileVideo className="w-4 h-4 mr-1" />
          Nueva Lección
        </Button>
      ),
    ].filter(Boolean)
  }

  if (coursesLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="p-8 text-center text-muted-foreground">
          Cargando...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Tab: Cursos */}
        {activeTab === 'courses' && (
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
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Curso
                  </Button>
                }
              />
            )}
          </>
        )}

        {/* Tab: Módulos */}
        {activeTab === 'modules' && (
          <>
            {modules.length > 0 ? (
              <Table
                data={modules}
                columns={moduleColumns}
                isLoading={false}
                emptyState={
                  <EmptyState
                    icon={<FolderPlus className="w-12 h-12" />}
                    title="No hay módulos"
                    description="Los módulos organizan las lecciones dentro de un curso"
                  />
                }
              />
            ) : (
              <EmptyState
                icon={<FolderPlus className="w-12 h-12" />}
                title="No hay módulos creados"
                description="Los módulos organizan las lecciones dentro de un curso"
                action={
                  <Button
                    onClick={handleCreateModule}
                    className="mt-4"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Nuevo Módulo
                  </Button>
                }
              />
            )}
          </>
        )}

        {/* Tab: Lecciones */}
        {activeTab === 'lessons' && (
          <>
            {lessons.length > 0 ? (
              <Table
                data={lessons}
                columns={lessonColumns}
                isLoading={false}
                emptyState={
                  <EmptyState
                    icon={<FileVideo className="w-12 h-12" />}
                    title="No hay lecciones"
                    description="Las lecciones contienen el contenido de video del curso"
                  />
                }
              />
            ) : (
              <EmptyState
                icon={<FileVideo className="w-12 h-12" />}
                title="No hay lecciones creadas"
                description="Las lecciones contienen el contenido de video del curso"
                action={
                  <Button
                    onClick={handleCreateLesson}
                    className="mt-4"
                  >
                    <FileVideo className="w-4 h-4 mr-2" />
                    Nueva Lección
                  </Button>
                }
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
