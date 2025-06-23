import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Building } from "lucide-react";

import { CustomModalLayout } from "@/components/ui-custom/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/CustomModalBody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const createOrganizationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  created_at: z.date(),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
}

interface NewOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  editingOrganization?: Organization | null;
}

export function NewOrganizationModal({ open, onClose, editingOrganization }: NewOrganizationModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      created_at: new Date(),
    },
  });

  // Reset form when editingOrganization changes
  React.useEffect(() => {
    if (editingOrganization) {
      form.reset({
        name: editingOrganization.name,
        created_at: new Date(editingOrganization.created_at),
      });
    } else {
      form.reset({
        name: "",
        created_at: new Date(),
      });
    }
  }, [editingOrganization, form]);

  const createOrganizationMutation = useMutation({
    mutationFn: async (formData: CreateOrganizationForm) => {
      if (!userData?.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      if (editingOrganization) {
        // Update existing organization
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
        // Create new organization
        const { data: organizationData, error } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            created_at: formData.created_at.toISOString(),
            is_active: true,
            is_system: false,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Error al crear organización: ${error.message}`);
        }

        // Update user's last_organization_id to the new organization
        if (organizationData && userData?.preferences?.id) {
          await supabase
            .from('user_preferences')
            .update({
              last_organization_id: organizationData.id,
            })
            .eq('id', userData.preferences.id);
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

  const handleClose = () => {
    onClose();
    form.reset();
  };

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingOrganization ? "Editar organización" : "Nueva organización"}
            description={editingOrganization ? "Modifica la información de la organización" : "Crea una nueva organización"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id="organization-form">
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

                  {/* Nombre de la organización */}
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
          <div className="p-3 border-t border-[var(--card-border)] mt-auto">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="w-1/4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="organization-form"
                className="w-3/4"
                disabled={createOrganizationMutation.isPending}
              >
                {createOrganizationMutation.isPending ? 'Guardando...' : (editingOrganization ? "Actualizar" : "Crear organización")}
              </Button>
            </div>
          </div>
        )
      }}
    </CustomModalLayout>
  );
}