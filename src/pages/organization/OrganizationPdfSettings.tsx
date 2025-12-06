import { useEffect, useState } from 'react';
import { DashboardLayout as Layout } from "@/layouts";
import { FileText, Save, RotateCcw } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePdfTemplate, useUpdatePdfTemplate, DEFAULT_PDF_TEMPLATE } from '@/features/pdf';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs } from '@/components/ui-custom/Tabs';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import type { PdfTemplate } from '@shared/schema';

export default function OrganizationPdfSettings() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  
  const organizationId = userData?.organization?.id;
  
  const { data: template, isLoading } = usePdfTemplate(organizationId);
  const updateTemplate = useUpdatePdfTemplate();
  
  // Local state for form
  const [formData, setFormData] = useState<Partial<PdfTemplate>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  // Initialize form data when template loads
  useEffect(() => {
    if (template) {
      setFormData(template);
    } else if (!isLoading) {
      // Use defaults if no template exists
      setFormData(DEFAULT_PDF_TEMPLATE as Partial<PdfTemplate>);
    }
  }, [template, isLoading]);

  const handleChange = (field: keyof PdfTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!organizationId) return;
    
    try {
      await updateTemplate.mutateAsync({
        organizationId,
        data: formData,
      });
      setHasChanges(false);
      toast({
        title: "Configuración guardada",
        description: "Los cambios en la plantilla PDF se han guardado correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (template) {
      setFormData(template);
    } else {
      setFormData(DEFAULT_PDF_TEMPLATE as Partial<PdfTemplate>);
    }
    setHasChanges(false);
  };

  const tabs = [
    { value: 'general', label: 'General' },
    { value: 'header', label: 'Encabezado' },
    { value: 'typography', label: 'Tipografía' },
    { value: 'layout', label: 'Página' },
    { value: 'sections', label: 'Secciones' },
    { value: 'footer', label: 'Pie de Página' },
    { value: 'signature', label: 'Firmas' },
  ];

  const headerProps = {
    icon: FileText,
    title: "Documentos PDF",
    description: "Personaliza el diseño y contenido de los documentos PDF que genera tu organización.",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    actions: hasChanges ? [
      <Button
        key="reset"
        variant="outline"
        onClick={handleReset}
        className="h-8 px-3 text-xs"
        data-testid="button-reset-pdf-settings"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Descartar
      </Button>,
      <Button
        key="save"
        onClick={handleSave}
        disabled={updateTemplate.isPending}
        className="h-8 px-3 text-xs"
        data-testid="button-save-pdf-settings"
      >
        <Save className="w-4 h-4 mr-1" />
        {updateTemplate.isPending ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    ] : undefined
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-6">
        <Tabs 
          tabs={tabs}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Nombre de la plantilla y colores principales de tus documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Plantilla</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Plantilla por defecto"
                  data-testid="input-template-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color || '#4f9eff'}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={formData.primary_color || '#4f9eff'}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      placeholder="#4f9eff"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color || '#e5e7eb'}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                      data-testid="input-secondary-color"
                    />
                    <Input
                      value={formData.secondary_color || '#e5e7eb'}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      placeholder="#e5e7eb"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text_color">Color de Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={formData.text_color || '#1f2937'}
                      onChange={(e) => handleChange('text_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                      data-testid="input-text-color"
                    />
                    <Input
                      value={formData.text_color || '#1f2937'}
                      onChange={(e) => handleChange('text_color', e.target.value)}
                      placeholder="#1f2937"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="background_color">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color || '#ffffff'}
                      onChange={(e) => handleChange('background_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                      data-testid="input-background-color"
                    />
                    <Input
                      value={formData.background_color || '#ffffff'}
                      onChange={(e) => handleChange('background_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'header' && (
          <Card>
            <CardHeader>
              <CardTitle>Encabezado del Documento</CardTitle>
              <CardDescription>
                Configura el logo y la información de tu empresa que aparece en el encabezado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Nombre de Empresa</Label>
                  <p className="text-sm text-muted-foreground">
                    Muestra el nombre de tu organización en el encabezado
                  </p>
                </div>
                <Switch
                  checked={formData.company_name_show ?? true}
                  onCheckedChange={(checked) => handleChange('company_name_show', checked)}
                  data-testid="switch-company-name-show"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name_size">Tamaño del Nombre</Label>
                  <Input
                    id="company_name_size"
                    type="number"
                    value={formData.company_name_size || 24}
                    onChange={(e) => handleChange('company_name_size', parseInt(e.target.value))}
                    min={12}
                    max={48}
                    data-testid="input-company-name-size"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_name_color">Color del Nombre</Label>
                  <div className="flex gap-2">
                    <Input
                      id="company_name_color"
                      type="color"
                      value={formData.company_name_color || '#1f2937'}
                      onChange={(e) => handleChange('company_name_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.company_name_color || '#1f2937'}
                      onChange={(e) => handleChange('company_name_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_width">Ancho del Logo (px)</Label>
                  <Input
                    id="logo_width"
                    type="number"
                    value={formData.logo_width || 80}
                    onChange={(e) => handleChange('logo_width', parseInt(e.target.value))}
                    min={20}
                    max={200}
                    data-testid="input-logo-width"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo_height">Alto del Logo (px)</Label>
                  <Input
                    id="logo_height"
                    type="number"
                    value={formData.logo_height || 60}
                    onChange={(e) => handleChange('logo_height', parseInt(e.target.value))}
                    min={20}
                    max={200}
                    data-testid="input-logo-height"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Dirección</Label>
                <Input
                  id="company_address"
                  value={formData.company_address || ''}
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  placeholder="Av. Principal 123, Ciudad"
                  data-testid="input-company-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_email">Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email || ''}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    placeholder="contacto@empresa.com"
                    data-testid="input-company-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Teléfono</Label>
                  <Input
                    id="company_phone"
                    value={formData.company_phone || ''}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    placeholder="+54 11 1234-5678"
                    data-testid="input-company-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_info_size">Tamaño de Info de Empresa</Label>
                <Input
                  id="company_info_size"
                  type="number"
                  value={formData.company_info_size || 10}
                  onChange={(e) => handleChange('company_info_size', parseInt(e.target.value))}
                  min={8}
                  max={16}
                  data-testid="input-company-info-size"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'typography' && (
          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
              <CardDescription>
                Configura las fuentes y tamaños de texto de tus documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="font_family">Familia de Fuente</Label>
                <Select
                  value={formData.font_family || 'Arial'}
                  onValueChange={(value) => handleChange('font_family', value)}
                >
                  <SelectTrigger data-testid="select-font-family">
                    <SelectValue placeholder="Seleccionar fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times-Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title_size">Tamaño de Título</Label>
                  <Input
                    id="title_size"
                    type="number"
                    value={formData.title_size || 18}
                    onChange={(e) => handleChange('title_size', parseInt(e.target.value))}
                    min={12}
                    max={36}
                    data-testid="input-title-size"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subtitle_size">Tamaño de Subtítulo</Label>
                  <Input
                    id="subtitle_size"
                    type="number"
                    value={formData.subtitle_size || 14}
                    onChange={(e) => handleChange('subtitle_size', parseInt(e.target.value))}
                    min={10}
                    max={24}
                    data-testid="input-subtitle-size"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="body_size">Tamaño de Cuerpo</Label>
                  <Input
                    id="body_size"
                    type="number"
                    value={formData.body_size || 12}
                    onChange={(e) => handleChange('body_size', parseInt(e.target.value))}
                    min={8}
                    max={18}
                    data-testid="input-body-size"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'layout' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Página</CardTitle>
              <CardDescription>
                Tamaño de página, orientación y márgenes del documento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page_size">Tamaño de Página</Label>
                  <Select
                    value={formData.page_size || 'A4'}
                    onValueChange={(value) => handleChange('page_size', value)}
                  >
                    <SelectTrigger data-testid="select-page-size">
                      <SelectValue placeholder="Seleccionar tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="LETTER">Carta (Letter)</SelectItem>
                      <SelectItem value="LEGAL">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="page_orientation">Orientación</Label>
                  <Select
                    value={formData.page_orientation || 'portrait'}
                    onValueChange={(value) => handleChange('page_orientation', value)}
                  >
                    <SelectTrigger data-testid="select-page-orientation">
                      <SelectValue placeholder="Seleccionar orientación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Vertical (Portrait)</SelectItem>
                      <SelectItem value="landscape">Horizontal (Landscape)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Márgenes (mm)</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Superior</Label>
                    <Input
                      type="number"
                      value={formData.margin_top || 20}
                      onChange={(e) => handleChange('margin_top', parseInt(e.target.value))}
                      min={5}
                      max={50}
                      data-testid="input-margin-top"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Inferior</Label>
                    <Input
                      type="number"
                      value={formData.margin_bottom || 20}
                      onChange={(e) => handleChange('margin_bottom', parseInt(e.target.value))}
                      min={5}
                      max={50}
                      data-testid="input-margin-bottom"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Izquierdo</Label>
                    <Input
                      type="number"
                      value={formData.margin_left || 20}
                      onChange={(e) => handleChange('margin_left', parseInt(e.target.value))}
                      min={5}
                      max={50}
                      data-testid="input-margin-left"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Derecho</Label>
                    <Input
                      type="number"
                      value={formData.margin_right || 20}
                      onChange={(e) => handleChange('margin_right', parseInt(e.target.value))}
                      min={5}
                      max={50}
                      data-testid="input-margin-right"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'sections' && (
          <Card>
            <CardHeader>
              <CardTitle>Secciones del Documento</CardTitle>
              <CardDescription>
                Activa o desactiva las secciones que aparecen en tus documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sección de Cliente</Label>
                  <p className="text-sm text-muted-foreground">
                    Muestra la información del cliente en el documento
                  </p>
                </div>
                <Switch
                  checked={formData.show_client_section ?? true}
                  onCheckedChange={(checked) => handleChange('show_client_section', checked)}
                  data-testid="switch-show-client-section"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sección de Proyecto</Label>
                  <p className="text-sm text-muted-foreground">
                    Muestra la información del proyecto
                  </p>
                </div>
                <Switch
                  checked={formData.show_project_section ?? true}
                  onCheckedChange={(checked) => handleChange('show_project_section', checked)}
                  data-testid="switch-show-project-section"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sección de Detalles</Label>
                  <p className="text-sm text-muted-foreground">
                    Muestra los detalles adicionales del documento
                  </p>
                </div>
                <Switch
                  checked={formData.show_details_section ?? true}
                  onCheckedChange={(checked) => handleChange('show_details_section', checked)}
                  data-testid="switch-show-details-section"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sección de Firmas</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluye espacio para firmas al final del documento
                  </p>
                </div>
                <Switch
                  checked={formData.show_signature_section ?? true}
                  onCheckedChange={(checked) => handleChange('show_signature_section', checked)}
                  data-testid="switch-show-signature-section"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'footer' && (
          <Card>
            <CardHeader>
              <CardTitle>Pie de Página</CardTitle>
              <CardDescription>
                Configura el contenido del pie de página de tus documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="footer_text">Texto del Pie de Página</Label>
                <Textarea
                  id="footer_text"
                  value={formData.footer_text || ''}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  placeholder="Texto personalizado para el pie de página..."
                  rows={3}
                  data-testid="textarea-footer-text"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Información Adicional</Label>
                  <p className="text-sm text-muted-foreground">
                    "{formData.footer_info || 'Documento generado por Seencel. www.seencel.com'}"
                  </p>
                </div>
                <Switch
                  checked={formData.show_footer_info ?? true}
                  onCheckedChange={(checked) => handleChange('show_footer_info', checked)}
                  data-testid="switch-show-footer-info"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Número de Página</Label>
                  <p className="text-sm text-muted-foreground">
                    Agrega numeración automática de páginas
                  </p>
                </div>
                <Switch
                  checked={formData.footer_show_page_numbers ?? true}
                  onCheckedChange={(checked) => handleChange('footer_show_page_numbers', checked)}
                  data-testid="switch-footer-show-page-numbers"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Fecha</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluye la fecha de generación del documento
                  </p>
                </div>
                <Switch
                  checked={formData.footer_show_date ?? true}
                  onCheckedChange={(checked) => handleChange('footer_show_date', checked)}
                  data-testid="switch-footer-show-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_info">Información Adicional Personalizada</Label>
                <Input
                  id="footer_info"
                  value={formData.footer_info || ''}
                  onChange={(e) => handleChange('footer_info', e.target.value)}
                  placeholder="Documento generado por Seencel. www.seencel.com"
                  data-testid="input-footer-info"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'signature' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Firmas</CardTitle>
              <CardDescription>
                Personaliza el área de firmas de tus documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar Campos de Firma</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluye líneas para firma en el documento
                  </p>
                </div>
                <Switch
                  checked={formData.show_signature_fields ?? true}
                  onCheckedChange={(checked) => handleChange('show_signature_fields', checked)}
                  data-testid="switch-show-signature-fields"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature_layout">Disposición de Firmas</Label>
                <Select
                  value={formData.signature_layout || 'vertical'}
                  onValueChange={(value) => handleChange('signature_layout', value)}
                >
                  <SelectTrigger data-testid="select-signature-layout">
                    <SelectValue placeholder="Seleccionar disposición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical (una debajo de otra)</SelectItem>
                    <SelectItem value="horizontal">Horizontal (lado a lado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature_text">Texto de Firma</Label>
                <Input
                  id="signature_text"
                  value={formData.signature_text || ''}
                  onChange={(e) => handleChange('signature_text', e.target.value)}
                  placeholder="Firma y aclaración"
                  data-testid="input-signature-text"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Campo de Aclaración</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluye línea para aclaración de firma
                  </p>
                </div>
                <Switch
                  checked={formData.show_clarification_field ?? true}
                  onCheckedChange={(checked) => handleChange('show_clarification_field', checked)}
                  data-testid="switch-show-clarification-field"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Campo de Fecha</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluye línea para fecha junto a la firma
                  </p>
                </div>
                <Switch
                  checked={formData.show_date_field ?? true}
                  onCheckedChange={(checked) => handleChange('show_date_field', checked)}
                  data-testid="switch-show-date-field"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
