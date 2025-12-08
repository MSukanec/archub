import React, { useState } from 'react';
import { Headphones, Plus, RotateCcw } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useGlobalModalStore } from '@/components/modal';
import AdminSupportAnnouncementsTab from './AdminSupportAnnouncementsTab';
import AdminSupportNotificationsTab from './AdminSupportNotificationsTab';
import AdminSupportChangelogTab from './AdminSupportChangelogTab';
import AdminSupportTicketsTab from './AdminSupportTicketsTab';
import { useUnreadSupportMessages } from '@/hooks/use-unread-support-messages';
import { useToast } from '@/hooks/use-toast';

const AdminSupport = () => {
  const [activeTab, setActiveTab] = useState('soporte');
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();

  // Obtener badges para cada tab
  const { data: unreadSupportCount = 0 } = useUnreadSupportMessages();
  // TODO: Agregar hooks para anuncios, notificaciones y cambios según sea necesario

  const tabs = [
    { 
      id: 'soporte', 
      label: 'Soporte', 
      isActive: activeTab === 'soporte',
      badgeCount: unreadSupportCount
    },
    { 
      id: 'anuncios', 
      label: 'Anuncios', 
      isActive: activeTab === 'anuncios',
      // badgeCount: unreadAnnouncementsCount // Agregar cuando se implemente
    },
    { 
      id: 'notificaciones', 
      label: 'Notificaciones', 
      isActive: activeTab === 'notificaciones',
      // badgeCount: unreadNotificationsCount // Agregar cuando se implemente
    },
    { 
      id: 'cambios', 
      label: 'Cambios', 
      isActive: activeTab === 'cambios',
      // badgeCount: unreadChangelogsCount // Agregar cuando se implemente
    }
  ];

  const handleResetAnnouncementView = () => {
    localStorage.removeItem('dismissed-announcements');
    toast({
      title: 'Vista reseteada',
      description: 'Ahora podrás ver todos los anuncios activos al recargar la página.',
    });
  };

  const getActionButton = () => {
    switch (activeTab) {
      case 'anuncios':
        return {
          label: "Nuevo Anuncio",
          icon: Plus,
          onClick: () => openModal('announcement', { isEditing: false }),
          additionalButton: {
            label: "Resetear Vista",
            icon: RotateCcw,
            onClick: handleResetAnnouncementView,
            variant: "secondary" as const
          }
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
