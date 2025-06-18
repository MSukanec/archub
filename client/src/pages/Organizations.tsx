import { Building, Calendar, Plus, CheckCircle, ShieldCheck, BadgeCheck } from 'lucide-react'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useMutation } from '@tanstack/react-query'

type FilterType = 'all' | 'active' | 'archived' | 'system'

export default function Organizations() {
  const { data, isLoading, error, refetch } = useCurrentUser()
  const [searchValue, setSearchValue] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  // Mutation for selecting an organization
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      return await apiRequest('POST', `/api/user/select-organization`, { organization_id: organizationId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] })
      refetch()
    }
  })

  // Mock organizations data - in real implementation, this would come from data.organizations
  const organizations = useMemo(() => {
    if (!data?.organization) return []
    
    // For now, we'll create a mock array with the current organization
    // In a real implementation, this would be data.organizations
    return [
      {
        id: data.organization.id,
        name: data.organization.name,
        created_at: data.organization.created_at,
        is_active: data.organization.is_active,
        is_system: data.organization.is_system,
        plan: data.plan
      }
    ]
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
    // TODO: Implement organization creation
    console.log("Crear nueva organización")
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
        title="Organizations"
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
        title="Organizations"
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
      title="Organizations"
      actions={actions}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filters={filters}
      onClearFilters={handleClearFilters}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrganizations.map((org) => {
            const isSelected = org.id === selectedOrganization?.id
            const isSelecting = selectOrganizationMutation.isPending && selectOrganizationMutation.variables === org.id

            return (
              <Card
                key={org.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer hover:shadow-md",
                  isSelected
                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--card-border)]",
                  isSelecting && "opacity-50"
                )}
                onClick={() => handleSelectOrganization(org.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {org.name}
                    </CardTitle>
                    {isSelected && (
                      <Badge variant="default" className="bg-[var(--accent)] text-[var(--accent-text)]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Seleccionada
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Calendar className="h-4 w-4" />
                    Creada el {formatDate(org.created_at)}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {org.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Sistema
                      </Badge>
                    )}
                    
                    {org.is_active ? (
                      <Badge variant="secondary" className="text-xs bg-[var(--success)]/10 text-[var(--success)]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Archivada
                      </Badge>
                    )}

                    {org.plan && (
                      <Badge variant="secondary" className="text-xs">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        {org.plan.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredOrganizations.length === 0 && (searchValue || activeFilter !== 'all') && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-lg font-medium text-[var(--text-muted)] mb-2">No se encontraron organizaciones</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Intenta ajustar tu búsqueda o filtros
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomPageLayout>
  )
}