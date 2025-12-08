import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { PartnersListTab } from '@/pages/partners/tabs/PartnersListTab';
import { HandHeart } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function Partners() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const tabs = [
    { id: 'list', label: 'Lista', isActive: activeTab === 'list' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <PartnersListTab />;
      default:
        return <PartnersListTab />;
    }
  };

  const headerProps = {
    icon: HandHeart,
    title: "Socios",
    description: "Gestiona los socios de tu organización y sus participaciones",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
