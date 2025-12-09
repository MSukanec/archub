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
import { Award, Plus, FolderPlus } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';
import { Button } from '@/components/ui/button';

export function FoundersPortalPage() {
  const [activeTab, setActiveTab] = useState('directorio');
  const { data: userData, isLoading } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const [location, navigate] = useLocation();
  const { openModal } = useGlobalModalStore();
  
  const isFounder = userData?.organization?.settings?.is_founder === true;

  const tabs = [
    { id: 'directorio', label: 'Directorio', isActive: activeTab === 'directorio' },
    { id: 'eventos', label: 'Eventos', isActive: activeTab === 'eventos' },
    { id: 'votaciones', label: 'Votaciones', isActive: activeTab === 'votaciones' },
    { id: 'foro', label: 'Foro', isActive: activeTab === 'foro' },
  ];

  const getHeaderProps = () => {
    const base = {
      icon: Award,
      title: 'Portal Fundadores',
      description: 'Conecta con otras organizaciones fundadoras, participa en eventos y votaciones',
      showSearch: false,
      showFilters: false,
      tabs,
      onTabChange: setActiveTab,
    };

    if (activeTab === 'foro') {
      const actions: React.ReactNode[] = [];
      if (isAdmin) {
        actions.push(
          <Button
            key="new-category"
            variant="outline"
            size="sm"
            onClick={() => openModal('forum-category')}
            className="h-8 px-3 text-xs font-medium"
          >
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Nueva Categoría
          </Button>
        );
      }
      actions.push(
        <Button
          key="new-thread"
          variant="default"
          size="sm"
          onClick={() => openModal('forum-thread')}
          className="h-8 px-3 text-xs font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo Tema
        </Button>
      );
      return { ...base, actions };
    }

    return base;
  };

  useEffect(() => {
    if (!isLoading && !isFounder && !isAdmin && location === '/organization/founders-portal') {
      navigate('/organization/dashboard');
    }
  }, [isLoading, isFounder, isAdmin, location, navigate]);

  if (isLoading) {
    return (
      <Layout wide headerProps={getHeaderProps()}>
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
    <Layout wide headerProps={getHeaderProps()}>
      {renderTabContent()}
    </Layout>
  );
}
