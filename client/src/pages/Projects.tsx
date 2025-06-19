import { useState, useMemo } from 'react'
import { Folder, Plus, Calendar, Crown } from 'lucide-react'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'active' | 'completed' | 'on-hold'

export default function Projects() {
  const { data, isLoading, error, refetch } = useCurrentUser()
  const [searchValue, setSearchValue] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  // Mutation for selecting a project
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch('/api/user/select-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': data?.user?.id || ''
        },
        body: JSON.stringify({ project_id: projectId })
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      refetch()
    }
  })

  // Mock projects data - in real implementation, this would come from data.projects
  const projects = useMemo(() => {
    if (!data?.organization) return []
    
    // For now, we'll create mock projects based on the current organization
    // In a real implementation, this would be data.projects filtered by organization_id
    return [
      {
        id: 'proj-1',
        name: 'Torre Residencial Norte',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        description: 'Construcción de torre de 25 pisos',
        progress: 65,
        budget: 2500000,
        team_size: 12
      },
      {
        id: 'proj-2', 
        name: 'Centro Comercial Plaza',
        status: 'on-hold',
        created_at: '2024-02-20T14:30:00Z',
        description: 'Centro comercial de 3 niveles',
        progress: 30,
        budget: 4200000,
        team_size: 8
      },
      {
        id: 'proj-3',
        name: 'Complejo de Oficinas',
        status: 'completed',
        created_at: '2023-11-10T09:15:00Z',
        description: 'Edificio corporativo de 15 pisos',
        progress: 100,
        budget: 3800000,
        team_size: 15
      }
    ]
  }, [data])

  const selectedProject = data?.preferences?.last_project_id

  // Filter projects based on search and filter type
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchValue.toLowerCase())
      
      const matchesFilter = activeFilter === 'all' || project.status === activeFilter
      
      return matchesSearch && matchesFilter
    })
  }, [projects, searchValue, activeFilter])

  const handleSelectProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId)
  }

  const filters = [
    { label: 'Todos los proyectos', onClick: () => setActiveFilter('all') },
    { label: 'Activos', onClick: () => setActiveFilter('active') },
    { label: 'Completados', onClick: () => setActiveFilter('completed') },
    { label: 'En pausa', onClick: () => setActiveFilter('on-hold') },
  ]

  const handleClearFilters = () => {
    setSearchValue("")
    setActiveFilter('all')
  }

  const actions = (
    <Button className="bg-[var(--primary-bg)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]">
      <Plus className="w-4 h-4 mr-2" />
      Nuevo proyecto
    </Button>
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', variant: 'default' as const },
      completed: { label: 'Completado', variant: 'secondary' as const },
      'on-hold': { label: 'En pausa', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={Folder}
        title="Proyectos"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-lg font-medium text-[var(--text-muted)]">Cargando proyectos...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout
        icon={Folder}
        title="Proyectos"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-lg font-medium text-[var(--text-muted)] mb-2">Error al cargar proyectos</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Intenta recargar la página o contacta al soporte técnico.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomPageLayout>
    )
  }

  if (!filteredProjects.length) {
    return (
      <CustomPageLayout
        icon={Folder}
        title="Proyectos"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-lg font-medium text-[var(--text-muted)] mb-2">No se encontraron proyectos</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {searchValue || activeFilter !== 'all' 
                    ? "Intenta ajustar tu búsqueda o filtros" 
                    : "Aún no hay proyectos en esta organización."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomPageLayout>
    )
  }

  return (
    <CustomPageLayout
      icon={Folder}
      title="Proyectos"
      actions={actions}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onClearFilters={handleClearFilters}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const isSelected = project.id === selectedProject
            const isSelecting = selectProjectMutation.isPending && selectProjectMutation.variables === project.id

            return (
              <Card
                key={project.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer hover:shadow-md",
                  isSelected
                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--card-border)]",
                  isSelecting && "opacity-50"
                )}
                onClick={() => handleSelectProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold text-[var(--card-fg)]">
                        {project.name}
                      </CardTitle>
                      {isSelected && (
                        <Crown className="h-4 w-4 text-[var(--accent)]" />
                      )}
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {project.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Progreso</span>
                      <span className="font-medium text-[var(--card-fg)]">{project.progress}%</span>
                    </div>
                    
                    <div className="w-full bg-[var(--card-bg)] rounded-full h-2">
                      <div 
                        className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">Presupuesto</span>
                        <p className="font-medium text-[var(--card-fg)]">{formatCurrency(project.budget)}</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Equipo</span>
                        <p className="font-medium text-[var(--card-fg)]">{project.team_size} miembros</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--card-border)]">
                      <Calendar className="h-3 w-3" />
                      <span>Creado el {formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </CustomPageLayout>
  )
}