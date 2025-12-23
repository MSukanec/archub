import { useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { LuContact } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { ContactsView } from '@/features/contacts/views/ContactsView';
import { ContactSettingsView } from '@/features/contacts/views/ContactSettingsView';

const CONTACTS_TABS = [
  { id: 'contacts', label: 'Contactos' },
  { id: 'settings', label: 'Ajustes' },
];

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState('contacts');
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const handleNewContact = () => {
    openModal('contact', { isEditing: false });
  };

  const headerProps = {
    icon: LuContact,
    title: "Contactos",
    description: "Gestiona los contactos de tu organización",
    tabs: CONTACTS_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: false,
    actionButton: activeTab === 'contacts' ? {
      label: "Agregar Contacto",
      icon: UserPlus,
      onClick: handleNewContact
    } : undefined,
  };

  const labActionButton = activeTab === 'contacts' ? (
    <Button
      size="sm"
      onClick={handleNewContact}
      data-testid="button-add-contact"
    >
      <UserPlus className="w-4 h-4 mr-2" />
      Agregar Contacto
    </Button>
  ) : null;

  const renderContent = () => {
    if (activeTab === 'settings') {
      return <ContactSettingsView />;
    }
    return <ContactsView activeTab={activeTab} onTabChange={setActiveTab} />;
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
        toolbarProps={{
          secondaryRightSlot: labActionButton,
        }}
      >
        {renderContent()}
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      {renderContent()}
    </Layout>
  );
}
