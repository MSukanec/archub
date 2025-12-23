import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePdfTemplate, useUpdatePdfTemplate, DEFAULT_PDF_TEMPLATE } from '@/features/pdf';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import type { PdfTemplate } from '@shared/schema';

function ColorInput({ 
  label, 
  value, 
  onChange, 
  testId 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  testId: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 p-0.5 cursor-pointer"
          data-testid={testId}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 text-xs"
        />
      </div>
    </div>
  );
}

function NumberInput({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  testId,
  suffix
}: { 
  label: string; 
  value: number; 
  onChange: (value: number) => void; 
  min?: number; 
  max?: number; 
  testId: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min={min}
          max={max}
          className="h-8 text-xs"
          data-testid={testId}
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function SwitchRow({ 
  label, 
  description, 
  checked, 
  onChange, 
  testId 
}: { 
  label: string; 
  description?: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        data-testid={testId}
      />
    </div>
  );
}

function HeaderPreview({ formData }: { formData: Partial<PdfTemplate> }) {
  return (
    <div 
      className="border rounded-lg p-4 bg-white"
      style={{ 
        fontFamily: formData.font_family || 'Arial',
        backgroundColor: formData.background_color || '#ffffff',
        color: formData.text_color || '#1f2937'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500"
            style={{ 
              width: formData.logo_width || 80, 
              height: formData.logo_height || 60 
            }}
          >
            LOGO
          </div>
          <div>
            {formData.company_name_show !== false && (
              <div 
                className="font-bold"
                style={{ 
                  fontSize: formData.company_name_size || 24,
                  color: formData.company_name_color || '#1f2937'
                }}
              >
                Mi Empresa S.A.
              </div>
            )}
            <div 
              className="text-muted-foreground"
              style={{ fontSize: formData.company_info_size || 10 }}
            >
              {formData.company_address || 'Av. Principal 123, Ciudad'}
              <br />
              {formData.company_email || 'contacto@empresa.com'} | {formData.company_phone || '+54 11 1234-5678'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div 
            className="font-bold"
            style={{ 
              fontSize: formData.title_size || 18,
              color: formData.primary_color || '#4f9eff'
            }}
          >
            RECIBO DE PAGO
          </div>
          <div style={{ fontSize: formData.body_size || 12 }}>
            N° 0001-00000123
          </div>
          <div 
            className="text-muted-foreground"
            style={{ fontSize: formData.body_size || 12 }}
          >
            Fecha: 06/12/2025
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientSectionPreview({ formData }: { formData: Partial<PdfTemplate> }) {
  if (formData.show_client_section === false) return null;
  
  return (
    <div 
      className="border rounded-lg p-4 bg-white"
      style={{ 
        fontFamily: formData.font_family || 'Arial',
        backgroundColor: formData.background_color || '#ffffff',
        color: formData.text_color || '#1f2937'
      }}
    >
      <div 
        className="font-semibold mb-2 pb-2 border-b"
        style={{ 
          fontSize: formData.subtitle_size || 14,
          borderColor: formData.secondary_color || '#e5e7eb'
        }}
      >
        DATOS DEL CLIENTE
      </div>
      <div className="grid grid-cols-2 gap-2" style={{ fontSize: formData.body_size || 12 }}>
        <div><span className="text-muted-foreground">Cliente:</span> Juan Pérez</div>
        <div><span className="text-muted-foreground">CUIT:</span> 20-12345678-9</div>
        <div><span className="text-muted-foreground">Dirección:</span> Calle 123</div>
        <div><span className="text-muted-foreground">Tel:</span> +54 11 5555-5555</div>
      </div>
    </div>
  );
}

function ProjectSectionPreview({ formData }: { formData: Partial<PdfTemplate> }) {
  if (formData.show_project_section === false) return null;
  
  return (
    <div 
      className="border rounded-lg p-4 bg-white"
      style={{ 
        fontFamily: formData.font_family || 'Arial',
        backgroundColor: formData.background_color || '#ffffff',
        color: formData.text_color || '#1f2937'
      }}
    >
      <div 
        className="font-semibold mb-2 pb-2 border-b"
        style={{ 
          fontSize: formData.subtitle_size || 14,
          borderColor: formData.secondary_color || '#e5e7eb'
        }}
      >
        DATOS DEL PROYECTO
      </div>
      <div className="grid grid-cols-2 gap-2" style={{ fontSize: formData.body_size || 12 }}>
        <div><span className="text-muted-foreground">Proyecto:</span> Casa Familia García</div>
        <div><span className="text-muted-foreground">Ubicación:</span> Barrio Norte</div>
      </div>
    </div>
  );
}

function DetailsSectionPreview({ formData }: { formData: Partial<PdfTemplate> }) {
  if (formData.show_details_section === false) return null;
  
  return (
    <div 
      className="border rounded-lg p-4 bg-white"
      style={{ 
        fontFamily: formData.font_family || 'Arial',
        backgroundColor: formData.background_color || '#ffffff',
        color: formData.text_color || '#1f2937'
      }}
    >
      <div 
        className="font-semibold mb-2 pb-2 border-b"
        style={{ 
          fontSize: formData.subtitle_size || 14,
          borderColor: formData.secondary_color || '#e5e7eb'
        }}
      >
        DETALLE
      </div>
      <table className="w-full" style={{ fontSize: formData.body_size || 12 }}>
        <thead>
          <tr 
            className="text-left"
            style={{ backgroundColor: formData.secondary_color || '#e5e7eb' }}
          >
            <th className="p-2">Concepto</th>
            <th className="p-2 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2">Anticipo de obra</td>
            <td className="p-2 text-right">$150.000,00</td>
          </tr>
          <tr>
            <td className="p-2 font-bold">TOTAL</td>
            <td 
              className="p-2 text-right font-bold"
              style={{ color: formData.primary_color || '#4f9eff' }}
            >
              $150.000,00
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FooterPreview({ formData }: { formData: Partial<PdfTemplate> }) {
  return (
    <div 
      className="border rounded-lg p-3 bg-white"
      style={{ 
        fontFamily: formData.font_family || 'Arial',
        backgroundColor: formData.background_color || '#ffffff',
        color: formData.text_color || '#1f2937',
        fontSize: formData.body_size ? formData.body_size - 2 : 10
      }}
    >
      <div className="flex justify-between items-center text-muted-foreground">
        <div>
          {formData.footer_text && <div>{formData.footer_text}</div>}
          {formData.show_footer_info !== false && (
            <div className="text-xs">
              {formData.footer_info || 'Documento generado por Seencel. www.seencel.com'}
            </div>
          )}
        </div>
        <div className="text-right">
          {formData.footer_show_date !== false && <span>06/12/2025</span>}
          {formData.footer_show_page_numbers !== false && <span className="ml-4">Página 1 de 1</span>}
        </div>
      </div>
    </div>
  );
}

function SignaturePreview({ formData }: { formData: Partial<PdfTemplate> }) {
  if (formData.show_signature_section === false || formData.show_signature_fields === false) return null;
  
  const isHorizontal = formData.signature_layout === 'horizontal';
  
  return (
    <div 
      className="border rounded-lg p-4 bg-white"
      style={{ 
        fontFamily: formData.font_family || 'Arial',
        backgroundColor: formData.background_color || '#ffffff',
        color: formData.text_color || '#1f2937',
        fontSize: formData.body_size || 12
      }}
    >
      <div className={isHorizontal ? 'flex gap-8 justify-around' : 'space-y-6'}>
        {['Emisor', 'Receptor'].map((role) => (
          <div key={role} className="text-center">
            <div className="border-b border-gray-400 w-48 mx-auto mb-1" />
            <div className="text-sm">{formData.signature_text || 'Firma'}</div>
            {formData.show_clarification_field !== false && (
              <>
                <div className="border-b border-gray-400 w-32 mx-auto mt-3 mb-1" />
                <div className="text-xs text-muted-foreground">Aclaración</div>
              </>
            )}
            {formData.show_date_field !== false && (
              <>
                <div className="border-b border-gray-400 w-24 mx-auto mt-3 mb-1" />
                <div className="text-xs text-muted-foreground">Fecha</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface OrganizationSettingsPdfViewProps {
  onHasChanges?: (hasChanges: boolean, actions?: React.ReactNode[]) => void;
}

export function OrganizationSettingsPdfView({ onHasChanges }: OrganizationSettingsPdfViewProps) {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  
  const organizationId = userData?.organization?.id;
  
  const { data: template, isLoading } = usePdfTemplate(organizationId);
  const updateTemplate = useUpdatePdfTemplate();
  
  const [formData, setFormData] = useState<Partial<PdfTemplate>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else if (!isLoading) {
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

  useEffect(() => {
    if (onHasChanges) {
      if (hasChanges) {
        const actions = [
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
            {updateTemplate.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        ];
        onHasChanges(true, actions);
      } else {
        onHasChanges(false);
      }
    }
  }, [hasChanges, updateTemplate.isPending]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* GENERAL, TIPOGRAFÍA Y PÁGINA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuración General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Nombre de la Plantilla</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Plantilla por defecto"
                className="h-8 text-sm"
                data-testid="input-template-name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Color Primario"
                value={formData.primary_color || '#4f9eff'}
                onChange={(v) => handleChange('primary_color', v)}
                testId="input-primary-color"
              />
              <ColorInput
                label="Color Secundario"
                value={formData.secondary_color || '#e5e7eb'}
                onChange={(v) => handleChange('secondary_color', v)}
                testId="input-secondary-color"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Color de Texto"
                value={formData.text_color || '#1f2937'}
                onChange={(v) => handleChange('text_color', v)}
                testId="input-text-color"
              />
              <ColorInput
                label="Color de Fondo"
                value={formData.background_color || '#ffffff'}
                onChange={(v) => handleChange('background_color', v)}
                testId="input-background-color"
              />
            </div>

            <div className="pt-2 border-t">
              <Label className="text-xs font-medium">Tipografía</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fuente</Label>
                  <Select
                    value={formData.font_family || 'Arial'}
                    onValueChange={(v) => handleChange('font_family', v)}
                  >
                    <SelectTrigger className="h-8 text-xs" data-testid="select-font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times-Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumberInput
                  label="Título"
                  value={formData.title_size || 18}
                  onChange={(v) => handleChange('title_size', v)}
                  min={12}
                  max={36}
                  testId="input-title-size"
                  suffix="pt"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <NumberInput
                  label="Subtítulo"
                  value={formData.subtitle_size || 14}
                  onChange={(v) => handleChange('subtitle_size', v)}
                  min={10}
                  max={24}
                  testId="input-subtitle-size"
                  suffix="pt"
                />
                <NumberInput
                  label="Cuerpo"
                  value={formData.body_size || 12}
                  onChange={(v) => handleChange('body_size', v)}
                  min={8}
                  max={18}
                  testId="input-body-size"
                  suffix="pt"
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <Label className="text-xs font-medium">Página</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tamaño</Label>
                  <Select
                    value={formData.page_size || 'A4'}
                    onValueChange={(v) => handleChange('page_size', v)}
                  >
                    <SelectTrigger className="h-8 text-xs" data-testid="select-page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="LETTER">Carta</SelectItem>
                      <SelectItem value="LEGAL">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Orientación</Label>
                  <Select
                    value={formData.page_orientation || 'portrait'}
                    onValueChange={(v) => handleChange('page_orientation', v)}
                  >
                    <SelectTrigger className="h-8 text-xs" data-testid="select-orientation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Vertical</SelectItem>
                      <SelectItem value="landscape">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <NumberInput label="↑" value={formData.margin_top || 20} onChange={(v) => handleChange('margin_top', v)} min={5} max={50} testId="input-margin-top" suffix="mm" />
                <NumberInput label="↓" value={formData.margin_bottom || 20} onChange={(v) => handleChange('margin_bottom', v)} min={5} max={50} testId="input-margin-bottom" suffix="mm" />
                <NumberInput label="←" value={formData.margin_left || 20} onChange={(v) => handleChange('margin_left', v)} min={5} max={50} testId="input-margin-left" suffix="mm" />
                <NumberInput label="→" value={formData.margin_right || 20} onChange={(v) => handleChange('margin_right', v)} min={5} max={50} testId="input-margin-right" suffix="mm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Vista previa general</div>
          <div 
            className="border rounded-lg p-6 min-h-[400px]"
            style={{ 
              backgroundColor: formData.background_color || '#ffffff',
              fontFamily: formData.font_family || 'Arial'
            }}
          >
            <div className="text-center text-muted-foreground text-xs mb-4">
              {formData.page_size || 'A4'} - {formData.page_orientation === 'landscape' ? 'Horizontal' : 'Vertical'}
            </div>
            <div className="space-y-3 transform scale-90 origin-top">
              <HeaderPreview formData={formData} />
              <ClientSectionPreview formData={formData} />
              <ProjectSectionPreview formData={formData} />
              <DetailsSectionPreview formData={formData} />
              <SignaturePreview formData={formData} />
              <FooterPreview formData={formData} />
            </div>
          </div>
        </div>
      </div>

      {/* ENCABEZADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Encabezado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow
              label="Mostrar nombre de empresa"
              checked={formData.company_name_show ?? true}
              onChange={(v) => handleChange('company_name_show', v)}
              testId="switch-company-name-show"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Tamaño nombre"
                value={formData.company_name_size || 24}
                onChange={(v) => handleChange('company_name_size', v)}
                min={12}
                max={48}
                testId="input-company-name-size"
                suffix="pt"
              />
              <ColorInput
                label="Color nombre"
                value={formData.company_name_color || '#1f2937'}
                onChange={(v) => handleChange('company_name_color', v)}
                testId="input-company-name-color"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Ancho logo"
                value={formData.logo_width || 80}
                onChange={(v) => handleChange('logo_width', v)}
                min={20}
                max={200}
                testId="input-logo-width"
                suffix="px"
              />
              <NumberInput
                label="Alto logo"
                value={formData.logo_height || 60}
                onChange={(v) => handleChange('logo_height', v)}
                min={20}
                max={200}
                testId="input-logo-height"
                suffix="px"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Dirección</Label>
              <Input
                value={formData.company_address || ''}
                onChange={(e) => handleChange('company_address', e.target.value)}
                placeholder="Av. Principal 123, Ciudad"
                className="h-8 text-sm"
                data-testid="input-company-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={formData.company_email || ''}
                  onChange={(e) => handleChange('company_email', e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="h-8 text-sm"
                  data-testid="input-company-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={formData.company_phone || ''}
                  onChange={(e) => handleChange('company_phone', e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="h-8 text-sm"
                  data-testid="input-company-phone"
                />
              </div>
            </div>

            <NumberInput
              label="Tamaño info empresa"
              value={formData.company_info_size || 10}
              onChange={(v) => handleChange('company_info_size', v)}
              min={8}
              max={16}
              testId="input-company-info-size"
              suffix="pt"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Vista previa del encabezado</div>
          <HeaderPreview formData={formData} />
        </div>
      </div>

      {/* SECCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Secciones del Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <SwitchRow
              label="Sección de Cliente"
              description="Información del cliente"
              checked={formData.show_client_section ?? true}
              onChange={(v) => handleChange('show_client_section', v)}
              testId="switch-show-client-section"
            />
            <SwitchRow
              label="Sección de Proyecto"
              description="Información del proyecto"
              checked={formData.show_project_section ?? true}
              onChange={(v) => handleChange('show_project_section', v)}
              testId="switch-show-project-section"
            />
            <SwitchRow
              label="Sección de Detalles"
              description="Tabla de conceptos y montos"
              checked={formData.show_details_section ?? true}
              onChange={(v) => handleChange('show_details_section', v)}
              testId="switch-show-details-section"
            />
            <SwitchRow
              label="Sección de Firmas"
              description="Espacio para firmas"
              checked={formData.show_signature_section ?? true}
              onChange={(v) => handleChange('show_signature_section', v)}
              testId="switch-show-signature-section"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Vista previa de secciones</div>
          <div className="space-y-3">
            <ClientSectionPreview formData={formData} />
            <ProjectSectionPreview formData={formData} />
            <DetailsSectionPreview formData={formData} />
          </div>
        </div>
      </div>

      {/* PIE DE PÁGINA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pie de Página</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Texto personalizado</Label>
              <Textarea
                value={formData.footer_text || ''}
                onChange={(e) => handleChange('footer_text', e.target.value)}
                placeholder="Texto para el pie de página..."
                rows={2}
                className="text-sm"
                data-testid="textarea-footer-text"
              />
            </div>

            <SwitchRow
              label="Mostrar info adicional"
              checked={formData.show_footer_info ?? true}
              onChange={(v) => handleChange('show_footer_info', v)}
              testId="switch-show-footer-info"
            />

            {formData.show_footer_info !== false && (
              <div className="space-y-2">
                <Label className="text-xs">Info adicional</Label>
                <Input
                  value={formData.footer_info || ''}
                  onChange={(e) => handleChange('footer_info', e.target.value)}
                  placeholder="Documento generado por Seencel. www.seencel.com"
                  className="h-8 text-sm"
                  data-testid="input-footer-info"
                />
              </div>
            )}

            <div className="flex gap-4">
              <SwitchRow
                label="Mostrar fecha"
                checked={formData.footer_show_date ?? true}
                onChange={(v) => handleChange('footer_show_date', v)}
                testId="switch-footer-show-date"
              />
              <SwitchRow
                label="Mostrar N° página"
                checked={formData.footer_show_page_numbers ?? true}
                onChange={(v) => handleChange('footer_show_page_numbers', v)}
                testId="switch-footer-show-page-numbers"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Vista previa del pie de página</div>
          <FooterPreview formData={formData} />
        </div>
      </div>

      {/* FIRMAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuración de Firmas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow
              label="Mostrar campos de firma"
              checked={formData.show_signature_fields ?? true}
              onChange={(v) => handleChange('show_signature_fields', v)}
              testId="switch-show-signature-fields"
            />

            {formData.show_signature_fields !== false && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Disposición</Label>
                  <Select
                    value={formData.signature_layout || 'vertical'}
                    onValueChange={(v) => handleChange('signature_layout', v)}
                  >
                    <SelectTrigger className="h-8 text-xs" data-testid="select-signature-layout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Texto de firma</Label>
                  <Input
                    value={formData.signature_text || ''}
                    onChange={(e) => handleChange('signature_text', e.target.value)}
                    placeholder="Firma"
                    className="h-8 text-sm"
                    data-testid="input-signature-text"
                  />
                </div>

                <SwitchRow
                  label="Campo de aclaración"
                  checked={formData.show_clarification_field ?? true}
                  onChange={(v) => handleChange('show_clarification_field', v)}
                  testId="switch-show-clarification-field"
                />
                <SwitchRow
                  label="Campo de fecha"
                  checked={formData.show_date_field ?? true}
                  onChange={(v) => handleChange('show_date_field', v)}
                  testId="switch-show-date-field"
                />
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Vista previa de firmas</div>
          <SignaturePreview formData={formData} />
        </div>
      </div>

    </div>
  );
}
