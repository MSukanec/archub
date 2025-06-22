import { Building, Calendar, Plus, CheckCircle, ShieldCheck, BadgeCheck, Crown, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useMutation } from '@tanstack/react-query'
import { NewOrganizationModal } from '@/modals/NewOrganizationModal'

type FilterType = 'all' | 'active' | 'archived' | 'system'

export default function Organizations() {
  const { data, isLoading, error, refetch } = useCurrentUser()
  const [searchValue, setSearchValue] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [editingOrganization, setEditingOrganization] = useState<any>(null)
  const [showNewOrgModal, setShowNewOrgModal] = useState(false)

  // Mutation for selecting an organization
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch('/api/user/select-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': data?.user?.id || ''
        },
        body: JSON.stringify({ organization_id: organizationId })
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      refetch()
    }
  })

  const organizations = useMemo(() => {
    if (!data?.organizations?.length) return []
    return data.organizations
  }, [data])

  const selectedOrganization = data?.organization

  // Filter organizations based on search and filter type
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations

    // Apply search filter
    if (searchValue.trim()) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    }

    // Apply type filter
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(org => org.is_active)
        break
      case 'archived':
        filtered = filtered.filter(org => !org.is_active)
        break
      case 'system':
        filtered = filtered.filter(org => org.is_system)
        break
      default:
        break
    }

    return filtered
  }, [organizations, searchValue, activeFilter])

  const filters = [
    { label: "Organizaciones activas", onClick: () => setActiveFilter('active') },
    { label: "Organizaciones archivadas", onClick: () => setActiveFilter('archived') },
    { label: "Organizaciones del sistema", onClick: () => setActiveFilter('system') },
  ]

  const handleCreateOrganization = () => {
    setEditingOrganization(null)
    setShowNewOrgModal(true)
  }

  const handleEditOrganization = (org: any) => {
    setEditingOrganization(org)
    setShowNewOrgModal(true)
  }

  const handleDeleteOrganization = (org: any) => {
    // TODO: Implement delete functionality
    console.log('Delete organization:', org)
  }

  const handleSelectOrganization = (organizationId: string) => {
    if (organizationId !== selectedOrganization?.id) {
      selectOrganizationMutation.mutate(organizationId)
    }
  }

  const handleClearFilters = () => {
    setSearchValue("")
    setActiveFilter('all')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const actions = (
    <Button size="sm" onClick={handleCreateOrganization}>
      <Plus className="w-4 h-4 mr-2" />
      Nueva organización
    </Button>
  )

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={Building}
        title="Organizations"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-[var(--card-hover-bg)] rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-[var(--card-hover-bg)] rounded w-1/2"></div>
                  <div className="h-4 bg-[var(--card-hover-bg)] rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout
        icon={Building}
        title="Gestión de Organizaciones"
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
                <p className="text-[var(--destructive)] mb-2">Error al cargar las organizaciones</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {error.message || 'No se pudo conectar con la base de datos'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomPageLayout>
    )
  }

  if (!organizations.length) {
    return (
      <CustomPageLayout
        icon={Building}
        title="Gestión de Organizaciones"
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
                <Building className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-lg font-medium text-[var(--text-muted)] mb-2">No se encontraron organizaciones</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {searchValue || activeFilter !== 'all' 
                    ? "Intenta ajustar tu búsqueda o filtros" 
                    : "Aún no eres miembro de ninguna organización."
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
      icon={Building}
      title="Gestión de Organizaciones"
      actions={actions}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onClearFilters={handleClearFilters}
    >
      {/* Encabezados de columnas */}
      <div className="w-full px-4 py-2 border-b border-border/50 mb-3">
        <div className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {/* Fecha */}
          <div className="flex-shrink-0 w-24">
            Fecha
          </div>
          
          {/* Creador */}
          <div className="w-32 flex-shrink-0 px-2">
            Creador
          </div>
          
          {/* Nombre */}
          <div className="flex-1 min-w-0 px-4">
            Organización
          </div>

          {/* Plan */}
          <div className="w-32 flex-shrink-0 px-2">
            Plan
          </div>

          {/* Estado */}
          <div className="w-28 flex-shrink-0">
            Estado
          </div>

          {/* Acciones */}
          <div className="w-10 flex-shrink-0">
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrganizations.map((org) => {
          const isSelected = org.id === selectedOrganization?.id
          const isSelecting = selectOrganizationMutation.isPending && selectOrganizationMutation.variables === org.id

          return (
            <Card 
              key={org.id} 
              className={cn(
                "w-full transition-all duration-200 hover:shadow-md cursor-pointer",
                isSelected && "border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--accent)]/5"
              )}
              onClick={() => handleSelectOrganization(org.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between w-full">
                  {/* Fecha */}
                  <div className="flex-shrink-0 w-24">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(org.created_at)}
                    </span>
                  </div>

                  {/* Creador */}
                  <div className="w-32 flex-shrink-0 px-2">
                    <span className="text-xs text-muted-foreground truncate">
                      {/* TODO: Get creator info from org.created_by */}
                      Sistema
                    </span>
                  </div>

                  {/* Nombre de la organización */}
                  <div className="flex-1 min-w-0 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{org.name}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20">
                          Seleccionada
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="w-32 flex-shrink-0 px-2">
                    <div className="flex items-center gap-1">
                      {org.plan && (
                        <>
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-muted-foreground truncate">{org.plan.name}</span>
                        </>
                      )}
                      {!org.plan && (
                        <span className="text-xs text-muted-foreground">Sin plan</span>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="w-28 flex-shrink-0">
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                      {org.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  {/* Acciones */}
                  <div className="w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditOrganization(org)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteOrganization(org)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {isSelecting && (
                  <div className="flex items-center justify-center py-2 mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal for creating/editing organizations */}
      <NewOrganizationModal
        open={showNewOrgModal}
        onClose={() => {
          setShowNewOrgModal(false)
          setEditingOrganization(null)
        }}
        editingOrganization={editingOrganization}
      />
    </CustomPageLayout>
  )
}