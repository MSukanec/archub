import React, { useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow';

export default function DesignDocumentation() {
  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context to design
  useEffect(() => {
    setSidebarContext('design');
  }, [setSidebarContext]);

  const headerProps = {
    title: "Documentación de Diseño"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktopRow
          filters={[]}
          actions={[]}
        />

        {/* Main Content - Empty for now */}
        <div className="space-y-8">
          <div className="text-center text-muted-foreground">
            Contenido de documentación aquí
          </div>
        </div>
      </div>
    </Layout>
  );
}