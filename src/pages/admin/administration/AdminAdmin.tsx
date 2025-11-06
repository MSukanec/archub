import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminAdminDashboard from './AdminAdminDashboard';
import AdminAdminOrganizations from './AdminAdminOrganizations';
import AdminAdminUsers from './AdminAdminUsers';

const AdminAdmin = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'resumen', label: 'Resumen', isActive: activeTab === 'resumen' },
    { id: 'organizaciones', label: 'Organizaciones', isActive: activeTab === 'organizaciones' },
    { id: 'usuarios', label: 'Usuarios', isActive: activeTab === 'usuarios' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'organizaciones':
        return {
          label: "Nueva Organización",
          icon: Plus,
          onClick: () => openModal('admin-organization', { isEditing: false })
        };
      case 'usuarios':
        return {
          label: "Nuevo Usuario",
          icon: Plus,
          onClick: () => openModal('admin-user', { isEditing: false })
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Administración",
    icon: Settings,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <AdminAdminDashboard />;
      case 'organizaciones':
        return <AdminAdminOrganizations />;
      case 'usuarios':
        return <AdminAdminUsers />;
      default:
        return <AdminAdminDashboard />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminAdmin;
