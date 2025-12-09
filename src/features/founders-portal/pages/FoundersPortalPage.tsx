import { useState, useEffect } from 'react';
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useLocation } from 'wouter';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { FounderDirectory } from '../components/FounderDirectory';
import { FounderEvents } from '../components/FounderEvents';
import { FounderVoting } from '../components/FounderVoting';
import { FounderForum } from '../components/FounderForum';
import { Award, Plus } from 'lucide-react';
import { openModal } from '@/components/modal';

export function FoundersPortalPage() {
  const [activeTab, setActiveTab] = useState('directorio');
  const { data: userData, isLoading } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const [location, navigate] = useLocation();
  
  const isFounder = userData?.organization?.settings?.is_founder === true;

  const tabs = [
    { id: 'directorio', label: 'Directorio', isActive: activeTab === 'directorio' },
    { id: 'eventos', label: 'Eventos', isActive: activeTab === 'eventos' },
    { id: 'votaciones', label: 'Votaciones', isActive: activeTab === 'votaciones' },
    { id: 'foro', label: 'Foro', isActive: activeTab === 'foro' },
  ];

  const headerProps = {
    icon: Award,
    title: 'Portal Fundadores',
    description: 'Conecta con otras organizaciones fundadoras, participa en eventos y votaciones',
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    ...(activeTab === 'foro' && {
      actionButton: {
        label: 'Nuevo Tema',
        icon: Plus,
        onClick: () => openModal('forum-thread'),
      },
    }),
  };

  useEffect(() => {
    if (!isLoading && !isFounder && !isAdmin && location === '/organization/founders-portal') {
      navigate('/organization/dashboard');
    }
  }, [isLoading, isFounder, isAdmin, location, navigate]);

  if (isLoading) {
    return (
      <Layout wide headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!isFounder && !isAdmin) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'directorio':
        return <FounderDirectory />;
      case 'eventos':
        return <FounderEvents />;
      case 'votaciones':
        return <FounderVoting />;
      case 'foro':
        return <FounderForum />;
      default:
        return <FounderDirectory />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
}
