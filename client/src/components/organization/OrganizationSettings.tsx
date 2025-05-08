import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BudgetPdfPreview } from "@/components/budgets/BudgetPdfPreview";
import { 
  LucideArrowLeft,
  LucideArrowRight, 
  LucideAlignLeft, 
  LucideAlignCenter, 
  LucideAlignRight,
  LucideUpload 
} from "lucide-react";

// Definimos la interfaz para la organización
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

// Esquema para validar los datos del formulario
const organizationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Ingrese una dirección de email válida").nullable().optional(),
  website: z.string().url("Ingrese una URL válida").nullable().optional(),
  taxId: z.string().nullable().optional(),
});

// Interfaz para las propiedades del componente
interface OrganizationSettingsProps {
  organization: Organization;
}

// Define un modelo de presupuesto para la vista previa del PDF
const sampleBudget = {
  id: 1,
  name: "Presupuesto de Ejemplo",
  description: "Este es un ejemplo para mostrar cómo se verá el PDF generado."
};

// Datos de ejemplo para la vista previa
const sampleProject = {
  id: 1,
  name: "Proyecto de Ejemplo",
  description: "Descripción del proyecto de ejemplo"
};

// Tareas de ejemplo para la vista previa
const sampleBudgetTasks = [
  {
    id: 1,
    quantity: 10,
    task: {
      id: 1,
      name: "Instalación eléctrica",
      unit: "m²",
      unitPrice: 25,
      category: "Electricidad"
    }
  },
  {
    id: 2,
    quantity: 5,
    task: {
      id: 2,
      name: "Pintura",
      unit: "m²",
      unitPrice: 15,
      category: "Acabados"
    }
  },
  {
    id: 3,
    quantity: 8,
    task: {
      id: 3,
      name: "Piso laminado",
      unit: "m²",
      unitPrice: 35,
      category: "Pisos"
    }
  }
];

