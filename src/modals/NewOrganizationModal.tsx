import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";

import { CustomModalLayout } from "@/components/ui-custom/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/CustomModalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const createOrganizationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  created_at: z.date(),
  created_by: z.string().min(1, "El creador es requerido"),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  created_by?: string;
  plan?: {
    id: string;
    name: string;
    price: number;
  } | null;
}

interface NewOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  editingOrganization?: Organization | null;
}

export function NewOrganizationModal({ open, onClose, editingOrganization }: NewOrganizationModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: editingOrganization?.name || "",
      created_at: editingOrganization ? new Date(editingOrganization.created_at) : new Date(),
      created_by: editingOrganization?.created_by || userData?.user?.id || "",
    },
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (formData: CreateOrganizationForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (editingOrganization) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
          })
          .eq('id', editingOrganization.id);

        if (error) {
          throw new Error(`Error al actualizar organización: ${error.message}`);
        }
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            created_by: formData.created_by,
            created_at: formData.created_at.toISOString(),
            is_active: true,
            is_system: false,
          });

        if (error) {
          throw new Error(`Error al crear organización: ${error.message}`);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingOrganization 
          ? "Organización actualizada correctamente"
          : "Organización creada correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la organización",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: CreateOrganizationForm) => {
    createOrganizationMutation.mutate(data);
  };

  const getCreatorInfo = () => {
    return (userData?.user_data?.first_name && userData?.user_data?.last_name 
      ? `${userData.user_data.first_name} ${userData.user_data.last_name}`
      : userData?.user?.email) || 'Usuario';
  };

  const getCreatorInitials = () => {
    const name = getCreatorInfo();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingOrganization ? "Editar organización" : "Nueva organización"}
            description={editingOrganization ? "Actualiza los datos de la organización" : "Crea una nueva organización para gestionar tus proyectos"}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-4">
                  {/* Fecha de creación */}
                  <FormField
                    control={form.control}
                    name="created_at"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium">Fecha de creación</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Creador */}
                  <FormField
                    control={form.control}
                    name="created_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Creador</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar creador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizationMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                    {getCreatorInitials()}
                                  </div>
                                  {getCreatorInfo()}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Nombre de la organización</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Mi empresa constructora"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(handleSubmit)}
            saveText={editingOrganization ? 'Actualizar' : 'Crear organización'}
            saveLoading={createOrganizationMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}