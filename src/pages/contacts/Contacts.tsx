import { DashboardLayout as Layout } from "@/layouts";
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Users, Search, Filter, UserPlus, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import {
  useContacts,
  useContactTypes,
  useDeleteContact,
  ContactList,
  ContactRow,
  formatContactName,
  groupContactsByLetter,
} from '@/features/contacts';

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [searchValue, setSearchValue] = useState('');
  const [filterByType, setFilterByType] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();

  const { data: userData, isLoading } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(organizationId);
  const { data: contactTypes = [] } = useContactTypes(organizationId);
  const deleteContactMutation = useDeleteContact(organizationId!);
  const { toast } = useToast();
  const { setActions, setShowActionBar, clearActions, setFilterConfig } = useActionBarMobile();
  const isMobile = useMobile();

  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            setShowSearch(true);
          },
        },
        create: {
          id: 'create',
          icon: UserPlus,
          label: 'Crear Contacto',
          onClick: () => openModal('contact', { isEditing: false }),
          variant: 'primary',
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {},
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {},
        },
      });
      setShowActionBar(true);
    }

    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && contactTypes && contactTypes.length > 0) {
      setFilterConfig({
        filters: [
          {
            label: 'Filtrar por tipo de contacto',
            value: filterByType,
            onChange: setFilterByType,
            placeholder: 'Todos los tipos',
            allOptionLabel: 'Todos los tipos',
            options: contactTypes.map((type) => ({
              value: type.name.toLowerCase(),
              label: type.name,
            })),
          },
        ],
        onClearFilters: () => {
          setSearchValue('');
          setFilterByType('all');
          setShowSearch(false);
        },
      });
    }
  }, [isMobile, contactTypes, filterByType, setFilterConfig]);

  React.useEffect(() => {
    setSearchValue('');
    setFilterByType('all');
  }, [userData?.preferences?.last_organization_id]);

  const filteredContacts = React.useMemo(() => {
    let filtered = [...contacts];

    if (searchValue) {
      filtered = filtered.filter(
        (contact) =>
          contact.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          contact.first_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          contact.last_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
          contact.company_name?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (filterByType !== 'all') {
      filtered = filtered.filter(
        (contact) =>
          contact.contact_types &&
          contact.contact_types.some((type) => type.name.toLowerCase() === filterByType)
      );
    }

    return filtered;
  }, [contacts, searchValue, filterByType]);

  const groupedContacts = React.useMemo(() => {
    return groupContactsByLetter(filteredContacts);
  }, [filteredContacts]);

  const handleViewContact = (contact: any) => {
    openModal('contact', {
      editingContact: contact,
      isEditing: true,
      initialPanel: 'view',
    });
  };

  const handleEditContact = (contact: any) => {
    openModal('contact', {
      editingContact: contact,
      isEditing: true,
      initialPanel: 'edit',
    });
  };

  const handleDeleteContact = (contact: any) => {
    const contactName = formatContactName(contact);

    showDeleteConfirmation({
      mode: 'dangerous',
      title: 'Eliminar contacto',
      description:
        'Esta acción marcará el contacto como eliminado (soft delete). El contacto no se mostrará en la lista pero se mantendrá en la base de datos.',
      itemName: contactName,
      destructiveActionText: 'Eliminar contacto',
      onDelete: () => {
        deleteContactMutation.mutate(contact.id, {
          onSuccess: () => {
            toast({
              title: 'Contacto eliminado',
              description: 'El contacto ha sido eliminado correctamente',
            });
          },
          onError: (error: Error) => {
            toast({
              title: 'Error',
              description: error.message || 'No se pudo eliminar el contacto',
              variant: 'destructive',
            });
          },
        });
      },
      isLoading: deleteContactMutation.isPending,
    });
  };

  if (isLoading || contactsLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (contacts.length === 0 && !searchValue && filterByType === 'all') {
    return (
      <Layout
        wide={false}
        headerProps={{
          icon: Users,
          title: 'Contactos',
          description: 'Gestiona los contactos de tu organización',
          organizationId,
          showMembers: true,
          tabs: [
            {
              id: 'contacts',
              label: 'Lista de Contactos',
              isActive: activeTab === 'contacts',
            },
          ],
          onTabChange: (tabId: string) => setActiveTab(tabId),
          actionButton: {
            label: 'Crear Contacto',
            icon: UserPlus,
            onClick: () => openModal('contact', { isEditing: false }),
          },
        }}
      >
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="Los contactos son la base de tu organización"
          description="Comienza construyendo tu red de contactos. Cada contacto que agregues puede convertirse en un cliente, socio, empleado, proveedor o subcontratista. Centraliza toda la información de las personas y empresas con las que trabajas en un solo lugar."
          action={
            <Button onClick={() => openModal('contact', { isEditing: false })}>
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Primer Contacto
            </Button>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout
      wide={false}
      headerProps={{
        icon: Users,
        title: 'Contactos',
        description: 'Gestiona los contactos de tu organización',
        pageTitle: 'Contactos',
        organizationId,
        showMembers: true,
        breadcrumb: [
          { name: 'Organización', href: '/organization/dashboard' },
          { name: 'Contactos', href: '/contacts' },
        ],
        tabs: [
          {
            id: 'contacts',
            label: 'Lista de Contactos',
            isActive: activeTab === 'contacts',
          },
        ],
        onTabChange: (tabId: string) => setActiveTab(tabId),
        actionButton: {
          label: 'Crear Contacto',
          icon: UserPlus,
          onClick: () => openModal('contact', { isEditing: false }),
        },
      }}
    >
      {isMobile ? (
        <div className="h-full overflow-y-auto scrollbar-hide">
          {filteredContacts.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedContacts).map(([letter, contacts]) => (
                <div key={letter} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                      <span className="text-sm font-semibold text-muted-foreground">{letter}</span>
                    </div>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        onClick={(c: any) =>
                          openModal('contact', {
                            editingContact: c,
                            isEditing: true,
                            initialPanel: 'view',
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay contactos</h3>
              <p className="text-muted-foreground">Comienza agregando tu primer contacto</p>
            </div>
          )}
        </div>
      ) : (
        <ContactList
          contacts={filteredContacts}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
          onRowClick={handleViewContact}
          filterByType={filterByType}
          setFilterByType={setFilterByType}
          contactTypes={contactTypes}
        />
      )}
    </Layout>
  );
}
