import { useEffect } from 'react';
import { DashboardLayout as Layout } from "@/layouts";
import { CoursesCatalogContent } from '@/features/shared-content/courses';
import { BookOpen } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';

export default function CourseList() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('learning');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  const headerProps = {
    title: "Cursos",
    icon: BookOpen,
    tabs: [],
    onTabChange: () => {},
    actions: []
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <CoursesCatalogContent mode="dashboard" showTabs={true} />
      </div>
    </Layout>
  );
}
