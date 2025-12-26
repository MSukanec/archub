import { useEffect } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ProjectVisionGeneralView } from "@/features/projects/views/ProjectVisionGeneralView";

export default function ProjectDashboardPage() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const organizationId = currentOrganizationId || userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  useEffect(() => {
    setSidebarContext('project');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('project');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  const headerProps = {
    title: "Visión General",
    description: "Dashboard del proyecto",
    organizationId,
    showMembers: true,
  };

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        showSecondaryToolbar={false}
        organizationId={organizationId}
        showMembers={true}
      >
        <ProjectVisionGeneralView />
      </LabLayout>
    );
  }

  return (
    <Layout hideHeader wide headerProps={headerProps}>
      <ProjectVisionGeneralView />
    </Layout>
  );
}
