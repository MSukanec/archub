import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { GraduationCap } from 'lucide-react';

export default function LearningDashboard() {
  const { setSidebarContext, setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('learning');
    setSidebarLevel('learning');
  }, [setSidebarContext, setSidebarLevel]);

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Bienvenido a Capacitaciones</h2>
          <p className="text-muted-foreground">
            Contenido del dashboard en desarrollo
          </p>
        </div>
      </div>
    </Layout>
  );
}
