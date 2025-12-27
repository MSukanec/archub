import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useGlobalModalStore } from '@/components/modal';
import AdminDashboardView from '@/features/admin/views/AdminDashboardView';
import AdminOrganizationsView from '@/features/admin/views/AdminOrganizationsView';
import AdminUsersView from '@/features/admin/views/AdminUsersView';
import AdminActivityLogsView from '@/features/admin/views/AdminActivityLogsView';

const AdminAdministrationPage = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'resumen', label: 'Resumen', isActive: activeTab === 'resumen' },
    { id: 'organizaciones', label: 'Organizaciones', isActive: activeTab === 'organizaciones' },
    { id: 'usuarios', label: 'Usuarios', isActive: activeTab === 'usuarios' },
    { id: 'actividad', label: 'Actividad', isActive: activeTab === 'actividad' }
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
    description: "Gestiona usuarios, organizaciones y actividad del sistema.",
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
        return <AdminDashboardView />;
      case 'organizaciones':
        return <AdminOrganizationsView />;
      case 'usuarios':
        return <AdminUsersView />;
      case 'actividad':
        return <AdminActivityLogsView />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <Layout wide={false} headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminAdministrationPage;
