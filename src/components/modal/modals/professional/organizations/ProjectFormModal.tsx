import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderPlus, Calendar, User, Building2, Settings, MapPin } from "lucide-react";

import { FormModalLayout } from "../../form/FormModalLayout";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { useModalPanelStore } from "../../form/modalPanelStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useProjectTypes } from "@/hooks/use-project-types";
import { useProjectModalities } from "@/hooks/use-project-modalities";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import UserSelectorField from "@/components/ui-custom/fields/UserSelectorField";

const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido"),
  created_at: z.string().min(1, "La fecha de creación es requerida"),
  created_by: z.string().min(1, "El creador es requerido"),
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
      color: editingProject?.color || "#84cc16",
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
        color: editingProject.color || "#84cc16",
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
        color: "#84cc16",
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
        // Create new project using upsert to handle any potential conflicts
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .upsert({
            organization_id: organizationId,
            name: data.name,
            status: data.status,
            created_by: data.created_by,
            created_at: new Date(data.created_at).toISOString(),
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
          }
        } catch (error) {
          console.error('Error updating user organization preferences:', error);
        }
      }

      // Only invalidate necessary queries to prevent unnecessary requests
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-data'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'], exact: false });
      toast({
        title: isEditing ? "Proyecto actualizado" : "Proyecto creado",
        description: isEditing 
          ? "El proyecto ha sido actualizado exitosamente" 
          : "El nuevo proyecto ha sido creado y establecido como activo",
      });
      handleClose();
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
      project_type_id: data.project_type_id || null,
      modality_id: data.modality_id || null,
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
      
      <div>
        <h4 className="font-medium">Color del proyecto</h4>
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
          {/* Primera fila: Creador - Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Creador */}
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creador *</FormLabel>
                  <FormControl>
                    <UserSelectorField
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
          </div>

          {/* Segunda fila: Tipo - Modalidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Tercera fila: Nombre (solo) */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del proyecto *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del proyecto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cuarta fila: Estado - Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
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

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => {
                // Función para convertir nombres de colores CSS a hex
                const colorNameToHex = (colorName: string): string => {
                  const colorMap: { [key: string]: string } = {
                    'red': '#ff0000',
                    'green': '#008000',
                    'blue': '#0000ff',
                    'yellow': '#ffff00',
                    'cyan': '#00ffff',
                    'magenta': '#ff00ff',
                    'orange': '#ffa500',
                    'purple': '#800080',
                    'pink': '#ffc0cb',
                    'brown': '#a52a2a',
                    'gray': '#808080',
                    'grey': '#808080',
                    'black': '#000000',
                    'white': '#ffffff',
                    'lime': '#00ff00',
                    'navy': '#000080',
                    'maroon': '#800000',
                    'olive': '#808000',
                    'teal': '#008080',
                    'silver': '#c0c0c0',
                    'gold': '#ffd700',
                    'indigo': '#4b0082',
                    'violet': '#ee82ee',
                    'turquoise': '#40e0d0',
                    'coral': '#ff7f50',
                    'salmon': '#fa8072',
                    'crimson': '#dc143c',
                    'khaki': '#f0e68c',
                    'plum': '#dda0dd',
                    'orchid': '#da70d6',
                    'tan': '#d2b48c',
                    'beige': '#f5f5dc',
                    'mint': '#98ff98',
                    'lavender': '#e6e6fa',
                    'ivory': '#fffff0'
                  };
                  return colorMap[colorName.toLowerCase()] || colorName;
                };

                // Función para normalizar el valor del color
                const normalizeColor = (value: string): string => {
                  if (!value) return "#ffffff";
                  
                  const trimmed = value.trim().toLowerCase();
                  
                  // Si es un nombre de color, convertir a hex
                  const hexFromName = colorNameToHex(trimmed);
                  if (hexFromName !== trimmed) {
                    return hexFromName;
                  }
                  
                  // Si no tiene #, agregarlo
                  if (!trimmed.startsWith('#')) {
                    // Validar que sea un código hex válido (3 o 6 caracteres)
                    if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(trimmed)) {
                      return `#${trimmed}`;
                    }
                  }
                  
                  // Si ya tiene # y es válido, devolverlo
                  if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(trimmed)) {
                    return trimmed;
                  }
                  
                  // Si no es válido, mantener el valor original
                  return value;
                };

                const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  const normalizedValue = normalizeColor(inputValue);
                  field.onChange(normalizedValue);
                };

                const displayValue = field.value || "#ffffff";
                const isValidColor = /^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(displayValue);

                return (
                  <FormItem>
                    <FormLabel>Color del proyecto</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={isValidColor ? displayValue : "#ffffff"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            type="text"
                            value={displayValue}
                            onChange={handleTextChange}
                            onBlur={() => {
                              const normalized = normalizeColor(field.value || "");
                              if (normalized !== field.value) {
                                field.onChange(normalized);
                              }
                            }}
                            placeholder="Ej: #ff0000, red, cyan"
                            className="flex-1"
                          />
                        </div>
                        {!isValidColor && displayValue && (
                          <p className="text-xs text-yellow-600">
                            Ingresa un color válido (ej: #ff0000, red, cyan)
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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