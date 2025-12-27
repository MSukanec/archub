import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { OrganizationProfileView, OrganizationLocationView } from '@/features/organization';
import { Building2 } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/features/users/hooks';

export function OrganizationDataPage() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const tabs = [
    { id: 'profile', label: 'Perfil', isActive: activeTab === 'profile' },
    { id: 'location', label: 'Ubicación', isActive: activeTab === 'location' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <OrganizationProfileView />;
      case 'location':
        return <OrganizationLocationView />;
      default:
        return <OrganizationProfileView />;
    }
  };

  const headerProps = {
    icon: Building2,
    title: "Datos de la Organización",
    description: "Gestiona la información y configuración de tu organización",
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
