import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageIcon, FileText, Users, MapPin, Palette } from 'lucide-react'
import ImageUploadAndShowField from '@/components/ui-custom/fields/ImageUploadAndShowField'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import ProjectColorAdvanced from '@/components/projects/ProjectColorAdvanced'
import ProjectColorPalette from '@/components/projects/ProjectColorPalette'

interface ProjectDataTabProps {
  projectId?: string;
}

export default function ProjectDataTab({ projectId }: ProjectDataTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()
  const { selectedProjectId } = useProjectContext()
  const organizationId = userData?.organization?.id
  // Use projectId from props if provided, otherwise use selectedProjectId from context
  const activeProjectId = projectId || selectedProjectId

  // Form states
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
  
  // Color states
  const [selectedColor, setSelectedColor] = useState<string>('#84cc16')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColorH, setCustomColorH] = useState<number | null>(null)
  const [customColorHex, setCustomColorHex] = useState<string | null>(null)

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
    enabled: !!activeProjectId && !!supabase
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
    enabled: !!activeProjectId && !!supabase
  });

  // Mutation to save project color
  const saveProjectColorMutation = useMutation({
    mutationFn: async (colorData: { color?: string; use_custom_color?: boolean; custom_color_h?: number | null; custom_color_hex?: string | null }) => {
      if (!activeProjectId || !supabase) return;

      const { error } = await supabase
        .from('projects')
        .update(colorData)
        .eq('id', activeProjectId);

      if (error) {
        console.error('Error updating project color:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-info', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-color', activeProjectId] });
    },
    onError: (error: any) => {
      console.error('Error in saveProjectColorMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el color del proyecto",
        variant: "destructive"
      });
    }
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

        if (projectError) {
          console.error('Error updating project name:', projectError);
          throw projectError;
        }
      }

      // Prepare project_data payload
      const projectDataPayload = { ...dataToSave };
      delete projectDataPayload.name; // Remove name as it goes to projects table

      if (Object.keys(projectDataPayload).length === 0) return;

      // Use upsert to avoid race conditions
      const { error } = await supabase
        .from('project_data')
        .upsert({
          project_id: activeProjectId,
          ...projectDataPayload
        }, {
          onConflict: 'project_id'
        });

      if (error) {
        console.error('Error saving project data:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['project-info', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Cambios guardados",
        description: "Los datos del proyecto se han guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error in saveProjectDataMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del proyecto",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook
  const { isSaving } = useDebouncedAutoSave({
    data: {
      name: projectName,
      description: description,
      internal_notes: internalNotes,
      client_name: clientName,
      contact_phone: contactPhone,
      email: email,
      address: address,
      city: city,
      state: state,
      country: country,
      zip_code: zipCode
    },
    saveFn: (data) => saveProjectDataMutation.mutateAsync(data),
    delay: 1500
  });

  // Load data when project changes or data is fetched
  useEffect(() => {
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
      setSelectedColor(projectInfo.color || '#84cc16');
      setUseCustomColor(projectInfo.use_custom_color || false);
      setCustomColorH(projectInfo.custom_color_h);
      setCustomColorHex(projectInfo.custom_color_hex);
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
      setProjectImageUrl(projectData.project_image_url || null);
    }
  }, [projectData]);

  // Handlers for color changes
  const handlePaletteColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    setUseCustomColor(false);
    setCustomColorH(null);
    setCustomColorHex(null);
    
    saveProjectColorMutation.mutate({
      color,
      use_custom_color: false,
      custom_color_h: null,
      custom_color_hex: null
    });
  }, [saveProjectColorMutation]);

  const handleCustomColorChange = useCallback((params: { useCustom: boolean; hue: number | null; hex: string | null }) => {
    setUseCustomColor(params.useCustom);
    setCustomColorH(params.hue);
    setCustomColorHex(params.hex);
    
    if (params.useCustom && params.hex) {
      setSelectedColor(params.hex);
    }
    
    saveProjectColorMutation.mutate({
      use_custom_color: params.useCustom,
      custom_color_h: params.hue,
      custom_color_hex: params.hex ?? undefined,
      color: params.useCustom ? (params.hex ?? '#84cc16') : '#84cc16'
    });
  }, [saveProjectColorMutation]);

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay proyecto activo seleccionado</p>
      </div>
    )
  }

  return (
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
            <ImageUploadAndShowField
              projectId={activeProjectId}
              organizationId={organizationId}
              currentImageUrl={projectImageUrl}
              onImageUpdate={setProjectImageUrl}
            />
          )}
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Color Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Color del Proyecto */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Palette className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Color del Proyecto</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Define el color que identificará este proyecto en toda la plataforma. Puedes elegir entre nuestra paleta predefinida o crear un color personalizado con el plan PRO.
          </p>
        </div>

        {/* Right Column - Color Content */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Paleta de colores</Label>
            <ProjectColorPalette
              selectedColor={selectedColor}
              onColorChange={handlePaletteColorChange}
              disabled={useCustomColor}
            />
          </div>
          
          <ProjectColorAdvanced
            initialHue={customColorH}
            initialEnabled={useCustomColor}
            onChange={handleCustomColorChange}
          />
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
  )
}