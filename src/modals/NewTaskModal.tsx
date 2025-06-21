import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CustomModalLayout } from "@/components/ui-custom/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/CustomModalFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useCurrentUser } from "@/hooks/use-current-user";

// Interfaz basada en la estructura real de la tabla tasks
interface Task {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  category_id?: string;
  subcategory_id?: string;
  element_category_id?: string;
  unit_id?: string;
  action_id?: string;
  element_id?: string;
  unit_labor_price?: number;
  unit_material_price?: number;
  created_at: string;
}

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  editingTask?: Task | null;
}

const taskSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  element_category_id: z.string().optional(),
  unit_id: z.string().optional(),
  action_id: z.string().optional(),
  element_id: z.string().optional(),
  unit_labor_price: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
  unit_material_price: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function NewTaskModal({ open, onClose, editingTask }: NewTaskModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: editingTask?.name || "",
      description: editingTask?.description || "",
      category_id: editingTask?.category_id || "",
      subcategory_id: editingTask?.subcategory_id || "",
      element_category_id: editingTask?.element_category_id || "",
      unit_id: editingTask?.unit_id || "",
      action_id: editingTask?.action_id || "",
      element_id: editingTask?.element_id || "",
      unit_labor_price: editingTask?.unit_labor_price || 0,
      unit_material_price: editingTask?.unit_material_price || 0,
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch subcategories based on selected category
  const { data: subcategories = [] } = useQuery({
    queryKey: ['task-subcategories', form.watch('category_id')],
    queryFn: async () => {
      if (!supabase || !form.watch('category_id')) return [];
      
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('category_id', form.watch('category_id'))
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!form.watch('category_id')
  });

  // Fetch element categories
  const { data: elementCategories = [] } = useQuery({
    queryKey: ['element-categories'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('element_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('units')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch actions
  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('actions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch elements
  const { data: elements = [] } = useQuery({
    queryKey: ['elements'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('elements')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Create/Update task mutation
  const taskMutation = useMutation({
    mutationFn: async (formData: TaskFormData) => {
      if (!supabase || !userData?.user?.id || !userData?.preferences?.last_organization_id) {
        throw new Error('Datos de usuario no disponibles');
      }

      const taskData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        element_category_id: formData.element_category_id || null,
        unit_id: formData.unit_id || null,
        action_id: formData.action_id || null,
        element_id: formData.element_id || null,
        unit_labor_price: formData.unit_labor_price || 0,
        unit_material_price: formData.unit_material_price || 0,
        organization_id: userData.preferences.last_organization_id,
      };

      if (editingTask) {
        // Update task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create task
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      onClose();
      form.reset();
      toast({
        title: editingTask ? "Tarea actualizada" : "Tarea creada",
        description: editingTask 
          ? "La tarea ha sido actualizada exitosamente." 
          : "La tarea ha sido creada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la tarea.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: TaskFormData) => {
    taskMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingTask ? "Editar Tarea" : "Nueva Tarea"}
            description={editingTask ? "Modifica los detalles de la tarea" : "Crea una nueva tarea para tu organización"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <div className="grid grid-cols-2 gap-4">
              {/* Nombre - ancho completo */}
              <div className="col-span-2">
                <Label htmlFor="name">Nombre de la tarea</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Ingresa el nombre de la tarea"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Descripción - ancho completo */}
              <div className="col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Describe los detalles de la tarea (opcional)"
                  rows={3}
                />
              </div>

              {/* Categoría - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="category_id">Categoría</Label>
                <Select
                  value={form.watch("category_id") || "none"}
                  onValueChange={(value) => {
                    form.setValue("category_id", value === "none" ? "" : value);
                    form.setValue("subcategory_id", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategoría - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="subcategory_id">Subcategoría</Label>
                <Select
                  value={form.watch("subcategory_id") || "none"}
                  onValueChange={(value) => form.setValue("subcategory_id", value === "none" ? "" : value)}
                  disabled={!form.watch("category_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin subcategoría</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoría de Elemento - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="element_category_id">Categoría de Elemento</Label>
                <Select
                  value={form.watch("element_category_id") || "none"}
                  onValueChange={(value) => form.setValue("element_category_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría de elemento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría de elemento</SelectItem>
                    {elementCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Elemento - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="element_id">Elemento</Label>
                <Select
                  value={form.watch("element_id") || "none"}
                  onValueChange={(value) => form.setValue("element_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un elemento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin elemento</SelectItem>
                    {elements.map((element) => (
                      <SelectItem key={element.id} value={element.id}>
                        {element.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Acción - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="action_id">Acción</Label>
                <Select
                  value={form.watch("action_id") || "none"}
                  onValueChange={(value) => form.setValue("action_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin acción</SelectItem>
                    {actions.map((action) => (
                      <SelectItem key={action.id} value={action.id}>
                        {action.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unidad - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="unit_id">Unidad</Label>
                <Select
                  value={form.watch("unit_id") || "none"}
                  onValueChange={(value) => form.setValue("unit_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin unidad</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Precio Mano de Obra - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="unit_labor_price">Precio Unitario de Mano de Obra</Label>
                <Input
                  id="unit_labor_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("unit_labor_price", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {form.formState.errors.unit_labor_price && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.unit_labor_price.message}</p>
                )}
              </div>

              {/* Precio Material - mitad del ancho */}
              <div className="col-span-1">
                <Label htmlFor="unit_material_price">Precio Unitario de Material</Label>
                <Input
                  id="unit_material_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("unit_material_price", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {form.formState.errors.unit_material_price && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.unit_material_price.message}</p>
                )}
              </div>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={editingTask ? "Actualizar" : "Crear"}
            isLoading={taskMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}