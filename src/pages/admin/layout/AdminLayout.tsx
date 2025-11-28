import { useState } from 'react';
import { Layout as LayoutIcon } from 'lucide-react';
import { DashboardLayout as Layout } from "@/layouts";
import AdminLayoutTab from './AdminLayoutTab';
import AdminLayoutContentTab from './AdminLayoutContentTab';

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('content');

  const tabs = [
    { id: 'content', label: 'Contenido', isActive: activeTab === 'content' },
    { id: 'components', label: 'Componentes', isActive: activeTab === 'components' }
  ];

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
    onTabChange: setActiveTab
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
