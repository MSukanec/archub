import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { Users } from 'lucide-react';

export default function Community() {
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('community');
  }, [setSidebarLevel]);

  const headerProps = {
    title: "Visión General",
    icon: Users,
    description: "Conecta con otros profesionales y comparte conocimiento",
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Contenido de la comunidad próximamente...
          </p>
        </div>
      </div>
    </Layout>
  );
}
