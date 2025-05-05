import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project, insertProjectSchema } from "@shared/schema";
import { PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

// Extend project schema for form validation
const projectSchema = insertProjectSchema.extend({
  status: z.string().min(1, { message: "Seleccione un estado para el proyecto" }),
});

type FormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  projectId?: string;
}

export default function ProjectForm({ projectId }: ProjectFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = Boolean(projectId);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      userId: user?.id || 0,
    },
  });

  // Fetch project if editing
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: isEditing,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/projects");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el proyecto: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proyecto actualizado",
        description: "El proyecto ha sido actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      setLocation("/projects");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el proyecto: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update form when project data is loaded
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        userId: project.userId,
      });
    }
  }, [project, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const title = isEditing ? "Editar Proyecto" : "Nuevo Proyecto";
  const submitLabel = isEditing ? "Actualizar" : "Crear";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/projects")}
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
                        <FormLabel>Nombre del Proyecto</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del proyecto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción del proyecto"
                            className="min-h-[100px]"
                            onChange={field.onChange}
                            value={typeof field.value === 'string' ? field.value : ''}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROJECT_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/projects")}
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
