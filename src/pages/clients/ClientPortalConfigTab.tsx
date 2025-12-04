import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Building2, Calendar, Receipt, BookOpen, Settings, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PortalSectionConfig {
  id: string;
  label: string;
  description: string;
  icon: typeof Building2;
  enabled: boolean;
}

interface ClientPortalConfigTabProps {
  projectId?: string;
}

export function ClientPortalConfigTab({ projectId }: ClientPortalConfigTabProps) {
  const [sections, setSections] = useState<PortalSectionConfig[]>([
    {
      id: 'dashboard',
      label: 'Visión General',
      description: 'Muestra el resumen del proyecto, estadísticas de pagos y próximas cuotas.',
      icon: Building2,
      enabled: true,
    },
    {
      id: 'installments',
      label: 'Cuotas',
      description: 'Muestra el cronograma de cuotas pendientes y próximos vencimientos.',
      icon: Calendar,
      enabled: true,
    },
    {
      id: 'payments',
      label: 'Mis Pagos',
      description: 'Muestra el historial completo de pagos realizados por el cliente.',
      icon: Receipt,
      enabled: true,
    },
    {
      id: 'logs',
      label: 'Avances',
      description: 'Muestra las entradas de la bitácora de obra visibles para clientes.',
      icon: BookOpen,
      enabled: true,
    },
  ]);

  const handleToggleSection = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un proyecto para configurar su portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configura qué secciones estarán visibles en el portal de clientes de este proyecto. 
          Los cambios se guardarán automáticamente.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Secciones del Portal</CardTitle>
          <CardDescription>
            Activa o desactiva las secciones que los clientes podrán ver en su portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div 
                key={section.id}
                className="flex items-start justify-between gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <Label 
                      htmlFor={`section-${section.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {section.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`section-${section.id}`}
                  checked={section.enabled}
                  onCheckedChange={() => handleToggleSection(section.id)}
                  data-testid={`switch-portal-section-${section.id}`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración Adicional</CardTitle>
          <CardDescription>
            Opciones adicionales para personalizar la experiencia del portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="show-amounts" className="text-sm font-medium cursor-pointer">
                Mostrar montos
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite que los clientes vean los montos en pesos y/o dólares.
              </p>
            </div>
            <Switch
              id="show-amounts"
              defaultChecked={true}
              data-testid="switch-portal-show-amounts"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="show-progress" className="text-sm font-medium cursor-pointer">
                Mostrar progreso del proyecto
              </Label>
              <p className="text-sm text-muted-foreground">
                Muestra una barra de progreso estimado del proyecto.
              </p>
            </div>
            <Switch
              id="show-progress"
              defaultChecked={true}
              data-testid="switch-portal-show-progress"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="allow-comments" className="text-sm font-medium cursor-pointer">
                Permitir comentarios
              </Label>
              <p className="text-sm text-muted-foreground">
                Los clientes podrán dejar comentarios en las entradas de avance.
              </p>
            </div>
            <Switch
              id="allow-comments"
              defaultChecked={false}
              data-testid="switch-portal-allow-comments"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
