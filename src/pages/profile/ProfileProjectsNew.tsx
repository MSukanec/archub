import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import ProjectHeroImage from '@/components/ui-custom/ProjectHeroImage'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { Folder, Plus, Calendar, MoreHorizontal, Edit, Trash2, Home, Search, Filter, X, Users, Settings, BarChart3, FileText, SortAsc, ImageIcon, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigationStore } from '@/stores/navigationStore'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ProjectItem from '@/components/cards/ProjectItem'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'
import { ActionBar } from '@/components/layout/desktop/ActionBar'

export default function ProfileProjects() {
  const [activeTab, setActiveTab] = useState("proyectos")
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('date_recent')
  const [filterByStatus, setFilterByStatus] = useState('all')
  
  const { openModal } = useGlobalModalStore()
  const [isMobile, setIsMobile] = useState(false)
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const projectId = userData?.preferences?.last_project_id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const { setSelectedProject } = useProjectContext()
  const [, navigate] = useLocation()
  const { setActions } = useMobileActionBar()

  // Project basic data states
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [clientName, setClientName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null)

  // Project data queries
  const { data: projectData } = useQuery({
    queryKey: ['project-data', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', projectId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching project data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!projectId && !!supabase && activeTab === "datos-basicos"
  });

  const { data: projectInfo } = useQuery({
    queryKey: ['project-info', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (error) {
        console.error('Error fetching project info:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!projectId && !!supabase && activeTab === "datos-basicos"
  });

  // Auto-save mutation for project data
  const saveProjectDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!projectId || !supabase) return;

      if (dataToSave.name !== undefined) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: dataToSave.name })
          .eq('id', projectId);

        if (projectError) throw projectError;
      }

      const projectDataFields = {
        description: dataToSave.description,
        internal_notes: dataToSave.internal_notes,
        client_name: dataToSave.client_name,
        contact_phone: dataToSave.contact_phone,
        email: dataToSave.email,
        address: dataToSave.address,
        city: dataToSave.city,
        state: dataToSave.state,
        country: dataToSave.country,
        zip_code: dataToSave.zip_code,
      };

      const cleanData = Object.fromEntries(
        Object.entries(projectDataFields).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanData).length > 0) {
        const { error } = await supabase
          .from('project_data')
          .upsert({
            project_id: projectId,
            ...cleanData
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar los datos del proyecto",
        variant: "destructive"
      });
    }
  });

  // Auto-save hooks
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ name: projectName }), projectName, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ description }), description, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ internal_notes: internalNotes }), internalNotes, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ client_name: clientName }), clientName, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ contact_phone: contactPhone }), contactPhone, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ email }), email, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ address }), address, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ city }), city, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ state }), state, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ country }), country, 1000);
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ zip_code: zipCode }), zipCode, 1000);

  // Load project data when available
  useEffect(() => {
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
    }
  }, [projectInfo]);

  useEffect(() => {
    if (projectData) {
      setDescription(projectData.description || '');
      setInternalNotes(projectData.internal_notes || '');
      setClientName(projectData.client_name || '');
      setContactPhone(projectData.contact_phone || '');
      setEmail(projectData.email || '');
      setAddress(projectData.address || '');
      setCity(projectData.city || '');
      setState(projectData.state || '');
      setCountry(projectData.country || '');
      setZipCode(projectData.zip_code || '');
      setProjectImageUrl(projectData.hero_image_url || null);
    }
  }, [projectData]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Limpiar acciones del action bar al salir de la página
  useEffect(() => {
    return () => {
      setActions({})
    }
  }, [setActions])

  // Filtrar y ordenar proyectos
  let filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchValue.toLowerCase())
    
    if (filterByStatus === "all") return matchesSearch
    if (filterByStatus === "active") return matchesSearch && project.status === 'active'
    if (filterByStatus === "planning") return matchesSearch && project.status === 'planning'
    if (filterByStatus === "completed") return matchesSearch && project.status === 'completed'
    if (filterByStatus === "on-hold") return matchesSearch && project.status === 'on-hold'
    
    return matchesSearch
  }) || []

  // Aplicar ordenamiento
  filteredProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date_oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      default:
        return 0
    }
  })

  // Mark active project and put it first - usando useUserOrganizationPreferences hook
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id
  filteredProjects = filteredProjects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }))
  
  if (activeProjectId) {
    filteredProjects = [
      ...filteredProjects.filter(project => project.id === activeProjectId),
      ...filteredProjects.filter(project => project.id !== activeProjectId)
    ]
  }

  // Mutación para seleccionar proyecto  
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !organizationId) {
        throw new Error('Required data not available');
      }
      
      // Usar la nueva tabla user_organization_preferences
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: organizationId,
          last_project_id: projectId
        });
      
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      setSelectedProject(projectId);
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      toast({
        title: "Proyecto seleccionado",
        description: "El proyecto se ha marcado como activo"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo seleccionar el proyecto",
        variant: "destructive"
      });
    }
  });

  const handleSelectProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId)
  }

  // Modal handlers
  const handleEdit = (project: any) => {
    openModal('project', { editingProject: project, isEditing: true })
  }

  const handleDeleteClick = (project: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar proyecto',
      description: 'Esta acción eliminará permanentemente el proyecto y todos sus datos asociados (diseño, obra, finanzas, etc.).',
      itemName: project.name,
      destructiveActionText: 'Eliminar',
      onConfirm: () => deleteProjectMutation.mutate(project.id),
      isLoading: deleteProjectMutation.isPending
    });
  }

  // Function to navigate to basic data after setting project as active
  const handleNavigateToBasicData = (project: any) => {
    selectProjectMutation.mutate(project.id)
    setActiveTab("datos-basicos")
  }

  // Mutación para eliminar proyecto usando el endpoint del servidor
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      console.log('Deleting project via server endpoint:', projectId)
      
      // Get auth session for authenticated API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }
      
      const response = await fetch(`/api/projects/${projectId}?organizationId=${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }
      
      const result = await response.json()
      console.log('Project deleted successfully:', result)
      return result
    },
    onMutate: async (projectId) => {
      // Optimistic update: remove from UI immediately  
      await queryClient.cancelQueries({ queryKey: ['projects', userData?.organization?.id] })
      
      const previousProjects = queryClient.getQueryData(['projects', userData?.organization?.id])
      
      // Update cache optimistically
      queryClient.setQueryData(['projects', userData?.organization?.id], (old: any[]) => {
        if (!old) return old
        return old.filter(project => project.id !== projectId)
      })
      
      return { previousProjects }
    },
    onSuccess: () => {
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado correctamente"
      })
      
      // Still invalidate for consistency but UI already updated
      queryClient.invalidateQueries({ queryKey: ['projects', userData?.organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any, projectId, context) => {
      // Restore on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', userData?.organization?.id], context.previousProjects)
      }
      
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el proyecto",
        variant: "destructive"
      })
    }
  })

  const clearFilters = () => {
    setSearchValue("")
    setSortBy('date_recent')
    setFilterByStatus('all')
  }

  const headerProps = {
    title: "Gestión de Proyectos",
    breadcrumb: [
      { name: "Perfil", href: "/profile/data" },
      { name: "Gestión de Proyectos", href: "/profile/projects" }
    ],
    actionButton: {
      label: "Nuevo Proyecto",
      icon: Plus,
      onClick: () => openModal('project', {})
    }
  }

  if (isLoading || projectsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando proyectos...
        </div>
      </Layout>
    )
  }

  const renderProjectsTab = () => (
    <div>
      {/* ProjectHeroCard - Show for active project */}
      {activeProjectId && (
        <ProjectHeroCard 
          project={filteredProjects.find(p => p.id === activeProjectId)}
          organizationId={organizationId}
        />
      )}

      {/* Mostrar contenido solo si hay proyectos */}
      {filteredProjects.length > 0 ? (
        <>
          {/* ActionBar - Show only when there are projects */}
          <ActionBar 
            filters={[]}
            actions={[
              {
                label: "Buscar",
                icon: Search,
                onClick: () => {
                  console.log("Search clicked");
                },
                variant: "ghost"
              },
              {
                label: "Filtros", 
                icon: Filter,
                onClick: () => {
                  console.log("Filters clicked");
                },
                variant: "ghost"
              },
              {
                label: "Limpiar",
                icon: X,
                onClick: () => {
                  setSearchValue("")
                  setFilterByStatus("all")
                  setSortBy("date_recent")
                },
                variant: "ghost"
              }
            ]}
          />
          {/* Single column layout for all screen sizes - full width */}
          <div className="grid grid-cols-1 gap-4 w-full">
            {filteredProjects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onSelect={(project) => handleSelectProject(project.id)}
                onNavigateToBasicData={handleNavigateToBasicData}
                isActiveProject={project.id === userOrgPrefs?.last_project_id}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Folder className="w-12 h-12" />}
          title={searchValue || filterByStatus !== 'all' ? "No se encontraron proyectos" : "No hay proyectos creados"}
          description={searchValue || filterByStatus !== 'all' 
            ? 'Prueba ajustando los filtros de búsqueda' 
            : 'Comienza creando tu primer proyecto para gestionar tu trabajo'
          }
          action={
            <Button
              onClick={() => openModal('project', {})}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          }
        />
      )}
    </div>
  );

  const renderBasicDataTab = () => {
    if (!projectId) {
      return (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No hay proyecto seleccionado"
          description="Selecciona un proyecto activo desde la tab de Proyectos para editar sus datos básicos"
        />
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Project Image Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Imagen del Proyecto</h3>
            </div>
            
            <ProjectHeroImage 
              projectId={projectId}
              currentImageUrl={projectImageUrl}
              onImageUpdate={(newUrl) => setProjectImageUrl(newUrl)}
            />
          </CardContent>
        </Card>

        {/* Project Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Información del Proyecto</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nombre del Proyecto</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ingresa el nombre del proyecto"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el proyecto..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="internal-notes">Notas Internas</Label>
                <Textarea
                  id="internal-notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas internas del proyecto..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Información del Cliente</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nombre del Cliente</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Teléfono de Contacto</Label>
                <Input
                  id="contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Teléfono de contacto"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Ubicación del Proyecto</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Estado/Provincia</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Estado o Provincia"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="País"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip-code">Código Postal</Label>
                <Input
                  id="zip-code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Código postal"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Layout headerProps={headerProps}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
          <TabsTrigger value="datos-basicos">Datos Básicos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proyectos" className="space-y-6">
          {renderProjectsTab()}
        </TabsContent>
        
        <TabsContent value="datos-basicos" className="space-y-6">
          {renderBasicDataTab()}
        </TabsContent>
      </Tabs>
    </Layout>
  )
}