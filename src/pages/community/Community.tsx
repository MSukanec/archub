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
    title: "Comunidad",
    icon: Users,
    description: "Conecta con otros profesionales de la construcción",
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Contenido de la comunidad aquí */}
      </div>
    </Layout>
  );
}
