import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PdfConfigPreview } from "./PdfConfigPreview";

// Esquema de validación para los datos de la organización
const organizationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional(),
  website: z.string().url("URL inválida").nullable().optional(),
  taxId: z.string().nullable().optional(),
  pdfConfig: z.object({
    logoPosition: z.enum(["left", "center", "right"]),
    showAddress: z.boolean(),
    showPhone: z.boolean(),
    showEmail: z.boolean(),
    showWebsite: z.boolean(),
    showTaxId: z.boolean(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
  }),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface Organization {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  logoUrl: string | null;
  pdfConfig?: {
    logoPosition: "left" | "center" | "right";
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showTaxId: boolean;
    primaryColor: string;
    secondaryColor: string;
  };
}

interface Props {
  organization: Organization;
}

export function OrganizationSettings({ organization }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Default PDF config if not provided
  const defaultPdfConfig = {
    logoPosition: "left" as const,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: true,
    showTaxId: true,
    primaryColor: "#92c900",
    secondaryColor: "#f0f0f0",
  };

  // Prepare default values for the form
  const defaultValues: OrganizationFormValues = {
    name: organization.name,
    description: organization.description,
    address: organization.address,
    phone: organization.phone,
    email: organization.email,
    website: organization.website,
    taxId: organization.taxId,
    pdfConfig: organization.pdfConfig || defaultPdfConfig,
  };

  // Initialize react-hook-form
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues,
  });

  // Mutation para actualizar la organización
  const updateMutation = useMutation({
    mutationFn: async (values: OrganizationFormValues) => {
      const res = await apiRequest(
        "PATCH",
        `/api/organizations/${organization.id}`,
        values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/active"] });
      toast({
        title: "Organización actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para manejar el envío del formulario
  const onSubmit = (values: OrganizationFormValues) => {
    updateMutation.mutate(values);
  };

  // Función para manejar la subida del logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica
    if (!file.type.startsWith("image/")) {
      setLogoError("Por favor, sube solo archivos de imagen");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("La imagen debe ser menor a 2MB");
      return;
    }

    setLogoError(null);
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/organizations/${organization.id}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error al subir el logo");
      }

      const data = await res.json();

      // Actualizar caché
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/active"] });

      toast({
        title: "Logo actualizado",
        description: "Se ha subido el logo correctamente",
      });
    } catch (error) {
      setLogoError("Error al subir el logo. Inténtalo de nuevo.");
      console.error("Error uploading logo:", error);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Obtener el valor actual del formulario para la vista previa en tiempo real
  const currentFormValues = form.watch();
  const previewOrganization = {
    ...organization,
    ...currentFormValues,
    // Asegurarse que el logoUrl siga siendo el mismo
    logoUrl: organization.logoUrl
  };

  return (
    <Tabs defaultValue="general">
      <TabsList className="w-full">
        <TabsTrigger value="general" className="flex-1">Información General</TabsTrigger>
        <TabsTrigger value="pdf" className="flex-1">Configuración PDF</TabsTrigger>
        <TabsTrigger value="logo" className="flex-1">Logo</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Organización</CardTitle>
                <CardDescription>
                  Estos datos se utilizarán en los documentos y reportes generados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la organización</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Construcciones XYZ" />
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
                          {...field}
                          value={field.value || ''}
                          placeholder="Descripción breve de la organización"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RFC / ID Fiscal</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="ABC123456XYZ"
                          />
                        </FormControl>
                        <FormDescription>
                          Para incluir en facturas y presupuestos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="Calle, Ciudad, Código Postal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="+1 (555) 123-4567"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="contacto@empresa.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="https://www.empresa.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="ml-auto"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar cambios
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="pdf">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de PDF</CardTitle>
                    <CardDescription>
                      Personaliza cómo se verán tus documentos PDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pdfConfig.logoPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posición del Logo</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la posición" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="left">Izquierda</SelectItem>
                              <SelectItem value="center">Centro</SelectItem>
                              <SelectItem value="right">Derecha</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Información a mostrar</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pdfConfig.showAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Mostrar dirección</FormLabel>
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
                          control={form.control}
                          name="pdfConfig.showPhone"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Mostrar teléfono</FormLabel>
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
                          control={form.control}
                          name="pdfConfig.showEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Mostrar email</FormLabel>
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
                          control={form.control}
                          name="pdfConfig.showWebsite"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Mostrar sitio web</FormLabel>
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
                          control={form.control}
                          name="pdfConfig.showTaxId"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Mostrar RFC / ID fiscal</FormLabel>
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
                    </div>

                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pdfConfig.primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Primario</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} type="text" />
                              </FormControl>
                              <Input 
                                type="color" 
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 p-1 h-10"
                              />
                            </div>
                            <FormDescription>
                              Color principal para títulos y encabezados
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pdfConfig.secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Secundario</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} type="text" />
                              </FormControl>
                              <Input 
                                type="color" 
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 p-1 h-10"
                              />
                            </div>
                            <FormDescription>
                              Color para fondos y elementos secundarios
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      className="ml-auto"
                    >
                      {updateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Guardar configuración
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Así se verán tus documentos PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PdfConfigPreview organization={previewOrganization} />
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="logo">
        <Card>
          <CardHeader>
            <CardTitle>Logo de la Organización</CardTitle>
            <CardDescription>
              Sube el logo de tu organización para usarlo en documentos y la interfaz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{logoError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col items-center justify-center bg-secondary p-6 rounded-lg border border-dashed border-border">
              {organization.logoUrl ? (
                <div className="mb-4">
                  <img 
                    src={organization.logoUrl} 
                    alt="Logo de la organización" 
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mb-4 text-center text-muted-foreground">
                  <Upload className="mx-auto h-12 w-12 mb-2" />
                  <p>No hay logo cargado</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    className="cursor-pointer" 
                    type="button"
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {organization.logoUrl ? "Cambiar logo" : "Subir logo"}
                      </>
                    )}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                
                {organization.logoUrl && (
                  <Button 
                    variant="destructive" 
                    type="button"
                    disabled={uploadingLogo}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/organizations/${organization.id}/logo`, {
                          method: "DELETE",
                        });
                        
                        if (!res.ok) {
                          throw new Error("Error al eliminar el logo");
                        }
                        
                        queryClient.invalidateQueries({ queryKey: ["/api/organizations/active"] });
                        
                        toast({
                          title: "Logo eliminado",
                          description: "Se ha eliminado el logo correctamente",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "No se pudo eliminar el logo",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Eliminar logo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}