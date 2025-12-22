import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { Folder } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ProjectsView } from '@/features/projects/views/ProjectsView';

export default function Projects() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = {
    title: "Gestión de Proyectos",
    description: "Administra todos los proyectos de tu organización desde un solo lugar",
    icon: Folder,
    organizationId,
    showMembers: true,
  };

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={true}
      >
        <ProjectsView />
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <ProjectsView />
    </Layout>
  );
}
