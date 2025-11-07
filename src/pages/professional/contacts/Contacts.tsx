import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { useContactTypes } from '@/hooks/use-contact-types'
import { Users, Search, Filter, UserPlus, Contact, Bell } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import ContactRow from '@/components/ui/data-row/rows/ContactRow'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import ContactList from './ContactList'
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('contacts')
  const [searchValue, setSearchValue] = useState("")
  const [filterByType, setFilterByType] = useState('all')
  const [showSearch, setShowSearch] = useState(false)
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  
  const { data: userData, isLoading } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setActions, setShowActionBar, clearActions, setFilterConfig } = useActionBarMobile()
  const isMobile = useMobile()

  // Cargar tipos de contacto de la base de datos
  const { data: contactTypes = [] } = useContactTypes()

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            setShowSearch(true);
          }
        },
        create: {
          id: 'create',
          icon: UserPlus,
          label: 'Crear Contacto',
          onClick: () => openModal('contact', { isEditing: false }),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          }
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
      })
      setShowActionBar(true)
    }

    return () => {
      if (isMobile) {
        clearActions()
      }
    }
  }, [isMobile])

  // Configure mobile filters
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
            options: (contactTypes as any[]).map(type => ({ value: type.name.toLowerCase(), label: type.name }))
          }
        ],
        onClearFilters: () => {
          setSearchValue("");
          setFilterByType("all");
          setShowSearch(false);
        }
      });
    }
  }, [isMobile, contactTypes, filterByType, setFilterConfig]);

  // Limpiar estado cuando cambia la organización
  React.useEffect(() => {
    setSearchValue("")
    setFilterByType('all')
  }, [userData?.preferences?.last_organization_id])

  // Filtros y búsqueda
  const filteredContacts = React.useMemo(() => {
    let filtered = [...contacts]

    // Filtro por búsqueda
    if (searchValue) {
      filtered = filtered.filter(contact => 
        (contact.full_name?.toLowerCase().includes(searchValue.toLowerCase())) ||
        (contact.first_name?.toLowerCase().includes(searchValue.toLowerCase())) ||
        (contact.last_name?.toLowerCase().includes(searchValue.toLowerCase())) ||
        (contact.email?.toLowerCase().includes(searchValue.toLowerCase())) ||
        (contact.company_name?.toLowerCase().includes(searchValue.toLowerCase()))
      )
    }

    // Filtro por tipo
    if (filterByType !== 'all') {
      filtered = filtered.filter(contact => 
        contact.contact_types && contact.contact_types.some((type: any) => type.name.toLowerCase() === filterByType)
      )
    }

    return filtered
  }, [contacts, searchValue, filterByType])

  // Agrupar contactos por letra (solo para mobile)
  const groupedContacts = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {}
    
    filteredContacts.forEach(contact => {
      const displayName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      const firstLetter = displayName.charAt(0).toUpperCase()
      
      if (!groups[firstLetter]) {
        groups[firstLetter] = []
      }
      groups[firstLetter].push(contact)
    })
    
    // Ordenar las letras alfabéticamente
    const sortedGroups: { [key: string]: any[] } = {}
    Object.keys(groups).sort().forEach(letter => {
      sortedGroups[letter] = groups[letter]
    })
    
    return sortedGroups
  }, [filteredContacts])

  const handleEditContact = (contact: any) => {
    openModal('contact', { 
      editingContact: contact,
      isEditing: true
    })
  }

  const handleDeleteContact = (contact: any) => {
    const contactName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    
    showDeleteConfirmation({
      mode: 'dangerous',
      title: "Eliminar contacto",
      description: "Esta acción eliminará permanentemente el contacto de la organización y todos sus datos asociados.",
      itemName: contactName,
      destructiveActionText: "Eliminar contacto",
      onDelete: () => deleteContactMutation.mutate(contact.id),
      isLoading: deleteContactMutation.isPending
    })
  }

  // Mutación para eliminar contacto
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado correctamente"
      })
      
      // Invalidar ambas claves de caché para contactos
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['organization-contacts'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive"
      })
    }
  })

  if (isLoading || contactsLoading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  if (contacts.length === 0 && !searchValue && filterByType === 'all') {
    return (
      <Layout
        headerProps={{
          icon: Contact,
          title: "Contactos",
          description: "Gestiona los contactos de tu organización",
          organizationId,
          showMembers: true,
          tabs: [
            {
              id: 'contacts',
              label: 'Lista de Contactos',
              isActive: activeTab === 'contacts'
            }
          ],
          onTabChange: (tabId: string) => setActiveTab(tabId),
          actionButton: {
            label: 'Crear Contacto',
            icon: UserPlus,
            onClick: () => openModal('contact', { isEditing: false }),
            additionalButton: {
              label: 'Invitar a Archub',
              icon: UserPlus,
              onClick: () => openModal('member', { isEditing: false }),
              variant: 'secondary' as const
            }
          }
        }}
      >
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="No hay contactos"
          description="Comienza agregando tu primer contacto a la organización"
          action={
            <Button onClick={() => openModal('contact', { isEditing: false })}>
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Contacto
            </Button>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout
      wide={!isMobile}
      headerProps={{
        icon: Contact,
        title: "Contactos",
        description: "Gestiona los contactos de tu organización",
        pageTitle: "Contactos",
        organizationId,
        showMembers: true,
        breadcrumb: [
          { name: "Organización", href: "/organization/dashboard" },
          { name: "Contactos", href: "/contacts" }
        ],
        tabs: [
          {
            id: 'contacts',
            label: 'Lista de Contactos',
            isActive: activeTab === 'contacts'
          }
        ],
        onTabChange: (tabId: string) => setActiveTab(tabId),
        showFilters: true,
        onClearFilters: () => {
          setSearchValue("");
          setFilterByType('all');
          setShowSearch(false);
        },
        actionButton: {
          label: 'Crear Contacto',
          icon: UserPlus,
          onClick: () => openModal('contact', { isEditing: false }),
          additionalButton: {
            label: 'Invitar a Archub',
            icon: UserPlus,
            onClick: () => openModal('member', { isEditing: false }),
            variant: 'secondary' as const
          }
        }
      }}
    >
      {isMobile ? (
        // Vista móvil - Contactos agrupados por letra
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
                    {(contacts as any[]).map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        onClick={(contact) => openModal('contact', { viewingContact: contact })}
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
        // Vista desktop - Tabla de contactos
        <ContactList
          contacts={filteredContacts}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
        />
      )}
    </Layout>
  )
}
