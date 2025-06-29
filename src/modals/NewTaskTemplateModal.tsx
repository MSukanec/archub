import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCreateTaskTemplate, useUpdateTaskTemplate, type TaskTemplate } from "@/hooks/use-task-templates-admin";
import { useTopLevelCategories, useSubcategories, useElementCategories, useTaskCategories } from "@/hooks/use-task-categories";
import { TemplateNameBuilder, type TaskTemplateParameter } from "@/components/ui-custom/misc/TemplateNameBuilder";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code_prefix: z.string().min(1, "El prefijo de código es requerido"),
  name_template: z.string().min(1, "La plantilla de nombre es requerida"),
  category_id: z.string().min(1, "La categoría es requerida"),
  parent_category_id: z.string().min(1, "La categoría principal es requerida"),
  sub_category_id: z.string().min(1, "La subcategoría es requerida"),
});

type FormData = z.infer<typeof formSchema>;

interface NewTaskTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: TaskTemplate;
}

export function NewTaskTemplateModal({ 
  open, 
  onClose, 
  template 
}: NewTaskTemplateModalProps) {
  const isEditing = !!template;
  
  const { data: parentCategories, isLoading: isLoadingParents } = useTopLevelCategories();
  const { data: allCategories, isLoading: isLoadingAll } = useTaskCategories();
  const createTaskTemplate = useCreateTaskTemplate();
  const updateTaskTemplate = useUpdateTaskTemplate();

  // State for cascading dropdowns
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  
  // Get subcategories and element categories based on selections
  const { data: subCategories, isLoading: isLoadingSubs } = useSubcategories(selectedParentId || null);
  const { data: elementCategories, isLoading: isLoadingElements } = useElementCategories(selectedSubId || null);

  // Mock parameters for demonstration - in a real implementation these would come from the template
  const mockParameters: TaskTemplateParameter[] = [
    {
      id: "1",
      name: "material",
      label: "Material",
      type: "select",
      is_required: true,
      position: 1
    },
    {
      id: "2", 
      name: "espesor",
      label: "Espesor",
      type: "number",
      unit: "cm",
      is_required: true,
      position: 2
    },
    {
      id: "3",
      name: "tipo_mortero", 
      label: "Tipo de Mortero",
      type: "select",
      is_required: false,
      position: 3
    },
    {
      id: "4",
      name: "ubicacion",
      label: "Ubicación",
      type: "text",
      is_required: false,
      position: 4
    },
    {
      id: "5",
      name: "con_refuerzo",
      label: "Con Refuerzo",
      type: "boolean",
      is_required: false,
      position: 5
    }
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code_prefix: "",
      name_template: "",
      category_id: "",
      parent_category_id: "",
      sub_category_id: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (template && open && allCategories) {
      // Find the template's category in the hierarchy
      const templateCategory = allCategories.find(cat => cat.id === template.category_id);
      if (templateCategory && templateCategory.parent_id) {
        const parentCategory = allCategories.find(cat => cat.id === templateCategory.parent_id);
        if (parentCategory && parentCategory.parent_id) {
          const grandParentCategory = allCategories.find(cat => cat.id === parentCategory.parent_id);
          if (grandParentCategory) {
            setSelectedParentId(grandParentCategory.id);
            setSelectedSubId(parentCategory.id);
          }
        }
      }

      form.reset({
        name: template.name,
        code_prefix: template.code_prefix,
        name_template: template.name_template,
        category_id: template.category_id,
        parent_category_id: templateCategory?.parent_id ? 
          allCategories.find(cat => cat.id === templateCategory.parent_id)?.parent_id || "" : "",
        sub_category_id: templateCategory?.parent_id || "",
      });
    } else if (!template && open) {
      // Reset form for new template
      form.reset({
        name: "",
        code_prefix: "",
        name_template: "",
        category_id: "",
        parent_category_id: "",
        sub_category_id: "",
      });
      setSelectedParentId("");
      setSelectedSubId("");
    }
  }, [template, open, allCategories, form]);

  const isLoading = createTaskTemplate.isPending || updateTaskTemplate.isPending;

  const handleSubmit = async (data: FormData) => {
    try {
      if (isEditing && template) {
        await updateTaskTemplate.mutateAsync({
          id: template.id,
          ...data,
        });
      } else {
        await createTaskTemplate.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task template:", error);
    }
  };

  if (!open) return null;

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
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <Accordion type="single" collapsible defaultValue="categoria" className="space-y-2">
                  {/* Sección Categoría */}
                  <AccordionItem value="categoria" className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <span className="text-sm font-medium">Categoría</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      {/* Categoría Principal */}
                      <FormField
                        control={form.control}
                        name="parent_category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="required-asterisk">Categoría Principal</FormLabel>
                            {isLoadingParents ? (
                              <Skeleton className="h-10 w-full" />
                            ) : (
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedParentId(value);
                                  // Reset dependent dropdowns and fields
                                  form.setValue("sub_category_id", "");
                                  form.setValue("category_id", "");
                                  form.setValue("code_prefix", "");
                                  form.setValue("name", "");
                                  setSelectedSubId("");
                                }} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría principal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {parentCategories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subcategoría */}
                      <FormField
                        control={form.control}
                        name="sub_category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="required-asterisk">Subcategoría</FormLabel>
                            {isLoadingSubs && selectedParentId ? (
                              <Skeleton className="h-10 w-full" />
                            ) : (
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedSubId(value);
                                  // Reset final category and dependent fields
                                  form.setValue("category_id", "");
                                  form.setValue("code_prefix", "");
                                  form.setValue("name", "");
                                }} 
                                value={field.value}
                                disabled={!selectedParentId}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={!selectedParentId ? "Seleccione primero una categoría principal" : "Seleccionar subcategoría"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subCategories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Categoría Final */}
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="required-asterisk">Categoría Final</FormLabel>
                            {isLoadingElements && selectedSubId ? (
                              <Skeleton className="h-10 w-full" />
                            ) : (
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  
                                  // Find the selected category to get its code and name
                                  const selectedCategory = elementCategories?.find(cat => cat.id === value);
                                  if (selectedCategory) {
                                    // Set code_prefix and name from selected category
                                    form.setValue("code_prefix", selectedCategory.code || "");
                                    form.setValue("name", selectedCategory.name || "");
                                  }
                                }} 
                                value={field.value}
                                disabled={!selectedSubId}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={!selectedSubId ? "Seleccione primero una subcategoría" : "Seleccionar categoría final"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {elementCategories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Prefijo de Código */}
                      <FormField
                        control={form.control}
                        name="code_prefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prefijo de Código</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Generado automáticamente"
                                readOnly
                                className="bg-muted cursor-not-allowed"
                              />
                            </FormControl>
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
                            <FormLabel className="required-asterisk">Nombre</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Copiado de Categoría Final"
                                readOnly
                                className="bg-muted cursor-not-allowed"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sección Plantilla */}
                  <AccordionItem value="plantilla" className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <span className="text-sm font-medium">Plantilla</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {/* Plantilla de Nombre */}
                      <FormField
                        control={form.control}
                        name="name_template"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="required-asterisk">Plantilla de Nombre</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Ej: Excavación de {{tipo}} en {{material}} con {{herramienta}}"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
            saveDisabled={!form.watch("category_id") || !form.watch("name") || !form.watch("name_template")}
          />
        )
      }}
    </CustomModalLayout>
  );
}