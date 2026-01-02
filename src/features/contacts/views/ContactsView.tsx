import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/users/hooks';
import { Search, Filter, UserPlus, Bell } from 'lucide-react';
import { LuContact } from 'react-icons/lu';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/shared/EmptyState';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import {
  useContacts,
  useContactTypes,
  useDeleteContact,
  ContactList,
  ContactRow,
  formatContactName,
  groupContactsByLetter,
} from '@/features/contacts';

export function ContactsView() {
  const [searchValue, setSearchValue] = useState('');
  const [filterByType, setFilterByType] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();

  const { data: userData, isLoading } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(organizationId);
  const { data: contactTypes = [] } = useContactTypes(organizationId);
  const deleteContactMutation = useDeleteContact(organizationId || '');
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
  }, [isMobile, openModal, clearActions, setActions, setShowActionBar]);

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

  useEffect(() => {
    setSearchValue('');
    setFilterByType('all');
  }, [userData?.preferences?.last_organization_id]);

  const filteredContacts = useMemo(() => {
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

  const groupedContacts = useMemo(() => {
    return groupContactsByLetter(filteredContacts);
  }, [filteredContacts]);

  const handleViewContact = (contact: any) => {
    openModal('contact', {
      contactId: contact.id,
      contact: contact,
      mode: 'view',
    });
  };

  const handleEditContact = (contact: any) => {
    openModal('contact', {
      contactId: contact.id,
      contact: contact,
      mode: 'edit',
    });
  };

  const handleDeleteContact = (contact: any) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el contacto. Intenta de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    const contactName = formatContactName(contact);
    const userId = userData?.user?.id;

    showDeleteConfirmation({
      mode: 'dangerous',
      title: 'Eliminar contacto',
      description:
        'El contacto dejará de aparecer en tus listas. Todos tus datos vinculados (proyectos, pagos, registros) permanecerán intactos y seguros.',
      itemName: contactName,
      destructiveActionText: 'Eliminar contacto',
      onConfirm: () => {
        deleteContactMutation.mutate({ 
          contactId: contact.id, 
          organizationId,
          userId,
          contactName
        });
      },
      isLoading: deleteContactMutation.isPending,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (contacts.length === 0 && !searchValue && filterByType === 'all') {
    return (
      <div className="p-6">
        <EmptyState
          icon={<LuContact className="w-8 h-8 text-muted-foreground" />}
          title="Los contactos son la base de tu organización"
          description="Comienza construyendo tu red de contactos. Cada contacto que agregues puede convertirse en un cliente, socio, empleado, proveedor o subcontratista. Centraliza toda la información de las personas y empresas con las que trabajas en un solo lugar."
          action={
            <Button onClick={() => openModal('contact', { isEditing: false })} data-testid="button-add-first-contact">
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Primer Contacto
            </Button>
          }
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide p-6">
        {filteredContacts.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedContacts).map(([letter, letterContacts]) => (
              <div key={letter} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                    <span className="text-sm font-semibold text-muted-foreground">{letter}</span>
                  </div>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                <div className="space-y-2">
                  {letterContacts.map((contact: any) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      onEdit={() => handleEditContact(contact)}
                      onDelete={() => handleDeleteContact(contact)}
                      onClick={(c: any) =>
                        openModal('contact', {
                          contactId: c.id,
                          contact: c,
                          mode: 'view',
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
            <LuContact className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay contactos</h3>
            <p className="text-muted-foreground">Comienza agregando tu primer contacto</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <ContactList
      contacts={filteredContacts}
      onEdit={handleEditContact}
      onDelete={handleDeleteContact}
      onRowClick={handleViewContact}
    />
  );
}
