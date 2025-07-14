import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { CustomModalLayout } from "@/components/modal/legacy/CustomModalLayout";
import { CustomModalHeader } from "@/components/modal/legacy/CustomModalHeader";
import { CustomModalBody } from "@/components/modal/legacy/CustomModalBody";
import { CustomModalFooter } from "@/components/modal/legacy/CustomModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Package2, Settings } from "lucide-react";
import { useCreateTaskTemplate, useUpdateTaskTemplate, type TaskTemplate } from "@/hooks/use-task-templates-admin";
import { useTaskParametersAdmin } from "@/hooks/use-task-parameters-admin";
import { useUnits } from "@/hooks/use-units";
import { TemplateNameBuilder, type TaskTemplateParameter } from "@/components/ui-custom/TemplateNameBuilder";
import { type TaskCategoryAdmin, useTaskCategoriesAdmin } from "@/hooks/use-task-categories-admin";

const formSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name_template: z.string().min(1, "La plantilla de nombre es requerida"),
  action_id: z.string().optional().nullable(),
  unit_id: z.string().optional().nullable(),
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
  const { data: units = [] } = useUnits();
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
    position: 0 // Default position since it's not in the database
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name_template: "",
      action_id: null,
      unit_id: null,
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
          code: template.code || "",
          name_template: template.name_template || "",
          action_id: template.action_id || null,
          unit_id: template.unit_id || null,
        });
      } else {
        form.reset({
          code: templateCategory?.code || "",
          name_template: "",
          action_id: null,
          unit_id: null,
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
          unit_id: data.unit_id,
        });
      } else {
        await createTaskTemplate.mutateAsync({
          ...data,
          category_id: category?.id || "4ec7eacb-37b0-4b00-8420-36dca30cc291", // Use category prop or default
          action_id: data.action_id,
          unit_id: data.unit_id,
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
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Accordion type="single" collapsible defaultValue="step-1" className="w-full">
                  
                  {/* Paso 1: Información Básica */}
                  <AccordionItem value="step-1">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Paso 1: Información Básica
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="required-asterisk">Código</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej: EXC, COL, INS" 
                                maxLength={4} 
                                {...field} 
                                disabled={true}
                                className="bg-muted cursor-not-allowed"
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
                                categoryName={template ? template.name_template : templateCategory?.name}
                                placeholder="Construye la plantilla de nombre usando parámetros..."
                                onActionChange={(actionId) => {
                                  form.setValue('action_id', actionId);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Paso 2: Unidad */}
                  <AccordionItem value="step-2">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        Paso 2: Unidad
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="unit_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidad</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar unidad..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Sin unidad</SelectItem>
                                {units?.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Paso 3: Agregar Parámetros */}
                  <AccordionItem value="step-3">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Paso 3: Agregar Parámetros
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Los parámetros se configuran después de crear la plantilla.
                        Podrás agregarlos desde el editor de plantillas.
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
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