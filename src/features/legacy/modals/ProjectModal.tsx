import React, { useEffect, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderPlus, Check } from "lucide-react";
import chroma from "chroma-js";

import { FormModalLayout } from "@/components/modal";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { useModalPanelStore } from "@/components/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import UploadImageAndShowField from "@/components/ui-custom/fields/UploadImageAndShowField";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/features/organization";
import { useProjectTypes } from "@/features/projects/project-types";
import { useProjectModalities } from "@/features/projects/project-modalities";
import { useProjectContext } from "@/stores/projectContext";
import { useToast } from "@/hooks/use-toast";
import { useUpdateChecklist } from "@/hooks/use-update-checklist";
import { supabase } from "@/lib/supabase";

// Import feature hooks and services
import { useCreateProject, useUpdateProject, uploadProjectImage, updateProjectLastActive, QUERY_KEYS, ProjectColorAdvanced } from '@/features/projects';
import { USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '@/features/organization';

// Paleta de colores predefinidos
const PRESET_COLORS = [
  { hex: '#007aff', name: 'Ocean' },
  { hex: '#34c759', name: 'Grass' },
  { hex: '#ffcc00', name: 'Amber' },
  { hex: '#ff3b30', name: 'Coral' },
  { hex: '#af52de', name: 'Violet' },
  { hex: '#5e5ce6', name: 'Slate' },
  { hex: '#00c7be', name: 'Mint' },
  { hex: '#84cc16', name: 'Lime' }, // Verde por defecto de Archub
];

// Helper para calcular color de texto basado en el fondo
function getTextColor(backgroundColor: string): string {
  try {
    const color = chroma(backgroundColor);
    return color.luminance() > 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido"),
  project_type_id: z.string().optional(),
  project_modality_id: z.string().optional(),
  status: z.enum(["active", "inactive", "completed", "paused"]).default("active"),
  color: z.string().optional(),
  use_custom_color: z.boolean().default(false),
  custom_color_h: z.number().min(0).max(360).nullable().optional(),
  custom_color_hex: z.string().nullable().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
  organization_id: string;
  color?: string;
  use_custom_color?: boolean;
  custom_color_h?: number | null;
  custom_color_hex?: string | null;
  project_data?: {
    project_type_id?: string;
    project_modality_id?: string;
  };
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ProjectModalProps {
  modalData?: {
    editingProject?: Project;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ProjectModal({ modalData, onClose }: ProjectModalProps) {
  const { editingProject, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId, setSelectedProject } = useProjectContext();
  // Fallback chain: currentOrganizationId -> editingProject.organization_id -> userData.organization.id
  const organizationId = currentOrganizationId || editingProject?.organization_id || userData?.organization?.id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);
  const { data: projectTypes = [] } = useProjectTypes(organizationId);
  const { data: projectModalities = [] } = useProjectModalities(organizationId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use feature hooks for mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const updateChecklist = useUpdateChecklist();

  // Image upload states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Generate current image URL for editing
  const { data: currentImageUrl } = useQuery({
    queryKey: ['project-edit-image', editingProject?.id, (editingProject as any)?.project_data?.image_bucket, (editingProject as any)?.project_data?.image_path],
    queryFn: async () => {
      if (!(editingProject as any)?.project_data?.image_bucket || !(editingProject as any)?.project_data?.image_path) {
        return null;
      }
      const { getProjectImageUrlFromData } = await import('@/features/projects');
      return await getProjectImageUrlFromData((editingProject as any).project_data);
    },
    enabled: !!editingProject && !!(editingProject as any)?.project_data?.image_bucket && !!(editingProject as any)?.project_data?.image_path,
  });

  // Encontrar el member_id del usuario actual
  const currentUserMember = organizationMembers.find(member => 
    member.user_id === userData?.user?.id
  );

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: editingProject?.name || "",
      project_type_id: editingProject?.project_data?.project_type_id || "",
      project_modality_id: editingProject?.project_data?.project_modality_id || "",
      status: (editingProject?.status as "active" | "inactive" | "completed" | "paused") || "active",
      color: editingProject?.color || "#84cc16",
      use_custom_color: editingProject?.use_custom_color || false,
      custom_color_h: editingProject?.custom_color_h || null,
      custom_color_hex: editingProject?.custom_color_hex || null,
    }
  });

  // Reset form when editing project changes - ALWAYS in edit mode
  useEffect(() => {
    if (editingProject) {
      const projectTypeId = editingProject.project_data?.project_type_id;
      const projectModalityId = editingProject.project_data?.project_modality_id;
      
      form.reset({
        name: editingProject.name,
        project_type_id: projectTypeId || "",
        project_modality_id: projectModalityId || "",
        status: editingProject.status as "active" | "inactive" | "completed" | "paused",
        color: editingProject.color || "#84cc16",
        use_custom_color: editingProject.use_custom_color || false,
        custom_color_h: editingProject.custom_color_h || null,
        custom_color_hex: editingProject.custom_color_hex || null,
      });
    } else {
      form.reset({
        name: "",
        project_type_id: "",
        project_modality_id: "",
        status: "active",
        color: "#84cc16",
        use_custom_color: false,
        custom_color_h: null,
        custom_color_hex: null,
      });
    }
    // Siempre establecer en modo edit
    setPanel('edit');
  }, [editingProject, form, setPanel]);

  // Image handlers - simplified for preview mode
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    
    setSelectedImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload after project creation or update
  const handleImageUpload = async (projectId: string) => {
    if (!selectedImageFile || !organizationId) return;

    setIsUploadingImage(true);
    try {
      toast({
        title: "Subiendo imagen...",
        description: "Tu imagen se está procesando",
      });

      // Upload image to storage (automatically updates project_data with image_bucket + image_path)
      await uploadProjectImage(selectedImageFile, projectId, organizationId);
      
      // Invalidate queries to refresh project views
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      
      toast({
        title: "Imagen subida",
        description: "La imagen principal se ha guardado correctamente"
      });
      
      // Clean up image state after successful upload
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    } catch (error: any) {
      toast({
        title: "Error al subir imagen",
        description: error.message || "No se pudo subir la imagen. Puedes intentarlo más tarde desde los datos del proyecto.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };


  const handleClose = () => {
    // Prevent closing while uploading image
    if (isUploadingImage) {
      toast({
        title: "Espera un momento",
        description: "La imagen se está subiendo, por favor espera...",
        variant: "default"
      });
      return;
    }

    form.reset();
    setPanel('view');
    // Clean up image state
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    onClose();
  };

  const onSubmit = async (data: CreateProjectForm) => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "No hay una organización activa seleccionada",
        variant: "destructive"
      });
      return;
    }

    if (!currentUserMember && !isEditing) {
      toast({
        title: "Error",
        description: "Usuario no es miembro de la organización",
        variant: "destructive"
      });
      return;
    }

    // Clean the data before submission
    const cleanedData = {
      name: data.name,
      status: data.status,
      color: data.color || "#84cc16",
      use_custom_color: data.use_custom_color || false,
      custom_color_h: data.custom_color_h || null,
      custom_color_hex: data.custom_color_hex || null,
      project_type_id: data.project_type_id || null,
      project_modality_id: data.project_modality_id || null,
    };

    try {
      if (isEditing && editingProject) {
        // Update existing project
        await updateProjectMutation.mutateAsync({
          projectId: editingProject.id,
          data: {
            ...cleanedData,
            organization_id: organizationId,
          }
        });

        // Upload new image if one was selected
        if (selectedImageFile) {
          await handleImageUpload(editingProject.id);
        }

        toast({
          title: "Proyecto actualizado",
          description: "El proyecto ha sido actualizado exitosamente"
        });
      } else {
        // Create new project
        const newProject = await createProjectMutation.mutateAsync({
          organization_id: organizationId,
          created_by: currentUserMember!.id,
          ...cleanedData,
        });

        // Force immediate refetch of projects list to show new project
        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.PROJECTS, organizationId]
        });

        // Make new project active automatically
        if (newProject.id && userData?.user?.id) {
          try {
            await supabase
              .from('user_organization_preferences')
              .upsert({
                user_id: userData.user.id,
                organization_id: organizationId,
                last_project_id: newProject.id,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,organization_id'
              });
            
            // Update context and update last_active_at
            setSelectedProject(newProject.id, organizationId);
            updateProjectLastActive(newProject.id, organizationId).catch(err => 
              console.error('Error updating project last_active_at:', err)
            );

            // Force immediate refetch of user preferences to update active status
            await queryClient.refetchQueries({
              queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userData.user.id, organizationId)
            });
          } catch (error) {
            console.error('Error setting project as active:', error);
          }
        }

        // Update checklist for new project
        if (userData?.user?.id) {
          await updateChecklist.mutateAsync({ 
            key: 'create_project', 
            value: true 
          });
        }

        // Upload image if one was selected
        if (selectedImageFile && newProject.id) {
          await handleImageUpload(newProject.id);
        }

        toast({
          title: "Proyecto creado",
          description: "El nuevo proyecto ha sido creado exitosamente y está activo"
        });
      }

      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || error.details || "Hubo un error al procesar el proyecto",
        variant: "destructive",
      });
    }
  };

  const viewPanel = (
    <>
      <div>
        <h4 className="font-medium">Nombre del proyecto</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.name || 'Sin nombre'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Tipo</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.project_data?.project_type_id ? 
           projectTypes.find(t => t.id === editingProject.project_data?.project_type_id)?.name || 'Sin especificar'
           : 'Sin especificar'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Modalidad</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.project_data?.project_modality_id ? 
           projectModalities.find(m => m.id === editingProject.project_data?.project_modality_id)?.name || 'Sin especificar'
           : 'Sin especificar'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Estado</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.status === 'active' ? 'En Proceso' : 
           editingProject?.status === 'completed' ? 'Completado' :
           editingProject?.status === 'paused' ? 'Pausado' : 'Inactivo'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Color</h4>
        <div className="flex items-center gap-2 mt-1">
          <div 
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: editingProject?.color || '#ffffff' }}
          />
          <p className="text-muted-foreground">
            {editingProject?.color || '#ffffff'}
          </p>
        </div>
      </div>
    </>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <div className="space-y-4">
          {/* Nombre y Estado en 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proyecto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proyecto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">En Proceso</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo y Modalidad en 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="project_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin especificar</SelectItem>
                      {projectTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_modality_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidad</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar modalidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin especificar</SelectItem>
                      {projectModalities?.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Image Upload - Preview mode for both creating and editing (actual upload happens on form submit) */}
          <div className="space-y-2">
            <FormLabel>
              Imagen Principal
              {!isEditing && <span className="text-xs text-muted-foreground font-normal"> (opcional)</span>}
            </FormLabel>
            
            <UploadImageAndShowField
              projectId={undefined}
              organizationId={organizationId}
              currentImageUrl={isEditing ? currentImageUrl || null : null}
              previewMode={true}
              previewUrl={imagePreviewUrl}
              onFileSelect={handleFileSelect}
            />
          </div>

          {/* Color - Paleta visual */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color del proyecto</FormLabel>
                <div className="space-y-3">
                  {/* Paleta de colores */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((colorOption) => (
                      <button
                        key={colorOption.hex}
                        type="button"
                        onClick={() => {
                          field.onChange(colorOption.hex);
                          // Deseleccionar custom color al elegir preset
                          form.setValue('use_custom_color', false);
                          form.setValue('custom_color_h', null);
                          form.setValue('custom_color_hex', null);
                        }}
                        className="relative w-10 h-10 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                        style={{ backgroundColor: colorOption.hex }}
                        title={colorOption.name}
                        data-testid={`color-option-${colorOption.name.toLowerCase()}`}
                      >
                        {field.value === colorOption.hex && !form.watch('use_custom_color') && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-md" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Vista previa */}
                  {!form.watch('use_custom_color') && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Vista previa:</span>
                      <Badge 
                        style={{ 
                          backgroundColor: field.value || '#84cc16',
                          color: getTextColor(field.value || '#84cc16')
                        }}
                        data-testid="color-preview-badge"
                      >
                        {PRESET_COLORS.find(c => c.hex === field.value)?.name || 'Personalizado'}
                      </Badge>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Color personalizado (PRO/TEAMS) */}
          <ProjectColorAdvanced
            initialHue={form.watch('custom_color_h') ?? undefined}
            initialEnabled={form.watch('use_custom_color')}
            onChange={({ useCustom, hue, hex }) => {
              form.setValue('use_custom_color', useCustom);
              form.setValue('custom_color_h', hue);
              form.setValue('custom_color_hex', hex);
              
              // Si se activa custom, deseleccionar preset
              if (useCustom) {
                form.setValue('color', undefined);
              }
            }}
          />
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
      description={isEditing ? "Modifica los datos y configuración básica del proyecto" : "Crea un nuevo proyecto para tu organización"}
      icon={FolderPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Proyecto" : "Crear Proyecto"}
      onRightClick={() => form.handleSubmit(onSubmit)()}
      submitDisabled={createProjectMutation.isPending || updateProjectMutation.isPending || isUploadingImage}
      showLoadingSpinner={createProjectMutation.isPending || updateProjectMutation.isPending || isUploadingImage}
    />
  );

  return (
    <FormModalLayout
      headerContent={headerContent}
      viewPanel={null}
      editPanel={editPanel}
      footerContent={footerContent}
      onClose={handleClose}
      columns={1}
      isEditing={true}
      className="w-full"
    />
  );
}
