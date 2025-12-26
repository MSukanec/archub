import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Home } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { OrganizationDashboardView } from '@/features/organization/views/OrganizationDashboardView';

export function OrganizationDashboardPage() {
  const [, setLocation] = useLocation();
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId } = useProjectContext();
  const organizationId = currentOrganizationId || userData?.organization?.id;
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { setShowActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  
  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  useEffect(() => {
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [isMobile, setShowActionBar]);

  useEffect(() => {
    if (sidebarLevel !== 'general') {
      setSidebarLevel('organization');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSidebarLevel]);

  const handleProjectSelected = (projectId: string) => {
    setSidebarLevel('project');
    setLocation('/project/dashboard');
  };

  const handleNavigateToProjects = () => {
    setSidebarLevel('organization');
    setLocation('/organization/projects');
  };

  const headerProps = {
    icon: Home,
    title: "Visión General",
    description: "Vista general de tu organización, proyectos y actividad reciente.",
    organizationId: organizationId,
    showMembers: true
  };

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        showSecondaryToolbar={false}
        organizationId={organizationId}
        showMembers={true}
      >
        <OrganizationDashboardView 
          onProjectSelected={handleProjectSelected}
          onNavigateToProjects={handleNavigateToProjects}
        />
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <OrganizationDashboardView 
        onProjectSelected={handleProjectSelected}
        onNavigateToProjects={handleNavigateToProjects}
      />
    </Layout>
  );
}
