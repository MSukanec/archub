import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { MATERIAL_CATEGORIES, UNITS } from "@/lib/constants";

// Form schema
const materialSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  unit: z.string().min(1, "La unidad es requerida"),
  unitPrice: z.coerce.number().min(0, "El precio unitario debe ser un número positivo"),
});

type FormValues = z.infer<typeof materialSchema>;

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface MaterialFormProps {
  materialId?: string;
}

export default function MaterialForm({ materialId }: MaterialFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!materialId;

  const form = useForm<FormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "",
      unitPrice: 0,
    },
  });

  // Fetch material if we're editing
  const { data: material, isLoading } = useQuery<Material>({
    queryKey: [`/api/materials/${materialId}`],
    enabled: isEditing,
  });
  
  // Fetch units from database
  const { data: units = [] } = useQuery<Array<{ id: number, name: string, description: string | null }>>({
    queryKey: ['/api/units'],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('POST', '/api/materials', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material creado",
        description: "El material ha sido creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setLocation("/materials");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el material: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('PATCH', `/api/materials/${materialId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material actualizado",
        description: "El material ha sido actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${materialId}`] });
      setLocation("/materials");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el material: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update form when material data is loaded
  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        category: material.category,
        unit: material.unit,
        unitPrice: material.unitPrice,
      });
    }
  }, [material, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const title = isEditing ? "Editar Material" : "Nuevo Material";
  const submitLabel = isEditing ? "Actualizar" : "Crear";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/materials")}
          >
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && isEditing ? (
              <div className="text-center py-4">Cargando datos...</div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del material" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MATERIAL_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
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
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.length > 0 ? units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.name}>
                                {unit.name}
                              </SelectItem>
                            )) : UNITS.map((unit) => (
                              <SelectItem key={unit.name} value={unit.name}>
                                {unit.description}
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
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Unitario</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/materials")}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? "Guardando..." : submitLabel}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
