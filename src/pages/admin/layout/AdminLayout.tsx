import { useState } from 'react';
import { Layout as LayoutIcon, Plus } from 'lucide-react';
import { DashboardLayout as Layout } from "@/layouts";
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import AdminLayoutTab from './AdminLayoutTab';
import AdminLayoutContentTab from './AdminLayoutContentTab';

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('content');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'content', label: 'Contenido', isActive: activeTab === 'content' },
    { id: 'components', label: 'Componentes', isActive: activeTab === 'components' }
  ];

  const handleCreateSection = () => {
    openModal('hero-section-form', { mode: 'create' });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        return <AdminLayoutContentTab />;
      case 'components':
        return <AdminLayoutTab />;
      default:
        return <AdminLayoutContentTab />;
    }
  };

  const headerProps = {
    title: 'Layout',
    icon: LayoutIcon,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actions: activeTab === 'content' ? [
      <Button key="create" onClick={handleCreateSection} data-testid="button-create-hero-section">
        <Plus className="w-4 h-4 mr-2" />
        Nueva Sección
      </Button>
    ] : undefined
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {renderTabContent()}
      </div>
    </Layout>
  );
};

export default AdminLayout;
