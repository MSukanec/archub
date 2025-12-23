import { useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useCurrentUser } from '@/hooks/use-current-user';
import { LuContact } from 'react-icons/lu';
import { ContactsView } from '@/features/contacts/views/ContactsView';

const CONTACTS_TABS = [
  { id: 'contacts', label: 'Contactos' },
  { id: 'settings', label: 'Ajustes' },
];

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('contacts');
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = {
    icon: LuContact,
    title: "Contactos",
    description: "Gestiona los contactos de tu organización",
    tabs: CONTACTS_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: false,
  };

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={false}
        tabs={CONTACTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <ContactsView activeTab={activeTab} onTabChange={setActiveTab} />
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <ContactsView activeTab={activeTab} onTabChange={setActiveTab} />
    </Layout>
  );
}
