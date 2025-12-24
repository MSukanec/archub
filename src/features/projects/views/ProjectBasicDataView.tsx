import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useUserOrganizationPreferences } from '@/features/organization'
import { supabase } from '@/lib/supabase'
import { useOptimisticMutation } from '@/core/save-engine'
import { useAutosaveController, normalizeStringValue } from '@/core/autosave'
import { projectsKeys } from '@/core/query-keys'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageIcon, Palette, Settings } from 'lucide-react'
import { FileUploader } from '@/components/shared/fields/FileUploader'
import { uploadProjectImage, deleteProjectImage } from '@/features/projects'
import { compressImage, formatCompressionStats } from '@/lib/imageCompression'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useProjectTypes, useProjectModalities, ProjectColorAdvanced } from '@/features/projects'
import { ColorPaletteField } from '@/components/shared/fields/ColorPaletteField'
import { getProjectImageUrlFromData } from '@/lib/storage/uploadProjectImage'

interface ProjectBasicDataViewProps {
  projectId?: string;
}

export function ProjectBasicDataView({ projectId }: ProjectBasicDataViewProps) {
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
  const [projectModalityId, setProjectModalityId] = useState('')
  const [status, setStatus] = useState('')
  
  // Form states - Details
  const [description, setDescription] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  
  // Color states
  const [selectedColor, setSelectedColor] = useState<string>('#84cc16')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColorH, setCustomColorH] = useState<number | null>(null)
  const [customColorHex, setCustomColorHex] = useState<string | null>(null)
  
  // Get project types and modalities (requires organizationId to be enabled)
  const { data: projectTypes = [] } = useProjectTypes(organizationId)
  const { data: projectModalities = [] } = useProjectModalities(organizationId)

  // Get project data for BasicData tab
  const { data: projectData, isSuccess: projectDataSuccess } = useQuery({
    queryKey: projectsKeys.data(activeProjectId),
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
  const { data: projectInfo, isSuccess: projectInfoSuccess } = useQuery({
    queryKey: projectsKeys.info(activeProjectId),
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', activeProjectId)
        .eq('is_deleted', false)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching project info:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!activeProjectId && !!supabase
  });

  // Mutation to upload project image using optimistic mutation
  const { mutate: uploadImage, isPending: isUploadingImage } = useOptimisticMutation({
    mutationFn: async (file: File) => {
      if (!activeProjectId || !organizationId) {
        throw new Error('Project ID and Organization ID are required');
      }
      
      // Compress image before uploading
      const originalSize = file.size;
      let compressedFile = file;
      try {
        compressedFile = await compressImage(file, 'project-cover');
        if (originalSize !== compressedFile.size) {
          toast({
            title: "Imagen optimizada",
            description: formatCompressionStats(originalSize, compressedFile.size),
          });
        }
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: "Advertencia",
          description: "No se pudo comprimir la imagen, se usará el archivo original",
          variant: "default"
        });
      }
      
      // Upload image to storage
      const uploadResult = await uploadProjectImage(compressedFile, activeProjectId, organizationId);
      return uploadResult;
    },
    queryKey: projectsKeys.data(activeProjectId),
    optimisticUpdate: (oldData) => oldData,
    onSuccessMessage: "Imagen principal actualizada correctamente",
    onErrorMessage: "No se pudo subir la imagen",
    additionalQueryKeys: [
      projectsKeys.info(activeProjectId),
      projectsKeys.list(organizationId),
      projectsKeys.image(activeProjectId),
    ],
  });

  // Mutation to delete project image using optimistic mutation
  const { mutate: deleteImage, isPending: isDeletingImage } = useOptimisticMutation<void, void>({
    mutationFn: async (): Promise<void> => {
      if (!activeProjectId || !organizationId) {
        throw new Error('Project ID and Organization ID are required');
      }
      
      if (projectData?.image_bucket && projectData?.image_path) {
        await deleteProjectImage(activeProjectId, organizationId, projectData.image_bucket, projectData.image_path);
      }
    },
    queryKey: projectsKeys.data(activeProjectId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        image_bucket: null,
        image_path: null,
      };
    },
    onSuccessMessage: "Imagen principal eliminada correctamente",
    onErrorMessage: "No se pudo eliminar la imagen",
    additionalQueryKeys: [
      projectsKeys.info(activeProjectId),
      projectsKeys.list(organizationId),
      projectsKeys.image(activeProjectId),
    ],
  });

  // Handler for image file selection
  const handleImageFilesChange = useCallback((files: any[]) => {
    if (files.length > 0 && files[0].file) {
      uploadImage(files[0].file);
    }
  }, [uploadImage]);

  // Handler for image removal
  const handleImageRemove = useCallback(() => {
    deleteImage();
  }, [deleteImage]);

  // Mutation to save project color using optimistic mutation
  const { mutate: saveProjectColor } = useOptimisticMutation({
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
    queryKey: projectsKeys.info(activeProjectId),
    optimisticUpdate: (oldData, colorData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        ...colorData,
      };
    },
    onErrorMessage: "No se pudo guardar el color del proyecto",
    additionalQueryKeys: [
      projectsKeys.list(organizationId),
    ],
  });

  // ENTERPRISE AUTOSAVE: Controller for coordinated saves
  // NEVER saves on onChange - only on onBlur, Enter, or select change
  const saveController = useAutosaveController({
    queryKey: projectsKeys.data(activeProjectId),
    saveFn: async (dataToSave: any) => {
      
      if (!activeProjectId || !supabase) throw new Error('Project or Supabase not available');

      // Normalize empty strings to null
      const normalizedData = {
        name: normalizeStringValue(dataToSave.name),
        code: normalizeStringValue(dataToSave.code),
        status: dataToSave.status,
        project_type_id: dataToSave.project_type_id || null,
        project_modality_id: dataToSave.project_modality_id || null,
        description: normalizeStringValue(dataToSave.description),
        internal_notes: normalizeStringValue(dataToSave.internal_notes),
      };

      // Update fields in projects table (name, code, status)
      const projectsUpdate: any = {};
      if (normalizedData.name !== undefined) projectsUpdate.name = normalizedData.name;
      if (normalizedData.code !== undefined) projectsUpdate.code = normalizedData.code;
      if (normalizedData.status !== undefined) projectsUpdate.status = normalizedData.status;
      
      if (Object.keys(projectsUpdate).length > 0) {
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectsUpdate)
          .eq('id', activeProjectId);

        if (projectError) throw projectError;
      }

      // Prepare project_data payload
      const projectDataPayload = {
        project_type_id: normalizedData.project_type_id,
        project_modality_id: normalizedData.project_modality_id,
        description: normalizedData.description,
        internal_notes: normalizedData.internal_notes,
      };

      const { error } = await supabase
        .from('project_data')
        .upsert({
          project_id: activeProjectId,
          organization_id: organizationId,
          ...projectDataPayload
        }, {
          onConflict: 'project_id'
        });

      if (error) throw error;
    },
    additionalQueryKeys: [projectsKeys.info(activeProjectId), projectsKeys.list(organizationId)],
    debounceMs: 800,
  });
  
  const { isSaving, hasUnsavedChanges } = saveController;

  // Build current form data for saving
  const getCurrentFormData = useCallback(() => ({
    name: projectName,
    code: projectCode,
    project_type_id: projectTypeId || null,
    project_modality_id: projectModalityId || null,
    status: status,
    description: description,
    internal_notes: internalNotes,
  }), [projectName, projectCode, projectTypeId, projectModalityId, status, description, internalNotes]);

  // Validate form data before saving - REQUIRED fields must have values
  const isFormValid = useCallback((formData: any): boolean => {
    // Project name is REQUIRED - don't save if empty
    const nameValue = formData.name?.trim();
    if (!nameValue) {
      return false;
    }
    return true;
  }, []);

  // Handler for text fields: save on blur (with validation)
  const handleTextFieldBlur = useCallback(() => {
    if (!isHydrated) return;
    
    const formData = getCurrentFormData();
    
    // Validate before saving - skip if invalid
    if (!isFormValid(formData)) {
      return;
    }
    
    saveController.save(formData);
  }, [isHydrated, saveController, getCurrentFormData, isFormValid]);

  // Handler for text fields: save on Enter key (with validation)
  const handleTextFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isHydrated) return;
      
      const formData = getCurrentFormData();
      
      // Validate before saving - skip if invalid
      if (!isFormValid(formData)) {
        return;
      }
      
      saveController.save(formData);
    }
  }, [isHydrated, saveController, getCurrentFormData, isFormValid]);

  // Handler for select fields: save immediately on change (with validation)
  const handleSelectChange = useCallback((field: string, value: string) => {
    if (!isHydrated) return;
    
    // Update state first
    switch (field) {
      case 'project_type_id':
        setProjectTypeId(value);
        break;
      case 'project_modality_id':
        setProjectModalityId(value);
        break;
      case 'status':
        setStatus(value);
        break;
    }
    
    // Build form data with updated value
    const formData = { ...getCurrentFormData(), [field]: value || null };
    
    // Validate before saving - skip if invalid
    if (!isFormValid(formData)) {
      return;
    }
    
    saveController.save(formData);
  }, [isHydrated, saveController, getCurrentFormData, isFormValid]);

  // UNIFIED hydration effect - loads ALL data at once, then marks as hydrated
  useEffect(() => {
    // Only hydrate when BOTH queries have completed (even if projectData is null)
    if (!projectInfoSuccess || !projectDataSuccess) {
      return;
    }

    // Load project info data (from projects table)
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
      setProjectCode(projectInfo.code || '');
      setStatus(projectInfo.status || 'active');
      setSelectedColor(projectInfo.color || '#84cc16');
      setUseCustomColor(projectInfo.use_custom_color || false);
      setCustomColorH(projectInfo.custom_color_h);
      setCustomColorHex(projectInfo.custom_color_hex);
    }

    // Load project data (from project_data table - may be null for new projects)
    // project_type_id and project_modality_id ARE in project_data table
    if (projectData) {
      setProjectTypeId(projectData.project_type_id || '');
      setProjectModalityId(projectData.project_modality_id || '');
      setDescription(projectData.description || '');
      setInternalNotes(projectData.internal_notes || '');
    }

    // Mark as hydrated AFTER all state updates are queued
    // Also seed the controller with initial data for dirty checking
    setTimeout(() => {
      setIsHydrated(true);
      
      // Seed lastPersistedData to prevent redundant saves on first blur
      saveController.setLastPersistedData({
        name: projectInfo?.name || '',
        code: projectInfo?.code || '',
        project_type_id: projectData?.project_type_id || null,
        project_modality_id: projectData?.project_modality_id || null,
        status: projectInfo?.status || 'active',
        description: projectData?.description || '',
        internal_notes: projectData?.internal_notes || '',
      });
    }, 100);
  }, [projectInfo, projectData, projectInfoSuccess, projectDataSuccess]);

  // Generate project image URL with auto-refresh (React Query)
  const { data: projectImageUrl } = useQuery({
    queryKey: projectsKeys.image(activeProjectId),
    queryFn: async () => {
      if (!projectData?.image_bucket || !projectData?.image_path) return null;
      return await getProjectImageUrlFromData(projectData);
    },
    enabled: !!projectData?.image_bucket && !!projectData?.image_path,
    refetchInterval: 30 * 60 * 1000,  // Refresh every 30 minutes
    staleTime: 25 * 60 * 1000,         // Consider stale after 25 minutes
  });

  // Handlers for color changes - OPTIMIZED with optimistic updates (fire-and-forget)
  const handlePaletteColorChange = useCallback((color: string) => {
    // ⚡ PASO 1: Update state immediately (optimistic)
    setSelectedColor(color);
    setUseCustomColor(false);
    setCustomColorH(null);
    setCustomColorHex(null);
    
    // ⚡ PASO 2: Fire and forget - update DB in background
    saveProjectColor({
      color,
      use_custom_color: false,
      custom_color_h: null,
      custom_color_hex: null
    });
  }, [saveProjectColor]);

  const handleCustomColorChange = useCallback((params: { useCustom: boolean; hue: number | null; hex: string | null }) => {
    // ⚡ PASO 1: Update state immediately (optimistic)
    setUseCustomColor(params.useCustom);
    setCustomColorH(params.hue);
    setCustomColorHex(params.hex);
    
    if (params.useCustom && params.hex) {
      setSelectedColor(params.hex);
    }
    
    // ⚡ PASO 2: Fire and forget - update DB in background
    saveProjectColor({
      use_custom_color: params.useCustom,
      custom_color_h: params.hue,
      custom_color_hex: params.hex ?? undefined,
      color: params.useCustom ? (params.hex ?? '#84cc16') : '#84cc16'
    });
  }, [saveProjectColor]);

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
            <FileUploader
              variant="hero"
              mode="single"
              accept="images"
              heroImageUrl={projectImageUrl ?? null}
              filesToUpload={[]}
              onFilesChange={handleImageFilesChange}
              onHeroImageChange={(url) => {
                if (!url) {
                  handleImageRemove();
                }
              }}
              isUploading={isUploadingImage}
              disabled={isUploadingImage || isDeletingImage}
              emptyStateDescription="Arrastra una imagen o haz clic para seleccionar"
              maxSizeLabel="Formatos: JPG, PNG, WebP • Tamaño máximo: 2MB"
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
              onBlur={handleTextFieldBlur}
              onKeyDown={handleTextFieldKeyDown}
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
              onBlur={handleTextFieldBlur}
              onKeyDown={handleTextFieldKeyDown}
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
              <Select value={projectTypeId} onValueChange={(value) => handleSelectChange('project_type_id', value)}>
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
              <Select value={projectModalityId} onValueChange={(value) => handleSelectChange('project_modality_id', value)}>
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
            <Select value={status} onValueChange={(value) => handleSelectChange('status', value)}>
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
              onBlur={handleTextFieldBlur}
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
              onBlur={handleTextFieldBlur}
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
            Define el color que identificará este proyecto en toda la plataforma. Puedes elegir entre nuestra paleta predefinida o crear un color personalizado.
          </p>
        </div>

        {/* Right Column - Color Content */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Paleta de colores</Label>
            <ColorPaletteField
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