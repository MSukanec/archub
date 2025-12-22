import { useEffect } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { ProjectVisionGeneralView } from "@/features/projects/views/ProjectVisionGeneralView";

export default function Project() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { selectedProjectId } = useProjectContext();

  useEffect(() => {
    setSidebarContext('project');
    if (sidebarLevel !== 'general') {
      setSidebarLevel('project');
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel]);

  return (
    <Layout hideHeader wide>
      <ProjectVisionGeneralView />
    </Layout>
  );
}
