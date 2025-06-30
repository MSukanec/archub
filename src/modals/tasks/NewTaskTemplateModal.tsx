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
import { useCreateTaskTemplate, useUpdateTaskTemplate, type TaskTemplate } from "@/hooks/use-task-templates-admin";
import { useTaskParametersAdmin } from "@/hooks/use-task-parameters-admin";
import { TemplateNameBuilder, type TaskTemplateParameter } from "@/components/ui-custom/misc/TemplateNameBuilder";
import { type TaskCategoryAdmin, useTaskCategoriesAdmin } from "@/hooks/use-task-categories-admin";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code_prefix: z.string().min(1, "El prefijo de código es requerido"),
  name_template: z.string().min(1, "La plantilla de nombre es requerida"),
  action_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface NewTaskTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: TaskTemplate;
  category?: TaskCategoryAdmin;
}

export function NewTaskTemplateModal({ 
  open, 
  onClose, 
  template,
  category
}: NewTaskTemplateModalProps) {
  const isEditing = !!template;
  
  const { data: parameters = [] } = useTaskParametersAdmin();
  const { data: categories = [] } = useTaskCategoriesAdmin();
  const createTaskTemplate = useCreateTaskTemplate();
  const updateTaskTemplate = useUpdateTaskTemplate();

  // Get category data for editing mode
  const templateCategory = isEditing && template 
    ? categories.find(cat => cat.id === template.category_id) 
    : category;

  // Transform parameters to TaskTemplateParameter format
  const templateParameters: TaskTemplateParameter[] = parameters.map(param => ({
    id: param.id,
    name: param.name,
    label: param.label,
    type: param.type,
    unit: undefined, // Unit will be resolved from unit_id if needed
    is_required: param.is_required,
    position: 0 // Default position since it's not in the database
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code_prefix: "",
      name_template: "",
      action_id: null,
    },
  });

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (open) {
      console.log('Modal opened, resetting form');
      console.log('template:', template);
      console.log('templateCategory:', templateCategory);
      
      // Reset form with template data if editing, empty if creating
      if (template) {
        form.reset({
          name: template.name || "",
          code_prefix: template.code_prefix || "",
          name_template: template.name_template || "",
          action_id: template.action_id || null,
        });
      } else {
        form.reset({
          name: templateCategory?.name || "",
          code_prefix: templateCategory?.code || "",
          name_template: "",
          action_id: null,
        });
      }
    }
  }, [open, template, templateCategory, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && template) {
        await updateTaskTemplate.mutateAsync({
          ...data,
          id: template.id,
          category_id: template.category_id, // Keep existing category
          action_id: data.action_id,
        });
      } else {
        await createTaskTemplate.mutateAsync({
          ...data,
          category_id: category?.id || "4ec7eacb-37b0-4b00-8420-36dca30cc291", // Use category prop or default
          action_id: data.action_id,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const isLoading = createTaskTemplate.isPending || updateTaskTemplate.isPending;

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Plantilla de Tarea" : "Nueva Plantilla de Tarea"}
            description={isEditing ? "Modifica los datos de la plantilla" : "Crea una nueva plantilla de tarea"}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Nombre</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la plantilla" 
                          {...field} 
                          disabled={isEditing}
                          className={isEditing ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code_prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Prefijo de Código</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: EXC, COL, INS" 
                          maxLength={4} 
                          {...field} 
                          disabled={isEditing}
                          className={isEditing ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Plantilla de Nombre</FormLabel>
                      <FormControl>
                        <TemplateNameBuilder
                          value={field.value}
                          onChange={field.onChange}
                          parameters={templateParameters}
                          placeholder="Construye la plantilla de nombre usando parámetros..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={isEditing ? "Actualizar" : "Crear"}
            isLoading={isLoading}
          />
        ),
      }}
    </CustomModalLayout>
  );
}