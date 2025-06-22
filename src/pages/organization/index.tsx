import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Building, Crown, Plus, Users, Calendar, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export default function OrganizationManagement() {
  const [searchValue, setSearchValue] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrar organizaciones basado en búsqueda y filtros
  const filteredOrganizations = userData?.organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchValue.toLowerCase())
    
    if (selectedFilter === "all") return matchesSearch
    if (selectedFilter === "active") return matchesSearch && org.is_active
    if (selectedFilter === "system") return matchesSearch && org.is_system
    if (selectedFilter === "regular") return matchesSearch && !org.is_system
    
    return matchesSearch
  }) || []

  // Mutación para seleccionar organización
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Organización seleccionada",
        description: "La organización se ha seleccionado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo seleccionar la organización",
        variant: "destructive"
      })
    }
  })

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganizationMutation.mutate(organizationId)
  }

  const clearFilters = () => {
    setSearchValue("")
    setSelectedFilter("all")
  }

  const headerProps = {
    title: "Gestión de Organizaciones",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    filters: [
      { 
        label: "Todas", 
        onClick: () => setSelectedFilter("all"),
        active: selectedFilter === "all"
      },
      { 
        label: "Activas", 
        onClick: () => setSelectedFilter("active"),
        active: selectedFilter === "active"
      },
      { 
        label: "Sistema", 
        onClick: () => setSelectedFilter("system"),
        active: selectedFilter === "system"
      },
      { 
        label: "Regulares", 
        onClick: () => setSelectedFilter("regular"),
        active: selectedFilter === "regular"
      }
    ],
    onClearFilters: clearFilters,
    actions: (
      <Button className="h-8 px-3 text-sm">
        <Plus className="w-4 h-4 mr-2" />
        Nueva Organización
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Organización actual */}
        {userData?.organization && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Organización Actual</h3>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                  {userData.organization.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-blue-900">{userData.organization.name}</p>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Calendar className="w-3 h-3" />
                  {new Date(userData.organization.created_at).toLocaleDateString('es-ES')}
                  {userData.organization.is_system && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Sistema
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">{userData?.organizations?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Activas</p>
                  <p className="text-xl font-bold">
                    {userData?.organizations?.filter(org => org.is_active).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Sistema</p>
                  <p className="text-xl font-bold">
                    {userData?.organizations?.filter(org => org.is_system).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Regulares</p>
                  <p className="text-xl font-bold">
                    {userData?.organizations?.filter(org => !org.is_system).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de organizaciones */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((organization) => {
            const isSelected = userData?.organization?.id === organization.id
            
            return (
              <Card 
                key={organization.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSelectOrganization(organization.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-sm">
                          {organization.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {organization.name}
                          {isSelected && <Crown className="w-4 h-4 text-blue-600" />}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      Creada: {new Date(organization.created_at).toLocaleDateString('es-ES')}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={organization.is_active ? "default" : "secondary"}>
                        {organization.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                      
                      {organization.is_system && (
                        <Badge variant="outline">
                          <Shield className="w-3 h-3 mr-1" />
                          Sistema
                        </Badge>
                      )}
                    </div>

                    {organization.plan && (
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-gray-600">Plan: {organization.plan.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          ${organization.plan.price}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredOrganizations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron organizaciones
              </h3>
              <p className="text-gray-600">
                {searchValue || selectedFilter !== "all" 
                  ? "Intenta ajustar los filtros de búsqueda" 
                  : "Aún no perteneces a ninguna organización"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}