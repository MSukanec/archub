import { useState, useEffect } from 'react';
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { Tabs } from '@/components/ui-custom/Tabs';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useLocation } from 'wouter';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { FounderDirectory } from '../components/FounderDirectory';
import { FounderEvents } from '../components/FounderEvents';
import { FounderVoting } from '../components/FounderVoting';
import { FounderForum } from '../components/FounderForum';
import { Award } from 'lucide-react';

export function FoundersPortalPage() {
  const [activeTab, setActiveTab] = useState('directorio');
  const { data: userData, isLoading } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const [, navigate] = useLocation();
  
  const isFounder = userData?.organization?.settings?.is_founder === true;
  const organizationName = userData?.organization?.name || 'tu organización';

  const tabs = [
    { value: 'directorio', label: 'Directorio' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'votaciones', label: 'Votaciones' },
    { value: 'foro', label: 'Foro' },
  ];

  const headerProps = {
    icon: Award,
    title: 'Portal Fundadores',
    description: `Conecta con otras organizaciones fundadoras, participa en eventos y votaciones`,
  };

  useEffect(() => {
    if (!isLoading && !isFounder && !isAdmin) {
      navigate('/organization/dashboard');
    }
  }, [isLoading, isFounder, isAdmin, navigate]);

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
      <div className="space-y-6">
        <Tabs 
          tabs={tabs}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        {renderTabContent()}
      </div>
    </Layout>
  );
}
