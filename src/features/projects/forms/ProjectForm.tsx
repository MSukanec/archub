import { useRef, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderPlus, Check } from "lucide-react";
import chroma from "chroma-js";

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/shared/FileUploader";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/features/organization";
import { useProjectTypes, useProjectModalities } from "@/features/projects";
import { useProjectContext } from "@/stores/projectContext";
import { useToast } from "@/hooks/use-toast";
import { useUpdateChecklist } from "@/hooks/use-update-checklist";
import { supabase } from "@/lib/supabase";

import { useCreateProject } from '../hooks/use-create-project';
import { useUpdateProject } from '../hooks/use-update-project';
import { uploadProjectImage, updateProjectLastActive } from '@/features/projects';
import { QUERY_KEYS } from '../constants';
import { USER_ORGANIZATION_PREFERENCES_QUERY_KEYS } from '@/features/organization';
import ProjectColorAdvanced from '../components/ProjectColorAdvanced';

const PRESET_COLORS = [
  { hex: '#007aff', name: 'Ocean' },
  { hex: '#34c759', name: 'Grass' },
  { hex: '#ffcc00', name: 'Amber' },
  { hex: '#ff3b30', name: 'Coral' },
  { hex: '#af52de', name: 'Violet' },
  { hex: '#5e5ce6', name: 'Slate' },
  { hex: '#00c7be', name: 'Mint' },
  { hex: '#84cc16', name: 'Lime' },
];

