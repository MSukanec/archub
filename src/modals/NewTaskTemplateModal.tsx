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
import { useCreateTaskTemplate, useUpdateTaskTemplate, type TaskTemplate } from "@/hooks/use-task-templates-admin";
import { useTopLevelCategories, useSubcategories, useElementCategories, useTaskCategories } from "@/hooks/use-task-categories";

const taskTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  code_prefix: z.string().min(1, "El prefijo es requerido"),
  name_template: z.string()
    .min(1, "La plantilla de nombre es requerida")
    .refine(
      (val) => /\{\{[\w]+\}\}/.test(val),
      "La plantilla debe contener al menos un parámetro como {{parametro}}"
    ),
  parent_category_id: z.string().min(1, "Debe seleccionar una categoría principal"),
  sub_category_id: z.string().min(1, "Debe seleccionar una subcategoría"),
  category_id: z.string().min(1, "Debe seleccionar una categoría final")
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
  
  const { data: parentCategories } = useTopLevelCategories();
  const { data: allCategories } = useTaskCategories();
  const createTaskTemplate = useCreateTaskTemplate();
  const updateTaskTemplate = useUpdateTaskTemplate();

  // State for cascading dropdowns
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  
  // Get subcategories and element categories based on selections
  const { data: subCategories } = useSubcategories(selectedParentId || null);
  const { data: elementCategories } = useElementCategories(selectedSubId || null);
  
  const form = useForm<TaskTemplateFormData>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      name: "",
      code_prefix: "",
      name_template: "",
      parent_category_id: "",
      sub_category_id: "",
      category_id: ""
    }
  });

  // Initialize form for editing
  useEffect(() => {
    if (isEditing && template && open && allCategories) {
      // Find the category hierarchy for the template
      const finalCategory = allCategories.find(cat => cat.id === template.category_id);
      if (finalCategory) {
        const subCategory = allCategories.find(cat => cat.id === finalCategory.parent_id);
        if (subCategory) {
          const parentCategory = allCategories.find(cat => cat.id === subCategory.parent_id);
          
          setSelectedParentId(parentCategory?.id || "");
          setSelectedSubId(subCategory.id);
          
          form.reset({
            name: template.name,
            code_prefix: template.code_prefix,
            name_template: template.name_template,
            parent_category_id: parentCategory?.id || "",
            sub_category_id: subCategory.id,
            category_id: finalCategory.id
          });
        }
      }
    } else if (!isEditing && open) {
      form.reset({
        name: "",
        code_prefix: "",
        name_template: "",
        parent_category_id: "",
        sub_category_id: "",
        category_id: ""
      });
      setSelectedParentId("");
      setSelectedSubId("");
    }
  }, [isEditing, template, open, form, allCategories]);

  // Auto-populate code_prefix when final category is selected
  useEffect(() => {
    const categoryId = form.watch("category_id");
    if (categoryId && allCategories) {
      const selectedCategory = allCategories.find(cat => cat.id === categoryId);
      if (selectedCategory?.code) {
        form.setValue("code_prefix", selectedCategory.code);
      }
    }
  }, [form.watch("category_id"), allCategories, form]);

  const handleSubmit = async (data: TaskTemplateFormData) => {
    try {
      // Only send the final category_id and other required fields
      const submitData = {
        name: data.name,
        code_prefix: data.code_prefix,
        name_template: data.name_template,
        category_id: data.category_id
      };

      if (isEditing && template) {
        await updateTaskTemplate.mutateAsync({
          id: template.id,
          ...submitData
        });
      } else {
        await createTaskTemplate.mutateAsync(submitData);
      }
      onClose();
      form.reset();
      setSelectedParentId("");
      setSelectedSubId("");
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
                {/* Categoría Principal */}
                <FormField
                  control={form.control}
                  name="parent_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Categoría Principal</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedParentId(value);
                          // Reset dependent dropdowns
                          form.setValue("sub_category_id", "");
                          form.setValue("category_id", "");
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
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedSubId(value);
                          // Reset final category
                          form.setValue("category_id", "");
                        }} 
                        value={field.value}
                        disabled={!selectedParentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar subcategoría" />
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedSubId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría final" />
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
                          readOnly={!!form.watch("category_id")}
                          className={form.watch("category_id") ? "bg-muted cursor-not-allowed" : ""}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      {form.watch("category_id") && (
                        <p className="text-xs text-muted-foreground">
                          Este valor se toma automáticamente desde la categoría seleccionada
                        </p>
                      )}
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