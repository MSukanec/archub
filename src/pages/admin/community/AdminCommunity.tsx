import React, { useState } from 'react';
import { Crown, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminCommunityDashboard from './AdminCommunityDashboard';
import AdminCommunityOrganizations from './AdminCommunityOrganizations';
import AdminCommunityUsers from './AdminCommunityUsers';
import AdminCommunityAnnouncementsTab from './AdminCommunityAnnouncementsTab';
import AdminCommunityNotifications from './AdminCommunityNotifications';
import AdminCommunityChangelog from './AdminCommunityChangelog';

const AdminCommunity = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'resumen', label: 'Resumen', isActive: activeTab === 'resumen' },
    { id: 'organizaciones', label: 'Organizaciones', isActive: activeTab === 'organizaciones' },
    { id: 'usuarios', label: 'Usuarios', isActive: activeTab === 'usuarios' },
    { id: 'anuncios', label: 'Anuncios', isActive: activeTab === 'anuncios' },
    { id: 'notificaciones', label: 'Notificaciones', isActive: activeTab === 'notificaciones' },
    { id: 'cambios', label: 'Cambios', isActive: activeTab === 'cambios' }
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
      case 'anuncios':
        return {
          label: "Nuevo Anuncio",
          icon: Plus,
          onClick: () => openModal('announcement', { isEditing: false })
        };
      case 'notificaciones':
        return {
          label: "Nueva Notificación",
          icon: Plus,
          onClick: () => openModal('notification', { isEditing: false })
        };
      case 'cambios':
        return {
          label: "Nuevo Changelog",
          icon: Plus,
          onClick: () => openModal('changelog-entry', { isEditing: false })
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Comunidad",
    icon: Crown,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <AdminCommunityDashboard />;
      case 'organizaciones':
        return <AdminCommunityOrganizations />;
      case 'usuarios':
        return <AdminCommunityUsers />;
      case 'anuncios':
        return <AdminCommunityAnnouncementsTab />;
      case 'notificaciones':
        return <AdminCommunityNotifications />;
      case 'cambios':
        return <AdminCommunityChangelog />;
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