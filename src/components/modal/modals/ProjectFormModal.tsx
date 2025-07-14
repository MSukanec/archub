import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderPlus, Calendar, User, Building2, Settings, MapPin } from "lucide-react";

import { FormModalLayout } from "../form/FormModalLayout";
import { FormModalHeader } from "../form/FormModalHeader";
import { FormModalFooter } from "../form/FormModalFooter";
import { useModalPanelStore } from "../form/modalPanelStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useProjectTypes } from "@/hooks/use-project-types";
import { useProjectModalities } from "@/hooks/use-project-modalities";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import UserSelector from "@/components/ui-custom/UserSelector";

const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido"),
  created_at: z.string().min(1, "La fecha de creación es requerida"),
  created_by: z.string().min(1, "El creador es requerido"),
  project_type_id: z.string().optional(),
  modality_id: z.string().optional(),
  status: z.enum(["active", "inactive", "completed", "paused"]).default("active"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
  organization_id: string;
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

interface ProjectFormModalProps {
  modalData?: {
    editingProject?: Project;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ProjectFormModal({ modalData, onClose }: ProjectFormModalProps) {
  const { editingProject, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);
  const { data: projectTypes = [] } = useProjectTypes();
  const { data: projectModalities = [] } = useProjectModalities();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Encontrar el member_id del usuario actual
  const currentUserMember = organizationMembers.find(member => 
    member.user_id === userData?.user?.id
  );

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: editingProject?.name || "",
      created_at: editingProject ? editingProject.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      created_by: editingProject?.created_by || currentUserMember?.id || "",
      project_type_id: editingProject?.project_data?.project_type_id || "",
      modality_id: editingProject?.project_data?.modality_id || "",
      status: editingProject?.status || "active",
    }
  });

  // Reset form when editing project changes or current user member changes
  useEffect(() => {
    if (editingProject) {
      form.reset({
        name: editingProject.name,
        created_at: editingProject.created_at.split('T')[0],
        created_by: editingProject.created_by,
        project_type_id: editingProject.project_data?.project_type_id || "",
        modality_id: editingProject.project_data?.modality_id || "",
        status: editingProject.status,
      });
      setPanel('edit');
    } else if (currentUserMember) {
      form.reset({
        name: "",
        created_at: new Date().toISOString().split('T')[0],
        created_by: currentUserMember.id,
        project_type_id: "",
        modality_id: "",
        status: "active",
      });
      setPanel('edit');
    }
  }, [editingProject, currentUserMember, form, setPanel]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      if (!organizationId) {
        throw new Error('No hay una organización activa seleccionada');
      }

      if (isEditing && editingProject) {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            name: data.name,
            status: data.status,
            created_by: data.created_by,
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
            .insert({
              project_id: editingProject.id,
              project_type_id: data.project_type_id || null,
              modality_id: data.modality_id || null,
            });

          if (dataError) throw dataError;
        }

        return editingProject;
      } else {
        // Create new project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            organization_id: organizationId,
            name: data.name,
            status: data.status,
            created_by: data.created_by,
            created_at: new Date(data.created_at).toISOString(),
            is_active: true,
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Create project_data if type or modality is selected
        if (data.project_type_id || data.modality_id) {
          const { error: dataError } = await supabase
            .from('project_data')
            .insert({
              project_id: newProject.id,
              project_type_id: data.project_type_id || null,
              modality_id: data.modality_id || null,
            });

          if (dataError) throw dataError;
        }

        return newProject;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: isEditing ? "Proyecto actualizado" : "Proyecto creado",
        description: isEditing 
          ? "El proyecto ha sido actualizado exitosamente" 
          : "El nuevo proyecto ha sido creado exitosamente",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar el proyecto",
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
    createProjectMutation.mutate(data);
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
        <h4 className="font-medium">Estado</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.status === 'active' ? 'Activo' : 
           editingProject?.status === 'completed' ? 'Completado' :
           editingProject?.status === 'paused' ? 'Pausado' : 'Inactivo'}
        </p>
      </div>
      
      {editingProject?.creator && (
        <div>
          <h4 className="font-medium">Creador</h4>
          <p className="text-muted-foreground mt-1">{editingProject.creator.full_name}</p>
        </div>
      )}
      
      <div>
        <h4 className="font-medium">Fecha de creación</h4>
        <p className="text-muted-foreground mt-1">
          {editingProject?.created_at ? new Date(editingProject.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}
        </p>
      </div>
    </>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creador */}
          <FormField
            control={form.control}
            name="created_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creador *</FormLabel>
                <FormControl>
                  <UserSelector
                    users={organizationMembers?.map(member => ({
                      id: member.id,
                      full_name: member.full_name,
                      email: member.email || '',
                      avatar_url: member.avatar_url,
                      first_name: member.first_name,
                      last_name: member.last_name
                    })) || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar creador"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha */}
          <FormField
            control={form.control}
            name="created_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre del proyecto */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nombre del proyecto *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del proyecto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de proyecto */}
          <FormField
            control={form.control}
            name="project_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de proyecto</FormLabel>
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
              <FormItem className="col-span-2">
                <FormLabel>Estado del proyecto *</FormLabel>
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
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
      icon={FolderPlus}
      leftActions={
        currentPanel === 'edit' && isEditing ? (
          <button
            type="button"
            onClick={() => setPanel('view')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </button>
        ) : undefined
      }
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Proyecto" : "Crear Proyecto"}
      onRightClick={() => {
        if (currentPanel === 'view' && isEditing) {
          setPanel('edit');
        } else {
          form.handleSubmit(onSubmit)();
        }
      }}
      rightLoading={createProjectMutation.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}