function getTextColor(backgroundColor: string): string {
  try {
    const color = chroma(backgroundColor);
    return color.luminance() > 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

const projectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido"),
  project_type_id: z.string().optional(),
  project_modality_id: z.string().optional(),
  status: z.enum(["active", "inactive", "completed", "paused"]).default("active"),
  color: z.string().optional(),
  use_custom_color: z.boolean().default(false),
  custom_color_h: z.number().min(0).max(360).nullable().optional(),
  custom_color_hex: z.string().nullable().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

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
    image_bucket?: string;
    image_path?: string;
  };
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ProjectFormProps {
  modalData?: any;
  project?: Project;
  mode?: 'create' | 'edit' | 'view';
  onClose: () => void;
}

function FormPanel({
  form,
  onSubmit,
  projectTypes,
  projectModalities,
  organizationId,
  currentImageUrl,
  imagePreviewUrl,
  onFileSelect,
}: {
  form: ReturnType<typeof useForm<ProjectFormData>>;
  onSubmit: (data: ProjectFormData) => void;
  projectTypes: any[];
  projectModalities: any[];
  organizationId: string | undefined;
  currentImageUrl: string | null | undefined;
  imagePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="project-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Proyecto *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del proyecto" {...field} data-testid="input-project-name" />
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
                    <SelectTrigger data-testid="select-status">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="project_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-type">
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
                    <SelectTrigger data-testid="select-modality">
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

        <div className="space-y-2">
          <FormLabel>Imagen Principal (opcional)</FormLabel>
          <FileUploader
            variant="hero"
            mode="single"
            accept="images"
            heroImageUrl={imagePreviewUrl || currentImageUrl || null}
            filesToUpload={[]}
            onFilesChange={(files) => {
              if (files.length > 0 && files[0].file) {
                onFileSelect(files[0].file);
              } else {
                onFileSelect(null);
              }
            }}
            onHeroImageChange={(url) => {
              if (!url) {
                onFileSelect(null);
              }
            }}
            emptyStateDescription="Arrastra una imagen o haz clic para seleccionar"
            maxSizeLabel="Formatos: JPG, PNG, WebP • Tamaño máximo: 2MB"
            compressionPreset="project-cover"
            compressOnDrop={true}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color del proyecto</FormLabel>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.hex}
                      type="button"
                      onClick={() => {
                        field.onChange(colorOption.hex);
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

        <ProjectColorAdvanced
          initialHue={form.watch('custom_color_h') ?? undefined}
          initialEnabled={form.watch('use_custom_color')}
          onChange={({ useCustom, hue, hex }) => {
            form.setValue('use_custom_color', useCustom);
            form.setValue('custom_color_h', hue);
            form.setValue('custom_color_hex', hex);
            if (useCustom) {
              form.setValue('color', undefined);
            }
          }}
        />
      </form>
    </Form>
  );
}

function ViewPanel({
  project,
  projectTypes,
  projectModalities,
}: {
  project: Project | undefined;
  projectTypes: any[];
  projectModalities: any[];
}) {
  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'paused': return 'Pausado';
      case 'inactive': return 'Inactivo';
      default: return 'Sin especificar';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Nombre del proyecto</h4>
        <p className="mt-1">{project?.name || 'Sin nombre'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Tipo</h4>
          <p className="mt-1">
            {project?.project_data?.project_type_id 
              ? projectTypes.find(t => t.id === project.project_data?.project_type_id)?.name || 'Sin especificar'
              : 'Sin especificar'}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Modalidad</h4>
          <p className="mt-1">
            {project?.project_data?.project_modality_id 
              ? projectModalities.find(m => m.id === project.project_data?.project_modality_id)?.name || 'Sin especificar'
              : 'Sin especificar'}
          </p>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Estado</h4>
        <p className="mt-1">{getStatusLabel(project?.status)}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Color</h4>
        <div className="flex items-center gap-2 mt-1">
          <div 
            className="w-6 h-6 rounded-full border border-border"
            style={{ backgroundColor: project?.color || '#84cc16' }}
          />
          <span className="text-sm">
            {PRESET_COLORS.find(c => c.hex === project?.color)?.name || project?.color || 'Lime'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProjectForm({ modalData, project: projectProp, mode: modeProp, onClose }: ProjectFormProps) {
  const project = projectProp || modalData?.project || modalData?.editingProject;
  const mode = modeProp || modalData?.mode || (project ? 'edit' : 'create');
  
  const hasInitializedRef = useRef(false);
  
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId, setSelectedProject } = useProjectContext();
  const organizationId = currentOrganizationId || project?.organization_id || userData?.organization?.id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);
  const { data: projectTypes = [] } = useProjectTypes(organizationId);
  const { data: projectModalities = [] } = useProjectModalities(organizationId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const updateChecklist = useUpdateChecklist();

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: currentImageUrl } = useQuery({
    queryKey: ['project-edit-image', project?.id, project?.project_data?.image_bucket, project?.project_data?.image_path],
    queryFn: async () => {
      if (!project?.project_data?.image_bucket || !project?.project_data?.image_path) {
        return null;
      }
      const { getProjectImageUrlFromData } = await import('@/features/projects');
      return await getProjectImageUrlFromData(project.project_data);
    },
    enabled: !!project && !!project?.project_data?.image_bucket && !!project?.project_data?.image_path,
  });

  const currentUserMember = organizationMembers.find(member => 
    member.user_id === userData?.user?.id
  );

  const getDefaultValues = (): ProjectFormData => {
    if (project && mode !== 'create') {
      return {
        name: project.name || "",
        project_type_id: project.project_data?.project_type_id || "",
        project_modality_id: project.project_data?.project_modality_id || "",
        status: (project.status as "active" | "inactive" | "completed" | "paused") || "active",
        color: project.color || "#84cc16",
        use_custom_color: project.use_custom_color || false,
        custom_color_h: project.custom_color_h || null,
        custom_color_hex: project.custom_color_hex || null,
      };
    }
    return {
      name: "",
      project_type_id: "",
      project_modality_id: "",
      status: "active",
      color: "#84cc16",
      use_custom_color: false,
      custom_color_h: null,
      custom_color_hex: null,
    };
  };

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: getDefaultValues(),
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (projectId: string) => {
    if (!selectedImageFile || !organizationId) return;

    setIsUploadingImage(true);
    try {
      toast({
        title: "Subiendo imagen...",
        description: "Tu imagen se está procesando",
      });

      await uploadProjectImage(selectedImageFile, projectId, organizationId);
      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      
      toast({
        title: "Imagen subida",
        description: "La imagen principal se ha guardado correctamente"
      });
      
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    } catch (error: any) {
      toast({
        title: "Error al subir imagen",
        description: error.message || "No se pudo subir la imagen.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClose = () => {
    if (isUploadingImage) {
      toast({
        title: "Espera un momento",
        description: "La imagen se está subiendo, por favor espera...",
        variant: "default"
      });
      return;
    }

    form.reset();
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    onClose();
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "No hay una organización activa seleccionada",
        variant: "destructive"
      });
      return;
    }

    if (!currentUserMember && mode === 'create') {
      toast({
        title: "Error",
        description: "Usuario no es miembro de la organización",
        variant: "destructive"
      });
      return;
    }

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
      if (mode === 'edit' && project) {
        await updateProjectMutation.mutateAsync({
          projectId: project.id,
          data: {
            ...cleanedData,
            organization_id: organizationId,
          }
        });

        if (selectedImageFile) {
          await handleImageUpload(project.id);
        }

        toast({
          title: "Proyecto actualizado",
          description: "El proyecto ha sido actualizado exitosamente"
        });
      } else {
        const newProject = await createProjectMutation.mutateAsync({
          organization_id: organizationId,
          created_by: currentUserMember!.id,
          ...cleanedData,
        });

        await queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.PROJECTS, organizationId]
        });

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
            
            setSelectedProject(newProject.id, organizationId);
            updateProjectLastActive(newProject.id, organizationId).catch(err => 
              console.error('Error updating project last_active_at:', err)
            );

            await queryClient.refetchQueries({
              queryKey: USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(userData.user.id, organizationId)
            });
          } catch (error) {
            console.error('Error setting project as active:', error);
          }
        }

        if (userData?.user?.id) {
          await updateChecklist.mutateAsync({ 
            key: 'create_project', 
            value: true 
          });
        }

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

  const getTitle = () => {
    if (mode === 'view') return project?.name || 'Proyecto';
    if (mode === 'edit') return 'Editar Proyecto';
    return 'Nuevo Proyecto';
  };

  const getDescription = () => {
    if (mode === 'view') return 'Detalles del proyecto';
    if (mode === 'edit') return 'Modifica los datos y configuración básica del proyecto';
    return 'Crea un nuevo proyecto para tu organización';
  };

  if (mode === 'view') {
    return (
      <ModalLayout onClose={handleClose} size="lg">
        <ModalHeader
          title={getTitle()}
          description={getDescription()}
          icon={FolderPlus}
        />
        <ModalBody>
          <ViewPanel 
            project={project} 
            projectTypes={projectTypes} 
            projectModalities={projectModalities} 
          />
        </ModalBody>
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
        />
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={handleClose} size="lg">
      <ModalHeader
        title={getTitle()}
        description={getDescription()}
        icon={FolderPlus}
      />
      <ModalBody>
        <FormPanel
          form={form}
          onSubmit={onSubmit}
          projectTypes={projectTypes}
          projectModalities={projectModalities}
          organizationId={organizationId}
          currentImageUrl={mode === 'edit' ? currentImageUrl : null}
          imagePreviewUrl={imagePreviewUrl}
          onFileSelect={handleFileSelect}
        />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        submitText={mode === 'edit' ? 'Actualizar Proyecto' : 'Crear Proyecto'}
        onSubmit={() => form.handleSubmit(onSubmit)()}
        isSubmitting={createProjectMutation.isPending || updateProjectMutation.isPending || isUploadingImage}
      />
    </ModalLayout>
  );
}

export default ProjectForm;
