import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTaskTemplate, useUpdateTaskTemplate, type TaskTemplate } from "@/hooks/use-task-templates-admin";
import { type TaskCategoryAdmin } from "@/hooks/use-task-categories-admin";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code_prefix: z.string().min(1, "El prefijo de código es requerido"),
  name_template: z.string().min(1, "La plantilla de nombre es requerida"),
  action_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface NewTaskCategoryTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: TaskTemplate;
  category: TaskCategoryAdmin;
}

export function NewTaskCategoryTemplateModal({ 
  open, 
  onClose, 
  template,
  category
}: NewTaskCategoryTemplateModalProps) {
  const isEditing = !!template;
  
  const createTaskTemplate = useCreateTaskTemplate();
  const updateTaskTemplate = useUpdateTaskTemplate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code_prefix: "",
      name_template: "",
      action_id: null,
    },
  });

  // Update form when template changes
  useEffect(() => {
    if (isEditing && template) {
      form.reset({
        name: template.name || "",
        code_prefix: template.code_prefix || "",
        name_template: template.name_template || "",
        action_id: template.action_id || null,
      });
    } else if (!isEditing) {
      form.reset({
        name: "",
        code_prefix: "",
        name_template: "",
        action_id: null,
      });
    }
  }, [template, category, isEditing, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && template) {
        await updateTaskTemplate.mutateAsync({
          id: template.id,
          ...data,
          category_id: category.id,
        });
      } else {
        await createTaskTemplate.mutateAsync({
          ...data,
          category_id: category.id,
        });
      }
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error saving task template:', error);
    }
  };

  return (
    <CustomModalLayout open={open} onOpenChange={onClose}>
      <CustomModalHeader
        title={isEditing ? "Editar Plantilla de Tarea" : "Nueva Plantilla de Tarea"}
        onClose={onClose}
      />

      <CustomModalBody columns={1}>
        <Form {...form}>
          <div className="space-y-4">
            {/* Category Info */}
            <div className="p-3 bg-muted/50 rounded-md border">
              <p className="text-sm font-medium">Categoría: {category.name}</p>
              {category.code && (
                <p className="text-xs text-muted-foreground">Código: {category.code}</p>
              )}
            </div>

            {/* Template Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Plantilla</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Plantilla para muros de ladrillo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Code Prefix */}
            <FormField
              control={form.control}
              name="code_prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefijo del Código <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: MSM" 
                      maxLength={4}
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Template */}
            <FormField
              control={form.control}
              name="name_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plantilla de Nombre <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Ej: Ejecución de {{tipo_muro}} de {{material}}"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CustomModalBody>

      <CustomModalFooter
        onCancel={onClose}
        onSave={form.handleSubmit(onSubmit)}
        saveText={isEditing ? "Actualizar Plantilla" : "Crear Plantilla"}
        loading={createTaskTemplate.isPending || updateTaskTemplate.isPending}
      />
    </CustomModalLayout>
  );
}