import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Edit, Trash2, Save } from 'lucide-react';

interface OrganizationSettingsViewProps {
  organization: any;
}

export function OrganizationSettingsView({ organization }: OrganizationSettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Configuración de la Organización</h2>
        <p className="text-muted-foreground">
          Gestiona la configuración y preferencias de tu organización
        </p>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization-name">Nombre de la organización</Label>
            <div className="flex gap-2">
              <Input 
                id="organization-name"
                defaultValue={organization.name}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Estado de la organización</Label>
              <p className="text-sm text-muted-foreground">
                Determina si la organización está activa
              </p>
            </div>
            <Switch 
              checked={organization.is_active}
              disabled={organization.is_system}
            />
          </div>

          {organization.is_system && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Esta es una organización del sistema y algunas configuraciones no se pueden modificar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan y límites */}
      <Card>
        <CardHeader>
          <CardTitle>Plan y Límites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Plan actual</Label>
            <div className="mt-2">
              <Badge 
                variant="secondary" 
                className="text-white" 
                style={{
                  backgroundColor: organization.plan?.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                                 organization.plan?.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                                 organization.plan?.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                                 'var(--plan-free-bg)'
                }}
              >
                {organization.plan?.name || 'Free'}
              </Badge>
            </div>
          </div>

          {organization.plan?.features && (
            <div>
              <Label>Límites del plan</Label>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Máximo de miembros:</span>
                  <span className="font-medium">
                    {organization.plan.features.max_members === 999 ? 'Ilimitado' : organization.plan.features.max_members}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Máximo de proyectos:</span>
                  <span className="font-medium">
                    {organization.plan.features.max_projects === 999 ? 'Ilimitado' : organization.plan.features.max_projects}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tableros Kanban:</span>
                  <span className="font-medium">
                    {organization.plan.features.max_kanban_boards === 999 ? 'Ilimitado' : organization.plan.features.max_kanban_boards}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button variant="outline">
            Gestionar Plan
          </Button>
        </CardContent>
      </Card>

      {/* Zona de peligro */}
      {!organization.is_system && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-red-600 mb-2">Eliminar Organización</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Una vez que elimines esta organización, no hay vuelta atrás. Por favor, ten cuidado.
              </p>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Organización
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}