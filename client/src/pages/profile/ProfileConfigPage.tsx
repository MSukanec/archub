import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Bell, User, Lock, Eye, EyeOff, Mail, Shield } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Esquema de validación para la pestaña de perfil
const profileFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  fullName: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un correo electrónico válido"),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});

// Esquema de validación para la pestaña de seguridad
const securityFormSchema = z.object({
  currentPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Esquema de validación para la pestaña de notificaciones
const notificationsFormSchema = z.object({
  emailNotifications: z.boolean(),
  projectUpdates: z.boolean(),
  taskReminders: z.boolean(),
  budgetAlerts: z.boolean(),
  materialPriceChanges: z.boolean(),
});

// Tipo de usuario para los datos
type User = {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export default function ProfileConfigPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });

  // Consulta para obtener los datos del usuario
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Formulario para el perfil
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  // Formulario para la seguridad
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Formulario para las notificaciones
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      projectUpdates: true,
      taskReminders: true,
      budgetAlerts: true,
      materialPriceChanges: false,
    },
  });

  // Mutación para actualizar el perfil
  const profileMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileFormSchema>) => {
      // Aquí iría la lógica para enviar los datos al servidor
      // Por ahora, simularemos un retraso y éxito
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { ...user, ...values };
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar la contraseña
  const passwordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof securityFormSchema>) => {
      // Aquí iría la lógica para enviar los datos al servidor
      // Por ahora, simularemos un retraso y éxito
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      });
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña. Asegúrate de que la contraseña actual sea correcta.",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar las notificaciones
  const notificationsMutation = useMutation({
    mutationFn: async (values: z.infer<typeof notificationsFormSchema>) => {
      // Aquí iría la lógica para enviar los datos al servidor
      // Por ahora, simularemos un retraso y éxito
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return values;
    },
    onSuccess: () => {
      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias de notificación han sido actualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las preferencias. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Manejadores de formularios
  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    profileMutation.mutate(values);
  };

  const onSecuritySubmit = (values: z.infer<typeof securityFormSchema>) => {
    passwordMutation.mutate(values);
  };

  const onNotificationsSubmit = (values: z.infer<typeof notificationsFormSchema>) => {
    notificationsMutation.mutate(values);
  };

  // Actualizar el formulario cuando se carguen los datos del usuario
  useState(() => {
    if (user) {
      profileForm.reset({
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        bio: "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  });

  // Obtener las iniciales del nombre completo para el avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/profile')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Perfil
          </Button>
          <h1 className="text-2xl font-bold">Configuración del Perfil</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>
                  Actualiza tu información personal y detalles de tu perfil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-2/3 space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de Usuario</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormDescription>
                                Este es tu nombre de identificación único en la plataforma.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre y Apellido" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correo Electrónico</FormLabel>
                              <FormControl>
                                <Input placeholder="nombre@ejemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Biografía</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Cuéntanos un poco sobre ti..."
                                  {...field}
                                  rows={4}
                                />
                              </FormControl>
                              <FormDescription>
                                Esta información se mostrará en tu perfil público.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-full md:w-1/3 space-y-6">
                        <FormItem>
                          <FormLabel>Foto de Perfil</FormLabel>
                          <div className="flex flex-col items-center space-y-4">
                            <Avatar className="w-32 h-32">
                              <AvatarImage src={user?.avatarUrl || ""} />
                              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                                {user?.fullName ? getInitials(user.fullName) : user?.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <FormField
                              control={profileForm.control}
                              name="avatarUrl"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input
                                      placeholder="URL de imagen (opcional)"
                                      className="text-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription className="text-center">
                                    Ingresa la URL de una imagen para tu avatar
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </FormItem>
                      </div>
                    </div>
                
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={profileMutation.isPending}>
                      {profileMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando cambios...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Save className="mr-2 h-4 w-4" />
                          Guardar cambios
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Seguridad */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Gestiona tu contraseña y la configuración de seguridad de tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-8">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña Actual</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword.current ? "text" : "password"}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => 
                                  setShowPassword({
                                    ...showPassword,
                                    current: !showPassword.current,
                                  })
                                }
                              >
                                {showPassword.current ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nueva Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword.new ? "text" : "password"}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => 
                                    setShowPassword({
                                      ...showPassword,
                                      new: !showPassword.new,
                                    })
                                  }
                                >
                                  {showPassword.new ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Al menos 6 caracteres.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword.confirm ? "text" : "password"}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => 
                                    setShowPassword({
                                      ...showPassword,
                                      confirm: !showPassword.confirm,
                                    })
                                  }
                                >
                                  {showPassword.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Actualizando contraseña...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Lock className="mr-2 h-4 w-4" />
                          Actualizar contraseña
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Notificaciones */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificación</CardTitle>
                <CardDescription>
                  Configura cómo y cuándo quieres recibir notificaciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                    <FormField
                      control={notificationsForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Notificaciones por Email</FormLabel>
                            <FormDescription>
                              Recibe notificaciones generales por correo electrónico.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Tipo de notificaciones</h4>
                      <FormField
                        control={notificationsForm.control}
                        name="projectUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Actualizaciones de Proyectos</FormLabel>
                              <FormDescription>
                                Notificaciones sobre cambios en tus proyectos.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="taskReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Recordatorios de Tareas</FormLabel>
                              <FormDescription>
                                Recordatorios sobre tareas pendientes o próximas.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="budgetAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Alertas de Presupuesto</FormLabel>
                              <FormDescription>
                                Alertas cuando un proyecto se acerca al límite presupuestario.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationsForm.control}
                        name="materialPriceChanges"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Cambios de Precios en Materiales</FormLabel>
                              <FormDescription>
                                Notificaciones sobre cambios significativos en los precios de materiales.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={notificationsMutation.isPending}>
                      {notificationsMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando preferencias...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Bell className="mr-2 h-4 w-4" />
                          Guardar preferencias
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}