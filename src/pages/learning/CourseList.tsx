import { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { BookOpen } from 'lucide-react';

export default function CourseList() {
  const { setSidebarContext, setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('learning');
    setSidebarLevel('learning');
  }, [setSidebarContext, setSidebarLevel]);

  const headerProps = {
    title: "Cursos",
    icon: BookOpen,
  };

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Lista de Cursos</h2>
          <p className="text-muted-foreground">
            Contenido de cursos en desarrollo
          </p>
        </div>
      </div>
    </Layout>
  );
}
