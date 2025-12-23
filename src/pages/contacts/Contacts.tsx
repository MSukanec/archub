import { useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { LuContact } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { ContactsView } from '@/features/contacts/views/ContactsView';

const CONTACTS_TABS = [
  { id: 'contacts', label: 'Contactos' },
  { id: 'settings', label: 'Ajustes' },
];

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('contacts');
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
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

  const actionButton = activeTab === 'contacts' ? (
    <Button
      size="sm"
      onClick={() => openModal('contact', { isEditing: false })}
      data-testid="button-add-contact"
    >
      <UserPlus className="w-4 h-4 mr-2" />
      Agregar Contacto
    </Button>
  ) : null;

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={false}
        tabs={CONTACTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: actionButton,
        }}
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
