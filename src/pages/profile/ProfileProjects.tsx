import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProjectContext } from '@/stores/projectContext'
import { useLocation } from 'wouter'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Eye, Edit, Trash2, FileImage, FolderOpen } from 'lucide-react'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'

export default function ProfileProjects() {
  const [location, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { currentOrganizationId } = useProjectContext()
  const organizationId = currentOrganizationId

  // URL parsing to get active project and tab
  const pathParts = location.split('/')
  const projectIndex = pathParts.indexOf('projects')
  const projectId = projectIndex !== -1 ? pathParts[projectIndex + 1] || null : null
  const activeTab = projectIndex !== -1 ? pathParts[projectIndex + 2] || 'proyectos' : 'proyectos'

  // State for projects tab
  const [searchValue, setSearchValue] = useState('')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  // State for basic data tab
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

  // Projects query
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return []
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error('Error fetching projects:', error)
        throw error
      }
      
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Project data queries (only when viewing basic data tab)
  const { data: projectData } = useQuery({
    queryKey: ['project-data', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', projectId)
        .single()
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching project data:', error)
        throw error
      }
      
      return data
    },
    enabled: !!projectId && !!supabase && activeTab === 'datos-basicos'
  })

  const { data: projectInfo } = useQuery({
    queryKey: ['project-info', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
        
      if (error) {
        console.error('Error fetching project info:', error)
        throw error
      }
      
      return data
    },
    enabled: !!projectId && !!supabase && activeTab === 'datos-basicos'
  })

  // Auto-save mutation for project data
  const saveProjectDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!projectId || !supabase) return

      if (dataToSave.name !== undefined) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: dataToSave.name })
          .eq('id', projectId)

        if (projectError) throw projectError
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
      }

      const cleanData = Object.fromEntries(
        Object.entries(projectDataFields).filter(([_, value]) => value !== undefined)
      )

      if (Object.keys(cleanData).length > 0) {
        const { error } = await supabase
          .from('project_data')
          .upsert({
            project_id: projectId,
            ...cleanData
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar los datos del proyecto",
        variant: "destructive"
      })
    }
  })

  // Auto-save hooks
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ name: projectName }), projectName, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ description }), description, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ internal_notes: internalNotes }), internalNotes, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ client_name: clientName }), clientName, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ contact_phone: contactPhone }), contactPhone, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ email }), email, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ address }), address, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ city }), city, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ state }), state, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ country }), country, 1000)
  useDebouncedAutoSave(() => saveProjectDataMutation.mutate({ zip_code: zipCode }), zipCode, 1000)

  // Load project data when available
  useEffect(() => {
    if (projectInfo) {
      setProjectName(projectInfo.name || '')
    }
  }, [projectInfo])

  useEffect(() => {
    if (projectData) {
      setDescription(projectData.description || '')
      setInternalNotes(projectData.internal_notes || '')
      setClientName(projectData.client_name || '')
      setContactPhone(projectData.contact_phone || '')
      setEmail(projectData.email || '')
      setAddress(projectData.address || '')
      setCity(projectData.city || '')
      setState(projectData.state || '')
      setCountry(projectData.country || '')
      setZipCode(projectData.zip_code || '')
      setProjectImageUrl(projectData.hero_image_url || null)
    }
  }, [projectData])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter and sort projects
  let filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchValue.toLowerCase())
    
    if (filterByStatus === "all") return matchesSearch
    if (filterByStatus === "active") return matchesSearch && project.status === 'active'
    if (filterByStatus === "planning") return matchesSearch && project.status === 'planning'
    if (filterByStatus === "completed") return matchesSearch && project.status === 'completed'
    
    return matchesSearch
  }) || []

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (projectId) {
      setLocation(`/profile/projects/${projectId}/${value}`)
    } else {
      setLocation(`/profile/projects/${value}`)
    }
  }

  // Navigate to project basic data
  const navigateToProjectBasicData = (projectId: string) => {
    setLocation(`/profile/projects/${projectId}/datos-basicos`)
  }

  // Navigate back to projects list
  const navigateBackToProjects = () => {
    setLocation('/profile/projects/proyectos')
  }

  // Render project card
  const renderProjectCard = (project: any) => (
    <Card key={project.id} className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={
                project.status === 'active' ? 'default' :
                project.status === 'planning' ? 'secondary' :
                project.status === 'completed' ? 'outline' : 'secondary'
              }>
                {project.status === 'active' ? 'Activo' :
                 project.status === 'planning' ? 'Planificación' :
                 project.status === 'completed' ? 'Completado' : 'Sin estado'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToProjectBasicData(project.id)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // If viewing a specific project's basic data
  if (projectId && activeTab === 'datos-basicos') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Proyectos</h1>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
              <TabsList>
                <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
                <TabsTrigger value="datos-basicos">Datos Básicos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Button variant="outline" onClick={navigateBackToProjects}>
            Volver a Proyectos
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Proyecto
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Nombre del proyecto"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del proyecto"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notas Internas
                </label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas internas del proyecto"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre del Cliente
                  </label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono de Contacto
                  </label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Teléfono de contacto"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email del cliente"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ubicación del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dirección
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección del proyecto"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ciudad
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estado/Provincia
                  </label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Estado o provincia"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    País
                  </label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="País"
                  />
                </div>
              </div>
              
              <div className="md:w-1/3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código Postal
                </label>
                <Input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Código postal"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main projects view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Proyectos</h1>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
            <TabsList>
              <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
              <TabsTrigger value="datos-basicos">Datos Básicos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      <TabsContent value="proyectos" className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="planning">En planificación</option>
            <option value="completed">Completados</option>
          </select>
        </div>

        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(renderProjectCard)}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No se encontraron proyectos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchValue || filterByStatus !== 'all' 
                    ? 'No hay proyectos que coincidan con los filtros seleccionados.'
                    : 'Aún no tienes proyectos creados. Crea tu primer proyecto para comenzar.'
                  }
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Proyecto
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </div>
  )
}