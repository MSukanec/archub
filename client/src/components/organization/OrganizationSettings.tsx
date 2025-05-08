import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, X, Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function OrganizationSettings() {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organizations/current"],
  });
  
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    pdfConfig: {
      logoPosition: "left",
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: true,
      showTaxId: true,
      primaryColor: "#92c900",
      secondaryColor: "#333333",
    }
  });
  
  // Inicializar el formulario con los datos de la organización
  useEffect(() => {
    if (organization) {
      setFormData({
        ...organization,
        pdfConfig: organization.pdfConfig || {
          logoPosition: "left",
          showAddress: true,
          showPhone: true,
          showEmail: true,
          showWebsite: true,
          showTaxId: true,
          primaryColor: "#92c900",
          secondaryColor: "#333333",
        }
      });
    }
  }, [organization]);
  
  // Efecto para actualizar el formulario cuando se carguen los datos
  useEffect(() => {
    if (organization && !editing) {
      setFormData({
        ...organization,
        pdfConfig: organization.pdfConfig || {
          logoPosition: "left",
          showAddress: true,
          showPhone: true,
          showEmail: true,
          showWebsite: true,
          showTaxId: true,
          primaryColor: "#92c900",
          secondaryColor: "#333333",
        }
      });
    }
  }, [organization, editing]);
  
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      const res = await apiRequest("PUT", `/api/organizations/${organization?.id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar la organización");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/current"] });
      toast({
        title: "Configuración actualizada",
        description: "Los datos de la organización se han actualizado correctamente",
      });
      setEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const res = await apiRequest("POST", `/api/organizations/${organization?.id}/logo`, formData, false);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al cargar el logo");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/current"] });
      setFormData(prev => ({ ...prev, logoUrl: data.logoUrl }));
      toast({
        title: "Logo actualizado",
        description: "El logo de la organización se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePdfConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pdfConfig: {
        ...prev.pdfConfig,
        [key]: value
      }
    }));
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración de la Organización</CardTitle>
          <CardDescription>Cargando datos de la organización...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuración de la Organización</CardTitle>
          <CardDescription>Gestione la información y apariencia de su organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sección de información general */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la organización</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Identificación fiscal (CUIT/RUT)</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Sección de contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  disabled={!editing || updateMutation.isPending}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Sección de logo */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Logo de la Organización</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo de la organización"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-2">
                    Sin logo
                  </span>
                )}
              </div>
              
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={!editing || uploadLogoMutation.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  disabled={!editing || uploadLogoMutation.isPending}
                >
                  {uploadLogoMutation.isPending ? (
                    <>Subiendo...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir logo
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Recomendado: PNG o SVG con fondo transparente, máximo 1MB.
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Configuración de PDF */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Configuración de Documentos PDF</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoPosition">Posición del logo</Label>
                  <Select
                    value={formData.pdfConfig?.logoPosition || "left"}
                    onValueChange={(value) => handlePdfConfigChange("logoPosition", value)}
                    disabled={!editing || updateMutation.isPending}
                  >
                    <SelectTrigger id="logoPosition">
                      <SelectValue placeholder="Seleccione una posición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Izquierda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Derecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.pdfConfig?.primaryColor || "#92c900"}
                      onChange={(e) => handlePdfConfigChange("primaryColor", e.target.value)}
                      disabled={!editing || updateMutation.isPending}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.pdfConfig?.primaryColor || "#92c900"}
                      onChange={(e) => handlePdfConfigChange("primaryColor", e.target.value)}
                      disabled={!editing || updateMutation.isPending}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="showAddress" className="flex-1">
                    Mostrar dirección
                  </Label>
                  <Switch
                    id="showAddress"
                    checked={formData.pdfConfig?.showAddress ?? true}
                    onCheckedChange={(checked) => handlePdfConfigChange("showAddress", checked)}
                    disabled={!editing || updateMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="showPhone" className="flex-1">
                    Mostrar teléfono
                  </Label>
                  <Switch
                    id="showPhone"
                    checked={formData.pdfConfig?.showPhone ?? true}
                    onCheckedChange={(checked) => handlePdfConfigChange("showPhone", checked)}
                    disabled={!editing || updateMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="showEmail" className="flex-1">
                    Mostrar email
                  </Label>
                  <Switch
                    id="showEmail"
                    checked={formData.pdfConfig?.showEmail ?? true}
                    onCheckedChange={(checked) => handlePdfConfigChange("showEmail", checked)}
                    disabled={!editing || updateMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="showWebsite" className="flex-1">
                    Mostrar sitio web
                  </Label>
                  <Switch
                    id="showWebsite"
                    checked={formData.pdfConfig?.showWebsite ?? true}
                    onCheckedChange={(checked) => handlePdfConfigChange("showWebsite", checked)}
                    disabled={!editing || updateMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="showTaxId" className="flex-1">
                    Mostrar identificación fiscal
                  </Label>
                  <Switch
                    id="showTaxId"
                    checked={formData.pdfConfig?.showTaxId ?? true}
                    onCheckedChange={(checked) => handlePdfConfigChange("showTaxId", checked)}
                    disabled={!editing || updateMutation.isPending}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  // Revertir cambios
                  if (organization) {
                    setFormData({
                      ...organization,
                      pdfConfig: organization.pdfConfig || {
                        logoPosition: "left",
                        showAddress: true,
                        showPhone: true,
                        showEmail: true,
                        showWebsite: true,
                        showTaxId: true,
                        primaryColor: "#92c900",
                        secondaryColor: "#333333",
                      }
                    });
                  }
                }}
                disabled={updateMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Check className="mr-2 h-4 w-4" />
              Editar Configuración
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}