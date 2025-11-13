import { useEffect } from 'react';
import { Activity, Building } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import ActivityLogs from '@/pages/activity/ActivityLogs';

export default function OrganizationActivity() {
  const { data: userData } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);

  const organizationId = userData?.preferences?.last_organization_id;

  const headerProps = {
    icon: Activity,
    title: 'Actividad de la Organización',
    subtitle: 'Registro de Actividades',
    description: 'Consulta el historial de cambios y actividades realizadas en tu organización.',
  };

  if (!organizationId) {
    return (
      <Layout wide={false} headerProps={headerProps}>
        <div className="text-center py-12 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No hay organización seleccionada.</p>
          <p className="text-xs">Selecciona una organización para ver la actividad.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout wide={false} headerProps={headerProps}>
      <ActivityLogs organizationId={organizationId} />
    </Layout>
  );
}
