import { useState } from 'react';
import { Layout as LayoutIcon } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import AdminLayoutTab from './AdminLayoutTab';

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('components');

  const tabs = [
    { id: 'components', label: 'Componentes', isActive: activeTab === 'components' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'components':
        return <AdminLayoutTab />;
      default:
        return <AdminLayoutTab />;
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