export function OrganizationSettings({ organization }: OrganizationSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logoUrl);
  const [activeTab, setActiveTab] = useState<string>("general");
  
  // Estado para la configuración del PDF
  const [pdfSettings, setPdfSettings] = useState<Partial<Organization>>({
    pdfConfig: organization.pdfConfig || {
      logoPosition: "left",
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: true,
      showTaxId: true,
      primaryColor: "#92c900",
      secondaryColor: "#f0f0f0"
    }
  });
  
  // Estado para la vista previa del PDF
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  
  // Configurar el formulario
  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name,
      description: organization.description,
      address: organization.address,
      phone: organization.phone,
      email: organization.email,
      website: organization.website,
      taxId: organization.taxId,
    }
  });
  
  // Función para cargar el logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validar tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error al cargar el logo",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      });
      return;
    }
    
    // Crear una vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Subir el archivo al servidor
    const formData = new FormData();
    formData.append('logo', file);
    
    setUploadingLogo(true);
    
    try {
      await apiRequest('POST', `/api/organizations/${organization.id}/logo`, formData, true);
      
      toast({
        title: "Logo actualizado",
        description: "El logo se ha actualizado correctamente",
      });
      
      // Invalidar la consulta para actualizar los datos
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/active'] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo subir el logo: ${error}`,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };
  
  // Mutación para actualizar la organización
  const updateOrganizationMutation = useMutation({
    mutationFn: (data: z.infer<typeof organizationSchema>) => {
      return apiRequest('PATCH', `/api/organizations/${organization.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Organización actualizada",
        description: "La información de la organización ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/active'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la organización: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutación para actualizar la configuración del PDF
  const updatePdfConfigMutation = useMutation({
    mutationFn: (data: { pdfConfig: any }) => {
      return apiRequest('PATCH', `/api/organizations/${organization.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "La configuración de exportación ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/active'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la configuración: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Manejar el cambio de posición del logo
  const handleLogoPositionChange = (position: "left" | "center" | "right") => {
    setPdfSettings(prev => ({
      ...prev,
      pdfConfig: {
        ...prev.pdfConfig!,
        logoPosition: position
      }
    }));
  };
  
  // Manejar el cambio de opciones de visualización
  const handleToggleOption = (option: string, value: boolean) => {
    setPdfSettings(prev => ({
      ...prev,
      pdfConfig: {
        ...prev.pdfConfig!,
        [option]: value
      }
    }));
  };
  
  // Manejar el cambio de color
  const handleColorChange = (colorType: string, value: string) => {
    setPdfSettings(prev => ({
      ...prev,
      pdfConfig: {
        ...prev.pdfConfig!,
        [colorType]: value
      }
    }));
  };
  
  // Guardar la configuración del PDF
  const savePdfConfig = () => {
    updatePdfConfigMutation.mutate({ pdfConfig: pdfSettings.pdfConfig });
  };
  
  // Manejar envío del formulario
  const onSubmit = (data: z.infer<typeof organizationSchema>) => {
    updateOrganizationMutation.mutate(data);
  };
  
  // Actualizar la vista previa del PDF cuando cambie la configuración
  useEffect(() => {
    // La vista previa se actualizará cuando se cambia la configuración
  }, [pdfSettings]);
  
  // Combinar la organización con la configuración actualizada para la vista previa
  const previewOrganization = {
    ...organization,
    ...pdfSettings
  };

  return (
    <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="pdf">Exportación PDF</TabsTrigger>
      </TabsList>
      
      {/* Tab de Información General */}
      <TabsContent value="general">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sección de Logo */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Logo de la Organización</h3>
              <div className="flex items-start gap-4">
                <div className="border rounded-md w-32 h-32 flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo de la organización" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-2">
                      Sin logo
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="logo-upload" className="mb-2">Subir nuevo logo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Sube una imagen PNG o JPG que represente a tu organización.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Campos del formulario */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre de la organización" />
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
                      value={field.value || ""}
                      placeholder="Breve descripción de la organización"
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Dirección física"
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
                        value={field.value || ""}
                        placeholder="Número de contacto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Email de contacto"
                        type="email"
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
                        value={field.value || ""}
                        placeholder="URL del sitio web"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificación Fiscal</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="RIF, NIT, RFC u otro identificador fiscal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateOrganizationMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateOrganizationMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* Tab de Configuración PDF */}
      <TabsContent value="pdf">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Posición del Logo</h3>
              <RadioGroup 
                defaultValue={pdfSettings.pdfConfig?.logoPosition || "left"}
                className="flex gap-4"
                onValueChange={(value) => handleLogoPositionChange(value as "left" | "center" | "right")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="logo-left" />
                  <Label htmlFor="logo-left" className="flex items-center gap-1">
                    <LucideAlignLeft className="h-4 w-4" /> Izquierda
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="center" id="logo-center" />
                  <Label htmlFor="logo-center" className="flex items-center gap-1">
                    <LucideAlignCenter className="h-4 w-4" /> Centro
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="logo-right" />
                  <Label htmlFor="logo-right" className="flex items-center gap-1">
                    <LucideAlignRight className="h-4 w-4" /> Derecha
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Información a mostrar</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-address" 
                    checked={pdfSettings.pdfConfig?.showAddress || false}
                    onCheckedChange={(checked) => handleToggleOption('showAddress', checked)}
                  />
                  <Label htmlFor="show-address">Mostrar dirección</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-phone" 
                    checked={pdfSettings.pdfConfig?.showPhone || false}
                    onCheckedChange={(checked) => handleToggleOption('showPhone', checked)}
                  />
                  <Label htmlFor="show-phone">Mostrar teléfono</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-email" 
                    checked={pdfSettings.pdfConfig?.showEmail || false}
                    onCheckedChange={(checked) => handleToggleOption('showEmail', checked)}
                  />
                  <Label htmlFor="show-email">Mostrar email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-website" 
                    checked={pdfSettings.pdfConfig?.showWebsite || false}
                    onCheckedChange={(checked) => handleToggleOption('showWebsite', checked)}
                  />
                  <Label htmlFor="show-website">Mostrar sitio web</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-tax-id" 
                    checked={pdfSettings.pdfConfig?.showTaxId || false}
                    onCheckedChange={(checked) => handleToggleOption('showTaxId', checked)}
                  />
                  <Label htmlFor="show-tax-id">Mostrar identificación fiscal</Label>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Colores</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="primary-color" className="mb-2">Color principal</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: pdfSettings.pdfConfig?.primaryColor || "#92c900" }}
                    />
                    <Input
                      id="primary-color"
                      type="text"
                      value={pdfSettings.pdfConfig?.primaryColor || "#92c900"}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      placeholder="#92c900"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="secondary-color" className="mb-2">Color secundario</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: pdfSettings.pdfConfig?.secondaryColor || "#f0f0f0" }}
                    />
                    <Input
                      id="secondary-color"
                      type="text"
                      value={pdfSettings.pdfConfig?.secondaryColor || "#f0f0f0"}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      placeholder="#f0f0f0"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={savePdfConfig}
                disabled={updatePdfConfigMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updatePdfConfigMutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </div>
          
          {/* Vista previa del PDF */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-3">Vista Previa</h3>
            <div className="bg-background border rounded-md overflow-hidden">
              <BudgetPdfPreview
                organization={previewOrganization as any}
                project={sampleProject}
                budget={sampleBudget}
                budgetTasks={sampleBudgetTasks}
                previewOnly={true}
                onPreviewGenerated={setPdfPreview}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}