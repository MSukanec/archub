import { useState, useEffect } from 'react';
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useLocation } from 'wouter';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { FounderDirectory } from '../components/FounderDirectory';
import { FounderEvents } from '../components/FounderEvents';
import { FounderVoting } from '../components/FounderVoting';
import { FounderForum } from '../components/FounderForum';
import { FoundersDashboardTab } from '@/pages/founders-portal/tabs/FoundersDashboardTab';
import { Award, FolderPlus } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';
import { Button } from '@/components/ui/button';

export function FoundersPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: userData, isLoading } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const [location, navigate] = useLocation();
  const { openModal } = useGlobalModalStore();
  
  const isFounder = userData?.organization?.settings?.is_founder === true;

  const tabs = [
    { id: 'dashboard', label: 'Visión General', isActive: activeTab === 'dashboard' },
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

    if (activeTab === 'foro' && isAdmin) {
      const actions: React.ReactNode[] = [];
      actions.push(
        <Button
          key="new-category"
          variant="secondary"
          size="sm"
          onClick={() => openModal('forum-category')}
          className="h-8 px-3 text-xs font-medium"
        >
          <FolderPlus className="w-4 h-4 mr-1.5" />
          Nueva Categoría
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
      case 'dashboard':
        return <FoundersDashboardTab onTabChange={setActiveTab} />;
      case 'directorio':
        return <FounderDirectory />;
      case 'eventos':
        return <FounderEvents />;
      case 'votaciones':
        return <FounderVoting />;
      case 'foro':
        return <FounderForum />;
      default:
        return <FoundersDashboardTab onTabChange={setActiveTab} />;
    }
  };

  return (
    <Layout wide headerProps={getHeaderProps()}>
      {renderTabContent()}
    </Layout>
  );
}
