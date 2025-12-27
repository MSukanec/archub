import { useState } from 'react';
import { Layout as LayoutIcon, Plus } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from '@/components/modal';
import AdminLayoutContentView from '@/features/admin/views/AdminLayoutContentView';
import AdminLayoutCardView from '@/features/admin/views/AdminLayoutCardView';
import AdminLayoutChartView from '@/features/admin/views/AdminLayoutChartView';

const AdminLayoutPage = () => {
  const [activeTab, setActiveTab] = useState('charts');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'charts', label: 'Charts', isActive: activeTab === 'charts' },
    { id: 'content', label: 'Contenido', isActive: activeTab === 'content' },
    { id: 'components', label: 'Componentes', isActive: activeTab === 'components' }
  ];

  const handleCreateSection = () => {
    openModal('hero-section-form', { mode: 'create' });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'charts':
        return <AdminLayoutChartView />;
      case 'content':
        return <AdminLayoutContentView />;
      case 'components':
        return <AdminLayoutCardView />;
      default:
        return <AdminLayoutChartView />;
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

export default AdminLayoutPage;
