import React, { useState } from 'react';
import { Headphones, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminSupportAnnouncementsTab from './AdminSupportAnnouncementsTab';
import AdminSupportNotificationsTab from './AdminSupportNotificationsTab';
import AdminSupportChangelogTab from './AdminSupportChangelogTab';
import AdminSupportTicketsTab from './AdminSupportTicketsTab';

const AdminSupport = () => {
  const [activeTab, setActiveTab] = useState('anuncios');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'anuncios', label: 'Anuncios', isActive: activeTab === 'anuncios' },
    { id: 'notificaciones', label: 'Notificaciones', isActive: activeTab === 'notificaciones' },
    { id: 'cambios', label: 'Cambios', isActive: activeTab === 'cambios' },
    { id: 'soporte', label: 'Soporte', isActive: activeTab === 'soporte' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
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
      case 'soporte':
        return {
          label: "Iniciar Conversación",
          icon: Plus,
          onClick: () => openModal('support-conversation-start', {})
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Soporte",
    icon: Headphones,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'anuncios':
        return <AdminSupportAnnouncementsTab />;
      case 'notificaciones':
        return <AdminSupportNotificationsTab />;
      case 'cambios':
        return <AdminSupportChangelogTab />;
      case 'soporte':
        return <AdminSupportTicketsTab />;
      default:
        return <AdminSupportAnnouncementsTab />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminSupport;
