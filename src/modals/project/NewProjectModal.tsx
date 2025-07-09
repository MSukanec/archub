import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";

import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useProjectTypes } from "@/hooks/use-project-types";
import { useProjectModalities } from "@/hooks/use-project-modalities";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import UserSelector from "@/components/ui-custom/misc/UserSelector";

const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  created_at: z.string(),
  created_by: z.string().min(1, "El creador es requerido"),
  project_type_id: z.string(),
  modality_id: z.string(),
  status: z.string().min(1, "El estado es requerido"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
  organization_id: string;
  is_active: boolean;
  project_data?: {
    project_type_id?: string;
    modality_id?: string;
  };
}

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  editingProject?: Project | null;
}

export function NewProjectModal({ open, onClose, editingProject }: NewProjectModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);
  const { data: projectTypes = [] } = useProjectTypes();
  const { data: projectModalities = [] } = useProjectModalities();

  // Verificar que hay una organización activa
  if (!organizationId) {
    return <div className="p-6 text-center text-muted-foreground">No hay una organización activa seleccionada.</div>;
  }

  // Encontrar el member_id del usuario actual
  const currentUserMember = organizationMembers.find(member => 
    member.user_id === userData?.user?.id
  );

  // Helper para mostrar el nombre del miembro
  const getMemberLabel = (id: string) => {
    if (!id) return "";
    const member = organizationMembers.find(m => m.id === id);
    if (!member) return "";
    return member.full_name || member.email || 'Usuario';
  };

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: editingProject?.name || "",
      created_at: editingProject ? editingProject.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      created_by: editingProject?.created_by || currentUserMember?.id || "",
      project_type_id: editingProject?.project_data?.project_type_id || "none",
      modality_id: editingProject?.project_data?.modality_id || "none",
      status: editingProject?.status || "planning",
    },
  });

  // Reset form when currentUserMember changes or when editing project changes
  React.useEffect(() => {
    if (editingProject) {
      // Load editing project data
      form.reset({
        name: editingProject.name,
        created_at: editingProject.created_at.split('T')[0],
        created_by: editingProject.created_by,
        project_type_id: editingProject.project_data?.project_type_id || "none",
        modality_id: editingProject.project_data?.modality_id || "none",
        status: editingProject.status,
      });
    } else if (currentUserMember) {
      // Set default values for new project
      form.reset({
        name: "",
        created_at: new Date().toISOString().split('T')[0],
        created_by: currentUserMember.id,
        project_type_id: "none",
        modality_id: "none",
        status: "planning",
      });
    }
  }, [currentUserMember, editingProject, form]);

  const mutation = useMutation({
    mutationFn: async (formData: CreateProjectForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!organizationId) {
        throw new Error('No organization selected');
      }

      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            status: formData.status,
            created_by: formData.created_by,
          })
          .eq('id', editingProject.id);

        if (error) {
          throw new Error(`Error al actualizar proyecto: ${error.message}`);
        }

        // Update project_data
        const normalizedType = formData.project_type_id === 'none' ? null : formData.project_type_id;
        const normalizedModality = formData.modality_id === 'none' ? null : formData.modality_id;
        
        const { error: projectDataError } = await supabase
          .from('project_data')
          .upsert({
            project_id: editingProject.id,
            project_type_id: normalizedType,
            modality_id: normalizedModality,
          });

        if (projectDataError) {
          console.error('Error updating project data:', projectDataError);
        }
      } else {
        // Create new project
        const { data: projectData, error } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            status: formData.status,
            created_by: formData.created_by,
            organization_id: organizationId,
            created_at: new Date(formData.created_at).toISOString(),
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Error al crear proyecto: ${error.message}`);
        }

        // Upsert project_data para evitar errores de clave duplicada
        const normalizedType = formData.project_type_id === 'none' ? null : formData.project_type_id;
        const normalizedModality = formData.modality_id === 'none' ? null : formData.modality_id;
        
        if (normalizedType || normalizedModality) {
          const { error: projectDataError } = await supabase
            .from('project_data')
            .upsert({
              project_id: projectData.id,
              project_type_id: normalizedType,
              modality_id: normalizedModality,
            }, {
              onConflict: 'project_id'
            });
            
          if (projectDataError) {
            console.error('Error upserting project data:', projectDataError);
          }
        }

        // Update user preferences to set this as the last project
        await supabase
          .from('user_preferences')
          .update({ last_project_id: projectData.id })
          .eq('user_id', userData?.user?.id);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingProject 
          ? "Proyecto actualizado correctamente"
          : "Proyecto creado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el proyecto",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: CreateProjectForm) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <CustomModalLayout 
      open={open} 
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader
            title={editingProject ? "Editar Proyecto" : "Nuevo Proyecto"}
          />
        ),
        body: (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} id="project-form">
              <CustomModalBody columns={1}>
                {/* Creador */}
                <FormField
                  control={form.control}
                  name="created_by"
                  render={({ field }) => (
                    <FormItem>
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
                        label="Creador"
                        placeholder="Seleccionar creador"
                        required
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de creación */}
                <FormField
                  control={form.control}
                  name="created_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Fecha de creación</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
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
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nombre del proyecto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Construcción edificio residencial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipología */}
                <FormField
                  control={form.control}
                  name="project_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tipología</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tipología" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin tipología</SelectItem>
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
                      <FormLabel className="text-sm font-medium">Modalidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una modalidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin modalidad</SelectItem>
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
                      <FormLabel className="text-sm font-medium">Estado del proyecto *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planificación</SelectItem>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="on-hold">En pausa</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CustomModalBody>
            </form>
          </Form>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            cancelText="Cancelar"
            submitText={editingProject ? 'Actualizar Proyecto' : 'Crear Proyecto'}
            isLoading={mutation.isPending}
            form="project-form"
          />
        )
      }}
    />
  );
}