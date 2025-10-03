import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useCourses } from '@/hooks/use-courses'
import { BookOpen, Plus, Search, Filter, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons'
import { useNavigationStore } from '@/stores/navigationStore'

export default function CourseList() {
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState('courses')
  const { setSidebarContext, setSidebarLevel } = useNavigationStore()
  
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [, navigate] = useLocation()

  // Filter states
  const [filterByVisibility, setFilterByVisibility] = useState('all')
  const [filterByStatus, setFilterByStatus] = useState('all')

  // Estado para búsqueda en tabla
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    setSidebarContext('learning')
    setSidebarLevel('learning')
  }, [setSidebarContext, setSidebarLevel])

  // Apply filters including search
  const filteredCourses = courses.filter(course => {
    // Filter by search
    const searchLower = searchValue.toLowerCase();
    const titleMatch = course.title?.toLowerCase().includes(searchLower);
    const descriptionMatch = course.short_description?.toLowerCase().includes(searchLower);
    const searchMatch = !searchValue || titleMatch || descriptionMatch;
    
    // Filter by visibility
    const matchesVisibility = filterByVisibility === 'all' || 
      course.visibility === filterByVisibility;
    
    // Filter by status
    const matchesStatus = filterByStatus === 'all' || 
      (filterByStatus === 'active' ? course.is_active : !course.is_active);

    return searchMatch && matchesVisibility && matchesStatus;
  })

  const handleClearFilters = () => {
    setSearchValue('')
    setFilterByVisibility('all')
    setFilterByStatus('all')
  }

  const handleViewDetail = (courseId: string) => {
    navigate(`/learning/courses/${courseId}`)
  }

  const handleEdit = (course: any) => {
    // TODO: Implementar modal de edición de curso
    toast({
      title: "Función en desarrollo",
      description: "La edición de cursos estará disponible próximamente"
    })
  }

  const handleDeleteClick = (course: any) => {
    // TODO: Implementar eliminación de curso
    toast({
      title: "Función en desarrollo",
      description: "La eliminación de cursos estará disponible próximamente"
    })
  }

  // Función para formatear el estado del curso
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
    )
  }

  // Función para formatear la visibilidad
  const getVisibilityBadge = (visibility: string) => {
    const config = {
      'public': { color: '#22c55e', text: 'Público' },
      'private': { color: '#ef4444', text: 'Privado' },
      'draft': { color: '#f59e0b', text: 'Borrador' }
    }
    
    const visConfig = config[visibility as keyof typeof config] || { color: '#6b7280', text: visibility }
    
    return (
      <Badge 
        style={{ backgroundColor: visConfig.color, color: 'white' }}
        className="text-xs"
      >
        {visConfig.text}
      </Badge>
    )
  }

  // Configuración de las columnas de la tabla
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
      key: 'visibility',
      label: 'Visibilidad',
      render: (course: any) => getVisibilityBadge(course.visibility)
    },
    {
      key: 'status',
      label: 'Estado',
      render: (course: any) => getStatusBadge(course.is_active)
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      render: (course: any) => (
        <div className="text-sm text-muted-foreground">
          {course.created_at ? format(new Date(course.created_at), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (course: any) => (
        <TableActionButtons
          onEdit={() => handleEdit(course)}
          onDelete={() => handleDeleteClick(course)}
          additionalButtons={[
            <Button
              key="view"
              variant="default"
              size="sm"
              onClick={() => handleViewDetail(course.id)}
              className="h-8 gap-2"
            >
              <Eye className="h-4 w-4" />
              <span>Ver curso</span>
            </Button>
          ]}
        />
      )
    }
  ]

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
    actions: [
      <Button
        key="create-course"
        onClick={() => toast({
          title: "Función en desarrollo",
          description: "La creación de cursos estará disponible próximamente"
        })}
        className="h-8 px-3 text-xs"
      >
        <Plus className="w-4 h-4 mr-1" />
        Nuevo Curso
      </Button>
    ]
  }

  if (coursesLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="p-8 text-center text-muted-foreground">
          Cargando cursos...
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
            {/* Courses Table */}
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
                  showClearFilters: searchValue !== '' || filterByVisibility !== 'all' || filterByStatus !== 'all',
                  onClearFilters: handleClearFilters,
                  showFilter: true,
                  renderFilterContent: () => (
                    <div className="space-y-4 w-72">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Visibilidad</label>
                        <select 
                          value={filterByVisibility} 
                          onChange={(e) => setFilterByVisibility(e.target.value)}
                          className="w-full h-8 px-2 text-xs border rounded"
                        >
                          <option value="all">Todas las visibilidades</option>
                          <option value="public">Público</option>
                          <option value="private">Privado</option>
                          <option value="draft">Borrador</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Estado</label>
                        <select 
                          value={filterByStatus} 
                          onChange={(e) => setFilterByStatus(e.target.value)}
                          className="w-full h-8 px-2 text-xs border rounded"
                        >
                          <option value="all">Todos los estados</option>
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  ),
                  isFilterActive: filterByVisibility !== 'all' || filterByStatus !== 'all'
                }}
              />
            ) : (
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="No hay cursos creados"
                description="Comienza creando tu primer curso para compartir conocimiento"
                action={
                  <Button
                    onClick={() => toast({
                      title: "Función en desarrollo",
                      description: "La creación de cursos estará disponible próximamente"
                    })}
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
      </div>
    </Layout>
  )
}
