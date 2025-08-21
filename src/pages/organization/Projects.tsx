import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { Folder, Plus, Settings, ImageIcon, FileText, Users, MapPin, Home, Search, Filter, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ProjectHeroCard from '@/components/ui-custom/ProjectHeroCard'
import ProjectRow from '@/components/data-row/rows/ProjectRow'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ProjectHeroImage from '@/components/ui-custom/ProjectHeroImage'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { queryClient } from '@/lib/queryClient'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'

export default function Projects() {
  const { openModal } = useGlobalModalStore()
  const [activeTab, setActiveTab] = useState('projects')
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: projects = [], isLoading: projectsLoading } = useProjects(organizationId || undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSelectedProject } = useProjectContext()
  const [, navigate] = useLocation()

  // Filter states
  const [filterByType, setFilterByType] = useState('all')
  const [filterByStatus, setFilterByStatus] = useState('all')

  // Mobile action bar
  const { 
    setActions, 
    setShowActionBar, 
    clearActions 
  } = useActionBarMobile()
  const isMobile = useMobile()

  // Mark active project using useUserOrganizationPreferences hook
  const { data: userOrgPrefs } = useUserOrganizationPreferences(organizationId);
  const activeProjectId = userOrgPrefs?.last_project_id

  // BasicData form states
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

  // Get project data for BasicData tab
  const { data: projectData } = useQuery({
    queryKey: ['project-data', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', activeProjectId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching project data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!activeProjectId && !!supabase && activeTab === 'basic-data'
  });

  // Get actual project info for BasicData tab
  const { data: projectInfo } = useQuery({
    queryKey: ['project-info', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', activeProjectId)
        .single();
        
      if (error) {
        console.error('Error fetching project info:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!activeProjectId && !!supabase && activeTab === 'basic-data'
  });

  // Auto-save mutation for project data
  const saveProjectDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!activeProjectId || !supabase) return;

      // Update project name in projects table
      if (dataToSave.name !== undefined) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: dataToSave.name })
          .eq('id', activeProjectId);

        if (projectError) throw projectError;
      }

      // Update project data in project_data table
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

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(projectDataFields).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanData).length > 0) {
        const { error } = await supabase
          .from('project_data')
          .upsert({
            project_id: activeProjectId,
            ...cleanData
          });

        if (error) throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios automáticamente",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook for BasicData tab
  const { isSaving } = useDebouncedAutoSave({
    data: {
      name: projectName,
      description,
      internal_notes: internalNotes,
      client_name: clientName,
      contact_phone: contactPhone,
      email,
      address,
      city,
      state,
      country,
      zip_code: zipCode,
    },
    saveFn: async (data) => {
      await saveProjectDataMutation.mutateAsync(data);
      
      // Show success toast
      toast({
        title: "Datos guardados",
        description: "Los cambios se han guardado automáticamente",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project-info', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    delay: 750,
    enabled: !!activeProjectId && !!userData?.user?.id && activeTab === 'basic-data'
  });

  // Populate BasicData form when data loads
  useEffect(() => {
    if (projectInfo && activeTab === 'basic-data') {
      setProjectName(projectInfo.name || '');
    }
    if (projectData && activeTab === 'basic-data') {
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
      setProjectImageUrl(projectData.project_image_url || null);
    }
  }, [projectInfo, projectData, activeTab]);
  
  const projectsWithActive = projects.map(project => ({
    ...project,
    is_active: project.id === activeProjectId
  }))
  
  // Apply filters
  const filteredProjects = projectsWithActive.filter(project => {
    const matchesType = filterByType === 'all' || 
      (project.description?.toLowerCase().includes(filterByType.toLowerCase())) ||
      (project.project_data?.client_name?.toLowerCase().includes(filterByType.toLowerCase())) ||
      (project.status?.toLowerCase() === filterByType.toLowerCase());
    
    const matchesStatus = filterByStatus === 'all' || 
      project.status?.toLowerCase() === filterByStatus.toLowerCase();

    return matchesType && matchesStatus;
  })
  
  // Put active project first
  const sortedProjects = activeProjectId ? [
    ...filteredProjects.filter(project => project.id === activeProjectId),
    ...filteredProjects.filter(project => project.id !== activeProjectId)
  ] : filteredProjects

  const handleClearFilters = () => {
    setFilterByType('all')
    setFilterByStatus('all')
  }

  // Mutación para seleccionar proyecto  
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !organizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: organizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        })
      
      if (error) throw error
      return projectId;
    },
    onSuccess: (projectId) => {
      setSelectedProject(projectId, organizationId);
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, organizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      toast({
        title: "Proyecto seleccionado",
        description: "El proyecto se ha seleccionado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  })

  const handleSelectProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId)
  }

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

  const handleNavigateToBasicData = (project: any) => {
    selectProjectMutation.mutate(project.id)
    // Los datos básicos ahora se manejan en la tab "Datos Básicos" de esta misma página
    setActiveTab('basic-data')
  }

  // Mutación para eliminar proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
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
      
      return await response.json()
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', userData?.organization?.id] })
      
      const previousProjects = queryClient.getQueryData(['projects', userData?.organization?.id])
      
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
      
      queryClient.invalidateQueries({ queryKey: ['projects', userData?.organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any, projectId, context) => {
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

  // Configure mobile action bar only for projects tab
  useEffect(() => {
    if (isMobile && activeTab === 'projects') {
      setActions({
        home: { 
          id: 'home', 
          label: 'Inicio', 
          icon: <Home className="h-6 w-6" />,
          onClick: () => {} 
        },
        search: { 
          id: 'search', 
          label: 'Buscar', 
          icon: <Search className="h-6 w-6" />,
          onClick: () => {} 
        },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nuevo Proyecto',
          onClick: () => openModal('project', {}),
          variant: 'primary'
        },
        filter: { 
          id: 'filter', 
          label: 'Filtros', 
          icon: <Filter className="h-6 w-6" />,
          onClick: () => {},
          filterConfig: {
            filters: [
              {
                key: 'type',
                label: 'Tipo de proyecto',
                value: filterByType,
                onChange: setFilterByType,
                allOptionLabel: 'Todos los tipos',
                placeholder: 'Seleccionar tipo...',
                options: [
                  { value: 'vivienda', label: 'Vivienda' },
                  { value: 'obra nueva', label: 'Obra Nueva' },
                  { value: 'remodelacion', label: 'Remodelación' },
                  { value: 'mantenimiento', label: 'Mantenimiento' },
                  { value: 'consultoria', label: 'Consultoría' }
                ]
              },
              {
                key: 'status',
                label: 'Modalidad',
                value: filterByStatus,
                onChange: setFilterByStatus,
                allOptionLabel: 'Todas las modalidades',
                placeholder: 'Seleccionar modalidad...',
                options: [
                  { value: 'activo', label: 'Activo' },
                  { value: 'completado', label: 'Completado' },
                  { value: 'pausado', label: 'Pausado' },
                  { value: 'cancelado', label: 'Cancelado' },
                  { value: 'planificacion', label: 'Planificación' }
                ]
              }
            ],
            onClearFilters: handleClearFilters
          }
        },
        notifications: { 
          id: 'notifications', 
          label: 'Notificaciones', 
          icon: <Bell className="h-6 w-6" />,
          onClick: () => {} 
        },
      })
      setShowActionBar(true)
    } else if (isMobile) {
      // Clear action bar for other tabs
      clearActions()
    }

    return () => {
      if (isMobile && activeTab === 'projects') {
        clearActions()
      }
    }
  }, [isMobile, activeTab, openModal, filterByType, filterByStatus])

  const headerProps = {
    title: "Gestión de Proyectos",
    icon: Folder,
    breadcrumb: [
      { name: "Perfil", href: "/profile/data" },
      { name: "Gestión de Proyectos", href: "/profile/projects" }
    ],
    tabs: [
      {
        id: 'projects',
        label: 'Proyectos',
        isActive: activeTab === 'projects'
      },
      {
        id: 'basic-data',
        label: 'Datos Básicos',
        isActive: activeTab === 'basic-data'
      }
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actionButton: activeTab === 'projects' ? {
      label: "Nuevo Proyecto",
      icon: Plus,
      onClick: () => openModal('project', {})
    } : undefined
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

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Tab: Proyectos */}
        {activeTab === 'projects' && (
          <>
            {/* ProjectHeroCard - Show for active project */}
            {activeProjectId && (
              <ProjectHeroCard 
                project={sortedProjects.find(p => p.id === activeProjectId)}
                organizationId={organizationId}
              />
            )}

            {/* Projects List */}
            {sortedProjects.length > 0 ? (
              <div className="space-y-2">
                {sortedProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onClick={() => handleSelectProject(project.id)}
                    isActive={project.id === userOrgPrefs?.last_project_id}
                    density="normal"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Folder className="w-12 h-12" />}
                title="No hay proyectos creados"
                description="Comienza creando tu primer proyecto para gestionar tu trabajo"
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
          </>
        )}

        {/* Tab: Datos Básicos */}
        {activeTab === 'basic-data' && (
          <>
            {!activeProjectId ? (
              <EmptyState
                icon={<Settings className="w-12 h-12" />}
                title="No hay proyecto activo"
                description="Selecciona un proyecto de la pestaña 'Proyectos' para gestionar sus datos básicos"
              />
            ) : (
              <div className="space-y-6">
                {/* Two Column Layout - Section descriptions left, content right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Imagen Principal */}
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="text-lg font-semibold">Imagen Principal</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Imagen que representa tu proyecto en tarjetas y vistas principales. Esta imagen aparecerá en el dashboard y listados de proyectos.
                      {isSaving && <span className="block text-[var(--accent)] mt-2">Guardando...</span>}
                    </p>
                  </div>

                  {/* Right Column - Imagen Principal Content */}
                  <div>
                    {activeProjectId && organizationId && (
                      <ProjectHeroImage
                        projectId={activeProjectId}
                        organizationId={organizationId}
                        currentImageUrl={projectImageUrl}
                        onImageUpdate={setProjectImageUrl}
                      />
                    )}
                  </div>
                </div>

                <hr className="border-t border-[var(--section-divider)] my-8" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Información Básica */}
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <FileText className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="text-lg font-semibold">Información Básica</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Datos fundamentales del proyecto que se usarán en todo el sistema. Estos campos son la base para presupuestos, documentos y comunicaciones.
                    </p>
                  </div>

                  {/* Right Column - Información Básica Content */}
                  <div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Nombre del Proyecto</Label>
                        <Input 
                          id="project-name"
                          placeholder="Ej: Casa Unifamiliar López"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea 
                          id="description"
                          placeholder="Descripción general del proyecto..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal-notes">Notas Internas</Label>
                        <Textarea 
                          id="internal-notes"
                          placeholder="Notas internas para el equipo..."
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-[var(--section-divider)] my-8" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Información del Cliente */}
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Users className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="text-lg font-semibold">Información del Cliente</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Datos de contacto del cliente responsable del proyecto. Esta información estará disponible para todo el equipo cuando necesiten comunicarse.
                    </p>
                  </div>

                  {/* Right Column - Información del Cliente Content */}
                  <div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-name">Nombre del Cliente</Label>
                        <Input 
                          id="client-name"
                          placeholder="Ej: Familia López"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-phone">Teléfono de Contacto</Label>
                        <Input 
                          id="contact-phone"
                          placeholder="Ej: +54 11 1234-5678"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email de Contacto</Label>
                        <Input 
                          id="email"
                          type="email"
                          placeholder="Ej: contacto@cliente.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Left Column - Ubicación */}
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="text-lg font-semibold">Ubicación del Proyecto</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Dirección completa donde se ejecutará la obra. Esta información se usa para logística, entregas y documentación oficial.
                    </p>
                  </div>

                  {/* Right Column - Ubicación Content */}
                  <div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input 
                          id="address"
                          placeholder="Ej: Av. Corrientes 1234"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input 
                          id="city"
                          placeholder="Ej: Buenos Aires"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">Provincia/Estado</Label>
                        <Input 
                          id="state"
                          placeholder="Ej: Buenos Aires"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input 
                          id="country"
                          placeholder="Ej: Argentina"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip-code">Código Postal</Label>
                        <Input 
                          id="zip-code"
                          placeholder="Ej: C1043AAX"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}