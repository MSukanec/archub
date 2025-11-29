import { useEffect } from 'react';
import { useParams } from 'wouter';
import { DashboardLayout as Layout } from "@/layouts";
import { CourseLandingContent } from '@/features/shared-content/courses';
import { useCourseLanding } from '@/features/learning';
import { BookOpen } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';

export default function CourseInfo() {
  const { slug } = useParams<{ slug: string }>();
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { data } = useCourseLanding(slug || '');

  useEffect(() => {
    setSidebarContext('learning');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  const headerProps = {
    title: data?.course?.title || "Información del Curso",
    icon: BookOpen,
    tabs: [],
    onTabChange: () => {},
    actions: []
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <CourseLandingContent mode="dashboard" slug={slug || ''} />
      </div>
    </Layout>
  );
}
