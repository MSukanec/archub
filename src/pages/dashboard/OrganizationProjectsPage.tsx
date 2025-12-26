import { useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { Folder, Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { ProjectActivesView } from '@/features/projects/views/ProjectActivesView';
import { ProjectListView } from '@/features/projects/views/ProjectListView';
import { ProjectSettingsView } from '@/features/projects/views/ProjectSettingsView';
import { Button } from '@/components/ui/button';
const PROJECTS_TABS = [
  { id: 'actives', label: 'Proyectos Activos'},
  { id: 'list', label: 'Lista de Proyectos'},
  { id: 'settings', label: 'Ajustes'},
];
export default function OrganizationProjectsPage() {
  const [activeTab, setActiveTab] = useState('actives');
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id;
  
  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';
  const handleNewProject = () => {
    openModal('project', { organizationId });
  };
  const renderView = () => {
    switch (activeTab) {
      case 'actives':
        return <ProjectActivesView />;
      case 'list':
        return <ProjectListView />;
      case 'settings':
        return <ProjectSettingsView />;
      default:
        return <ProjectActivesView />;
    }
  };
  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      {(activeTab === 'actives'|| activeTab === 'list') && (
        <Button
          size="sm"
          onClick={handleNewProject}
          data-testid="button-add-project"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      )}
    </div>
  );
  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={true}
        tabs={PROJECTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: secondaryRightContent,
        }}
      >
        {renderView()}
      </LabLayout>
    );
  }
  const headerTabs = PROJECTS_TABS.map(tab => ({
    ...tab,
    isActive: activeTab === tab.id
  }));
  const getActionButton = () => {
    if (activeTab === 'actives'|| activeTab === 'list') {
      return {
        label: "Nuevo Proyecto",
        icon: Plus,
        onClick: handleNewProject
      };
    }
    return undefined;
  };
  const headerProps = {
    title: "Gestión de Proyectos",
    description: "Administra todos los proyectos de tu organización desde un solo lugar",
    icon: Folder,
    organizationId,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actionButton: getActionButton(),
  };
  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderView()}
    </Layout>
  );
}
