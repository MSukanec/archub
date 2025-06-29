import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTaskTemplate, useUpdateTaskTemplate, type TaskTemplate } from "@/hooks/use-task-templates-admin";
import { useTaskCategories } from "@/hooks/use-task-categories";

const taskTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code_prefix: z.string()
    .min(2, "El prefijo debe tener al menos 2 caracteres")
    .max(4, "El prefijo debe tener máximo 4 caracteres")
    .regex(/^[A-Z]+$/, "El prefijo debe contener solo letras mayúsculas"),
  name_template: z.string()
    .min(1, "La plantilla de nombre es requerida")
    .refine(
      (val) => /\{\{[\w]+\}\}/.test(val),
      "La plantilla debe contener al menos un parámetro como {{parametro}}"
    ),
  category_id: z.string().min(1, "Debe seleccionar una categoría")
});

type TaskTemplateFormData = z.infer<typeof taskTemplateSchema>;

interface NewTaskTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: TaskTemplate | null;
}

export function NewTaskTemplateModal({ 
  open, 
  onClose, 
  template 
}: NewTaskTemplateModalProps) {
  const isEditing = !!template;
  
  const { data: categories } = useTaskCategories();
  const createTaskTemplate = useCreateTaskTemplate();
  const updateTaskTemplate = useUpdateTaskTemplate();
  
  const form = useForm<TaskTemplateFormData>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      name: "",
      code_prefix: "",
      name_template: "",
      category_id: ""
    }
  });

  // Initialize form for editing
  useEffect(() => {
    if (isEditing && template && open) {
      form.reset({
        name: template.name,
        code_prefix: template.code_prefix,
        name_template: template.name_template,
        category_id: template.category_id
      });
    } else if (!isEditing && open) {
      form.reset({
        name: "",
        code_prefix: "",
        name_template: "",
        category_id: ""
      });
    }
  }, [isEditing, template, open, form]);

  const handleSubmit = async (data: TaskTemplateFormData) => {
    try {
      if (isEditing && template) {
        await updateTaskTemplate.mutateAsync({
          id: template.id,
          ...data
        });
      } else {
        await createTaskTemplate.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task template:", error);
    }
  };

  const isLoading = createTaskTemplate.isPending || updateTaskTemplate.isPending;

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Plantilla" : "Nueva Plantilla de Tarea"}
            description={isEditing ? "Modifica los datos de la plantilla" : "Completa la información para crear una nueva plantilla"}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Categoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
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
                  name="code_prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Prefijo de Código</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: FFF, SAB" 
                          {...field}
                          style={{ textTransform: 'uppercase' }}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la plantilla" {...field} />
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
                        <Textarea 
                          placeholder="Ej: Hormigonado de {{elemento}} con {{material}} de {{espesor}}"
                          className="min-h-[100px]"
                          {...field} 
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
            cancelText="Cancelar"
            saveText={isEditing ? "Actualizar" : "Crear"}
            onCancel={onClose}
            onSave={form.handleSubmit(handleSubmit)}
            isLoading={isLoading}
          />
        )
      }}
    </CustomModalLayout>
  );
}