import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderPlus } from "lucide-react";

import { FormModalLayout } from "../../form/FormModalLayout";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { useModalPanelStore } from "../../form/modalPanelStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorField } from "@/components/ui-custom/fields/ColorField";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useProjectTypes } from "@/hooks/use-project-types";
import { useProjectModalities } from "@/hooks/use-project-modalities";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido"),
  project_type_id: z.string().optional(),
  modality_id: z.string().optional(),
  status: z.enum(["active", "inactive", "completed", "paused"]).default("active"),
  color: z.string().optional(),
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
  project_data?: {
    project_type_id?: string;
    modality_id?: string;
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
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);
  const { data: projectTypes = [] } = useProjectTypes();
  const { data: projectModalities = [] } = useProjectModalities();
  const { setSelectedProject } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Encontrar el member_id del usuario actual
  const currentUserMember = organizationMembers.find(member => 
    member.user_id === userData?.user?.id
  );

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: editingProject?.name || "",
      project_type_id: editingProject?.project_data?.project_type_id || "",
      modality_id: editingProject?.project_data?.modality_id || "",
      status: (editingProject?.status as "active" | "inactive" | "completed" | "paused") || "active",
      color: editingProject?.color || "#84cc16",
    }
  });

  // Reset form when editing project changes - ALWAYS in edit mode
  useEffect(() => {
    if (editingProject) {
      form.reset({
        name: editingProject.name,
        project_type_id: editingProject.project_data?.project_type_id || "",
        modality_id: editingProject.project_data?.modality_id || "",
        status: editingProject.status as "active" | "inactive" | "completed" | "paused",
        color: editingProject.color || "#84cc16",
      });
    } else {
      form.reset({
        name: "",
        project_type_id: "",
        modality_id: "",
        status: "active",
        color: "#84cc16",
      });
    }
    // Siempre establecer en modo edit
    setPanel('edit');
  }, [editingProject, form, setPanel]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      if (!organizationId) {
        throw new Error('No hay una organización activa seleccionada');
      }

      if (!currentUserMember) {
        throw new Error('Usuario no es miembro de la organización');
      }

      if (isEditing && editingProject) {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            name: data.name,
            status: data.status,
            color: data.color || "#84cc16",
          })
          .eq('id', editingProject.id);

        if (projectError) throw projectError;

        // Update project_data if it exists, create if it doesn't
        const { data: existingProjectData } = await supabase
          .from('project_data')
          .select('id')
          .eq('project_id', editingProject.id)
          .single();

        if (existingProjectData) {
          const { error: dataError } = await supabase
            .from('project_data')
            .update({
              project_type_id: data.project_type_id || null,
              modality_id: data.modality_id || null,
            })
            .eq('project_id', editingProject.id);

          if (dataError) throw dataError;
        } else if (data.project_type_id || data.modality_id) {
          const { error: dataError } = await supabase
            .from('project_data')
            .upsert({
              project_id: editingProject.id,
              project_type_id: data.project_type_id || null,
              modality_id: data.modality_id || null,
            }, {
              onConflict: 'project_id'
            });

          if (dataError) throw dataError;
        }

        return editingProject;
      } else {
        // Create new project using current user and current date automatically
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .upsert({
            organization_id: organizationId,
            name: data.name,
            status: data.status,
            created_by: currentUserMember.id, // Automático
            created_at: new Date().toISOString(), // Automático
            is_active: true,
            color: data.color || "#84cc16",
          }, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Create project_data if type or modality is selected
        if (data.project_type_id || data.modality_id) {
          const { error: dataError } = await supabase
            .from('project_data')
            .upsert({
              project_id: newProject.id,
              project_type_id: data.project_type_id || null,
              modality_id: data.modality_id || null,
            }, {
              onConflict: 'project_id'
            });

          if (dataError) throw dataError;
        }

        return newProject;
      }
    },
    onSuccess: async (newProject) => {
      // Si estamos creando un nuevo proyecto (no editando), establecerlo como activo
      if (!isEditing && newProject && userData?.user?.id && organizationId) {
        try {
          // Usar upsert para crear o actualizar las preferencias de organización del usuario
          const { error: preferencesError } = await supabase
            .from('user_organization_preferences')
            .upsert({
              user_id: userData.user.id,
              organization_id: organizationId,
              last_project_id: newProject.id
            }, {
              onConflict: 'user_id,organization_id'
            });
          
          if (preferencesError) {
            console.error('Error setting project as active:', preferencesError);
          } else {
            // 2. Cambiar sidebar a estado proyecto
            setSidebarLevel('project');
            
            // 3. Actualizar contexto de proyecto para que se actualice el sidebar
            setSelectedProject(newProject.id, organizationId);
          }
        } catch (error) {
          console.error('Error updating user organization preferences:', error);
        }
      }

      // Only invalidate necessary queries to prevent unnecessary requests
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-data'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['current-user'], exact: false });
      
      toast({
        title: isEditing ? "Proyecto actualizado" : "Proyecto creado",
        description: isEditing 
          ? "El proyecto ha sido actualizado exitosamente" 
          : "El nuevo proyecto ha sido creado y establecido como activo",
      });
      
      handleClose();
      
      // 4. Navegar al dashboard de proyecto si es un proyecto nuevo
      if (!isEditing && newProject) {
        setLocation('/project/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || error.details || "Hubo un error al procesar el proyecto",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    form.reset();
    setPanel('view');
    onClose();
  };

  const onSubmit = (data: CreateProjectForm) => {
    // Clean the data before submission
    const cleanedData = {
      ...data,
      project_type_id: data.project_type_id || undefined,
      modality_id: data.modality_id || undefined,
      color: data.color || "#84cc16"
    };
    
    createProjectMutation.mutate(cleanedData);
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
          {editingProject?.project_data?.modality_id ? 
           projectModalities.find(m => m.id === editingProject.project_data?.modality_id)?.name || 'Sin especificar'
           : 'Sin especificar'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Estado</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.status === 'active' ? 'Activo' : 
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
          {/* Nombre del Proyecto */}
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

          {/* Tipo */}
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

          {/* Modalidad */}
          <FormField
            control={form.control}
            name="modality_id"
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

          {/* Estado */}
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
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Color */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <ColorField
                    value={field.value || "#84cc16"}
                    onChange={field.onChange}
                    placeholder="Ej: #ff0000, red, cyan"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
      icon={FolderPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Proyecto" : "Crear Proyecto"}
      onRightClick={() => form.handleSubmit(onSubmit)()}
      submitDisabled={createProjectMutation.isPending}
      showLoadingSpinner={createProjectMutation.isPending}
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