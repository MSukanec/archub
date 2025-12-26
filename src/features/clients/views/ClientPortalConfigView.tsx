import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Building2, Calendar, Receipt, BookOpen, Settings, Info, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
interface PortalSettings {
  project_id: string;
  organization_id: string;
  show_dashboard: boolean;
  show_installments: boolean;
  show_payments: boolean;
  show_logs: boolean;
  show_amounts: boolean;
  show_progress: boolean;
  allow_comments: boolean;
}
interface PortalSectionConfig {
  id: keyof Pick<PortalSettings, 'show_dashboard'| 'show_installments'| 'show_payments'| 'show_logs'>;
  label: string;
  description: string;
  icon: typeof Building2;
}
const SECTION_CONFIGS: PortalSectionConfig[] = [
  {
    id: 'show_dashboard',
    label: 'Visión General',
    description: 'Muestra el resumen del proyecto, estadísticas de pagos y próximas cuotas.',
    icon: Building2,
  },
  {
    id: 'show_installments',
    label: 'Cuotas',
    description: 'Muestra el cronograma de cuotas pendientes y próximos vencimientos.',
    icon: Calendar,
  },
  {
    id: 'show_payments',
    label: 'Mis Pagos',
    description: 'Muestra el historial completo de pagos realizados por el cliente.',
    icon: Receipt,
  },
  {
    id: 'show_logs',
    label: 'Avances',
    description: 'Muestra las entradas de la bitácora de obra visibles para clientes.',
    icon: BookOpen,
  },
];
interface ClientPortalConfigViewProps {
  projectId?: string;
}
export function ClientPortalConfigView({ projectId }: ClientPortalConfigViewProps) {
  const { toast } = useToast();
  const queryKey = ['/api/client-portal', projectId, 'config'];
  const { data: settings, isLoading, error } = useQuery<PortalSettings>({
    queryKey,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/client-portal/${projectId}/config`);
      return response.json();
    },
    enabled: !!projectId,
  });
  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<PortalSettings>) => {
      if (!settings) return;
      const fullSettings = {
        show_dashboard: settings.show_dashboard,
        show_installments: settings.show_installments,
        show_payments: settings.show_payments,
        show_logs: settings.show_logs,
        show_amounts: settings.show_amounts,
        show_progress: settings.show_progress,
        allow_comments: settings.allow_comments,
        ...newSettings,
      };
      const response = await apiRequest('PUT', `/api/client-portal/${projectId}/config`, fullSettings);
      return response.json();
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSettings = queryClient.getQueryData<PortalSettings>(queryKey);
      
      if (previousSettings) {
        queryClient.setQueryData<PortalSettings>(queryKey, {
          ...previousSettings,
          ...newSettings,
        });
      }
      
      return { previousSettings };
    },
    onSuccess: () => {
      toast({
        title: 'Guardado',
        duration: 1500,
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKey, context.previousSettings);
      }
      toast({
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const handleToggle = (key: keyof PortalSettings, value: boolean) => {
    updateMutation.mutate({ [key]: value });
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  if (error || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Error al cargar la configuración del portal.</p>
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
          Los cambios se guardan automáticamente.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Secciones del Portal
            {updateMutation.isSuccess && !updateMutation.isPending && (
              <Check className="h-4 w-4 text-green-500" />
            )}
          </CardTitle>
          <CardDescription>
            Activa o desactiva las secciones que los clientes podrán ver en su portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SECTION_CONFIGS.map((section) => {
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
                  checked={settings[section.id]}
                  onCheckedChange={(checked) => handleToggle(section.id, checked)}
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
              checked={settings.show_amounts}
              onCheckedChange={(checked) => handleToggle('show_amounts', checked)}
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
              checked={settings.show_progress}
              onCheckedChange={(checked) => handleToggle('show_progress', checked)}
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
              checked={settings.allow_comments}
              onCheckedChange={(checked) => handleToggle('allow_comments', checked)}
              data-testid="switch-portal-allow-comments"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default ClientPortalConfigView;
