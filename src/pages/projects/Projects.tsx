import { useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { Folder } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ProjectActivesView } from '@/features/projects/views/ProjectActivesView';
import { ProjectListView } from '@/features/projects/views/ProjectListView';
import { ProjectSettingsView } from '@/features/projects/views/ProjectSettingsView';

const PROJECTS_TABS = [
  { id: 'actives', label: 'Proyectos Activos' },
  { id: 'list', label: 'Lista de Proyectos' },
  { id: 'settings', label: 'Ajustes' },
];

export default function Projects() {
  const [activeTab, setActiveTab] = useState('actives');
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

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={true}
        tabs={PROJECTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderView()}
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-6">
        <div className="flex items-center gap-1">
          {PROJECTS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {renderView()}
      </div>
    </Layout>
  );
}
