import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/components/save'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageIcon, Palette, Settings } from 'lucide-react'
import ImageUploadAndShowField from '@/components/ui-custom/fields/ImageUploadAndShowField'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useProjectTypes } from '@/hooks/use-project-types'
import { useProjectModalities } from '@/hooks/use-project-modalities'
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

  // Hydration state - CRITICAL for preventing auto-save on page load
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Form states - Basic
  const [projectName, setProjectName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [projectTypeId, setProjectTypeId] = useState('')
  const [modalityId, setModalityId] = useState('')
  const [status, setStatus] = useState('')
  
  // Form states - Details
  const [description, setDescription] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null)
  
  // Color states
  const [selectedColor, setSelectedColor] = useState<string>('#84cc16')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColorH, setCustomColorH] = useState<number | null>(null)
  const [customColorHex, setCustomColorHex] = useState<string | null>(null)
  
  // Get project types and modalities
  const { data: projectTypes = [] } = useProjectTypes()
  const { data: projectModalities = [] } = useProjectModalities()

  // Get project data for BasicData tab
  const { data: projectData, isSuccess: projectDataSuccess } = useQuery({
    queryKey: ['project-data', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', activeProjectId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    },
    enabled: !!activeProjectId && !!supabase
  });

  // Get actual project info for BasicData tab
  const { data: projectInfo, isSuccess: projectInfoSuccess } = useQuery({
    queryKey: ['project-info', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', activeProjectId)
        .single();
        
      if (error) {
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
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-info', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-color', activeProjectId] });
    },
    onError: (error: any) => {
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

      // Update project name, code, and status in projects table
      const projectsUpdate: any = {};
      if (dataToSave.name !== undefined) projectsUpdate.name = dataToSave.name;
      if (dataToSave.code !== undefined) projectsUpdate.code = dataToSave.code;
      if (dataToSave.status !== undefined) projectsUpdate.status = dataToSave.status;
      
      if (Object.keys(projectsUpdate).length > 0) {
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectsUpdate)
          .eq('id', activeProjectId);

        if (projectError) {
          throw projectError;
        }
      }

      // Prepare project_data payload - explicitly exclude fields that belong to projects table
      const { name, code, status, ...projectDataPayload } = dataToSave;

      if (Object.keys(projectDataPayload).length === 0) return;

      // Use upsert to avoid race conditions
      const { error } = await supabase
        .from('project_data')
        .upsert({
          project_id: activeProjectId,
          organization_id: organizationId,
          ...projectDataPayload
        }, {
          onConflict: 'project_id'
        });

      if (error) {
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
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del proyecto",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook - enabled ONLY after hydration is complete
  const { isSaving } = useDebouncedAutoSave({
    data: {
      name: projectName,
      code: projectCode,
      project_type_id: projectTypeId,
      modality_id: modalityId,
      status: status,
      description: description,
      internal_notes: internalNotes
    },
    saveFn: (data) => saveProjectDataMutation.mutateAsync(data),
    delay: 3000,
    enabled: !!userData && isHydrated
  });

  // UNIFIED hydration effect - loads ALL data at once, then marks as hydrated
  useEffect(() => {
    // Only hydrate when BOTH queries have completed (even if projectData is null)
    if (!projectInfoSuccess || !projectDataSuccess) {
      return;
    }

    // Load project info data
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
      setProjectCode(projectInfo.code || '');
      setStatus(projectInfo.status || 'active');
      setSelectedColor(projectInfo.color || '#84cc16');
      setUseCustomColor(projectInfo.use_custom_color || false);
      setCustomColorH(projectInfo.custom_color_h);
      setCustomColorHex(projectInfo.custom_color_hex);
    }

    // Load project data (may be null for new projects)
    if (projectData) {
      setProjectTypeId(projectData.project_type_id || '');
      setModalityId(projectData.modality_id || '');
      setDescription(projectData.description || '');
      setInternalNotes(projectData.internal_notes || '');
      setProjectImageUrl(projectData.project_image_url || null);
    }

    // Mark as hydrated AFTER all state updates are queued
    setTimeout(() => {
      setIsHydrated(true);
    }, 100);
  }, [projectInfo, projectData, projectInfoSuccess, projectDataSuccess]);

  // Handlers for color changes (NO usar saveProjectColorMutation como dependencia para evitar loops)
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
  }, []);

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
  }, []);

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

      {/* Información Básica Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Información Básica */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fundamentales que definen el proyecto. El nombre, tipo, modalidad, estado, descripción y notas ayudan a organizar y clasificar tus proyectos.
          </p>
        </div>

        {/* Right Column - Información Básica Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Nombre del Proyecto <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="project-name"
              placeholder="Ej: Casa Unifamiliar López"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              data-testid="input-project-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-code">
              Código Interno <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input 
              id="project-code"
              placeholder="Ej: CASA-2024-01"
              value={projectCode}
              onChange={(e) => {
                // Auto format: uppercase, only A-Z0-9-_
                const formatted = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9\-_]/g, '')
                  .slice(0, 30);
                setProjectCode(formatted);
              }}
              data-testid="input-project-code"
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 30 caracteres. Solo letras, números, guiones y guiones bajos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-type">Tipología</Label>
              <Select value={projectTypeId} onValueChange={setProjectTypeId}>
                <SelectTrigger id="project-type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especificar</SelectItem>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select value={modalityId} onValueChange={setModalityId}>
                <SelectTrigger id="modality">
                  <SelectValue placeholder="Selecciona una modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin especificar</SelectItem>
                  {projectModalities.map((modality) => (
                    <SelectItem key={modality.id} value={modality.id}>
                      {modality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">En proceso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="planning">Planificación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea 
              id="description"
              placeholder="Descripción general del proyecto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="textarea-description"
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
              data-testid="textarea-internal-notes"
            />
          </div>
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

    </div>
  )
}