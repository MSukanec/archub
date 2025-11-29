import { useEffect } from 'react';
import { useParams } from 'wouter';
import { DashboardLayout as Layout, HeroLayout } from "@/layouts";
import { CourseLandingShell } from '@/features/shared-content/courses';
import { useNavigationStore } from '@/stores/navigationStore';

export default function CourseInfo() {
  const { slug } = useParams<{ slug: string }>();
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('learning');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  return (
    <Layout hideHeader wide>
      <HeroLayout noPadding>
        <CourseLandingShell mode="dashboard" slug={slug || ''} />
      </HeroLayout>
    </Layout>
  );
}
