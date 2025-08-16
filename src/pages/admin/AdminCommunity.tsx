import React, { useState } from 'react';
import { Crown, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminCommunityDashboard from './tabs/AdminCommunityDashboard';
import AdminCommunityOrganizations from './tabs/AdminCommunityOrganizations';
import AdminCommunityUsers from './tabs/AdminCommunityUsers';

const AdminCommunity = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'resumen', label: 'Resumen', isActive: activeTab === 'resumen' },
    { id: 'organizaciones', label: 'Organizaciones', isActive: activeTab === 'organizaciones' },
    { id: 'usuarios', label: 'Usuarios', isActive: activeTab === 'usuarios' }
  ];

  const headerProps = {
    title: "Comunidad",
    icon: Crown,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: {
      label: "Nueva Organización",
      icon: Plus,
      onClick: () => openModal('admin-organization', { isEditing: false })
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <AdminCommunityDashboard />;
      case 'organizaciones':
        return <AdminCommunityOrganizations />;
      case 'usuarios':
        return <AdminCommunityUsers />;
      default:
        return <AdminCommunityDashboard />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminCommunity;