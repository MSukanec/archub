import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import CustomTable from '@/components/ui-custom/misc/CustomTable'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { Users, Plus, Edit, Trash2, CheckCircle, Send, Search, Filter, X, UserPlus } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewContactModal } from '@/modals/contacts/NewContactModal'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import ContactCard from '@/components/cards/ContactCard'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import { useMobile } from '@/hooks/use-mobile'

export default function OrganizationContacts() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<any>(null)
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setActions, setShowActionBar, clearActions } = useMobileActionBar()
  const isMobile = useMobile()

  // Lista hardcoded de tipos de contacto
  const contactTypes = [
    { id: 'arquitecto', name: 'Arquitecto' },
    { id: 'ingeniero', name: 'Ingeniero' },
    { id: 'constructor', name: 'Constructor' },
    { id: 'proveedor', name: 'Proveedor' },
    { id: 'cliente', name: 'Cliente' }
  ]

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        slot2: {
          id: 'search',
          icon: <Search className="h-5 w-5" />,
          label: 'Buscar',
          onClick: () => {
            const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
          }
        },
        slot3: {
          id: 'create',
          icon: <UserPlus className="h-6 w-6" />,
          label: 'Crear Contacto',
          onClick: () => setShowCreateModal(true),
          variant: 'primary'
        },
        slot4: {
          id: 'filter',
          icon: <Filter className="h-5 w-5" />,
          label: 'Filtros',
          onClick: () => {
            console.log('Toggle filtros')
          }
        },
        slot5: {
          id: 'clear',
          icon: <X className="h-5 w-5" />,
          label: 'Limpiar',
          onClick: () => {
            setSearchValue('')
            setFilterByType('all')
          }
        }
      })
      setShowActionBar(true)
    }

    return () => {
      if (isMobile) {
        clearActions()
      }
    }
  }, [isMobile, setActions, setShowActionBar, clearActions])

  // Limpiar estado cuando cambia la organización
  React.useEffect(() => {
    setSearchValue("")
    setFilterByType('all')
    setSortBy('name_asc')
  }, [userData?.preferences?.last_organization_id])

  const organizationName = userData?.organization?.name || "Organización"

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
      filtered = filtered.filter(contact => contact.contact_type_id === filterByType)
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const nameA = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim()
      const nameB = b.full_name || `${b.first_name || ''} ${b.last_name || ''}`.trim()
      
      switch (sortBy) {
        case 'name_asc':
          return nameA.localeCompare(nameB)
        case 'name_desc':
          return nameB.localeCompare(nameA)
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [contacts, searchValue, filterByType, sortBy])

  const handleEditContact = (contact: any) => {
    setEditingContact(contact)
    setShowEditModal(true)
  }

  const handleDeleteContact = (contact: any) => {
    setContactToDelete(contact)
    setShowDeleteDialog(true)
  }

  const handleClearFilters = () => {
    setSearchValue("")
    setFilterByType('all')
    setSortBy('name_asc')
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
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setShowDeleteDialog(false)
      setContactToDelete(null)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive"
      })
    }
  })

  // Columnas para la tabla
  const columns = [
    {
      key: "name" as const,
      label: "Contacto",
      sortable: true,
      render: (contact: any) => (
        <div className="flex items-center gap-3">
          {contact.linked_user ? (
            <Avatar className="w-8 h-8">
              <AvatarImage src={contact.linked_user.avatar_url} />
              <AvatarFallback>
                {contact.linked_user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium">
              {contact.first_name?.charAt(0) || 'C'}
            </div>
          )}
          <div>
            <div className="font-medium text-sm">
              {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
            </div>
            {contact.linked_user && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Usuario de Archub</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "contact_type_id" as const,
      label: "Tipo",
      render: (contact: any) => (
        <Badge variant="secondary" className="text-xs">
          {contactTypes.find(t => t.id === contact.contact_type_id)?.name || 'Sin tipo'}
        </Badge>
      )
    },
    {
      key: "email" as const,
      label: "Email",
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.email || '—'}
        </div>
      )
    },
    {
      key: "company_name" as const,
      label: "Empresa",
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.company_name || '—'}
        </div>
      )
    },
    {
      key: "created_at" as const,
      label: "Fecha",
      sortable: true,
      sortType: "date" as const,
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    }
  ]

  // Configuración del header según el template
  const headerProps = {
    title: "Contactos",
    description: "Gestiona los contactos de tu organización",
    icon: Users,
    breadcrumb: [
      { label: organizationName, href: "/organization/dashboard" },
      { label: "Contactos", href: "/organization/contacts" }
    ],
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    searchPlaceholder: "Buscar contactos...",
    showFilters: true,
    filters: [
      { 
        label: `Ordenar: ${
          sortBy === 'name_asc' ? 'Nombre (A-Z)' :
          sortBy === 'name_desc' ? 'Nombre (Z-A)' :
          sortBy === 'date_asc' ? 'Fecha (Más antiguo)' :
          'Fecha (Más reciente)'
        }`, 
        onClick: () => {
          const nextSort = sortBy === 'name_asc' ? 'name_desc' : 
                          sortBy === 'name_desc' ? 'date_asc' :
                          sortBy === 'date_asc' ? 'date_desc' : 'name_asc'
          setSortBy(nextSort)
        }
      },
      { 
        label: `Tipo: ${filterByType === 'all' ? 'Todos' : contactTypes.find(t => t.id === filterByType)?.name || 'Desconocido'}`, 
        onClick: () => {
          const currentIndex = filterByType === 'all' ? -1 : contactTypes.findIndex(t => t.id === filterByType)
          const nextIndex = (currentIndex + 1) % (contactTypes.length + 1)
          setFilterByType(nextIndex === contactTypes.length ? 'all' : contactTypes[nextIndex].id)
        }
      }
    ],
    onClearFilters: handleClearFilters,
    actions: [
      <Button 
        key="invite"
        variant="outline" 
        className="h-8 px-3 text-sm" 
        onClick={() => {
          // TODO: Implementar funcionalidad de invitar
          toast({
            title: "Función en desarrollo",
            description: "La funcionalidad de invitar a Archub estará disponible pronto",
          })
        }}
      >
        <Send className="w-4 h-4 mr-2" />
        Invitar a Archub
      </Button>,
      <Button 
        key="create"
        className="h-8 px-3 text-sm" 
        onClick={() => setShowCreateModal(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        CREAR CONTACTO
      </Button>
    ]
  }

  if (isLoading || contactsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div>Cargando...</div>
      </Layout>
    )
  }

  if (contacts.length === 0 && !searchValue && filterByType === 'all') {
    return (
      <Layout headerProps={headerProps}>
        <CustomEmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="No hay contactos"
          description="Comienza agregando tu primer contacto a la organización"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              CREAR CONTACTO
            </Button>
          }
        />
        
        {showCreateModal && (
          <NewContactModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['contacts'] })
              setShowCreateModal(false)
            }}
          />
        )}


      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <CustomTable
        data={filteredContacts}
        columns={columns}
        isLoading={contactsLoading}
        emptyState={
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron contactos</p>
            <p className="text-xs text-muted-foreground mt-1">Intenta ajustar los filtros o crear un nuevo contacto</p>
          </div>
        }
        getRowActions={(contact: any) => [
          {
            icon: <Edit className="w-4 h-4" />,
            label: "Editar",
            onClick: () => handleEditContact(contact)
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: "Eliminar", 
            onClick: () => handleDeleteContact(contact),
            variant: "destructive" as const
          }
        ]}
        renderCard={(contact: any) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
          />
        )}
        cardSpacing="space-y-3"
      />

      {/* Modales */}
      {showCreateModal && (
        <NewContactModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            setShowCreateModal(false)
          }}
        />
      )}

      {showEditModal && editingContact && (
        <NewContactModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          contact={editingContact}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            setShowEditModal(false)
            setEditingContact(null)
          }}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
              {contactToDelete && (
                <span className="block mt-2 font-medium">
                  {contactToDelete.full_name || `${contactToDelete.first_name || ''} ${contactToDelete.last_name || ''}`.trim()}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && deleteContactMutation.mutate(contactToDelete.id)}
              disabled={deleteContactMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContactMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}