import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table } from '@/components/ui-custom/Table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { useContactTypes } from '@/hooks/use-contact-types'
import { Users, Plus, Edit, Trash2, CheckCircle, Send, Search, Filter, X, UserPlus, Building, Phone, Mail, Share2, UserCheck } from 'lucide-react'
import { SelectableGhostButton } from '@/components/ui-custom/SelectableGhostButton'
import { FILTER_ICONS } from '@/constants/actionBarConstants'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import ContactCard from '@/components/cards/ContactCard'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import { useMobile } from '@/hooks/use-mobile'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'

export default function OrganizationContacts() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const { openModal } = useGlobalModalStore()

  const { showDeleteConfirmation } = useDeleteConfirmation()
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setActions, setShowActionBar, clearActions } = useMobileActionBar()
  const isMobile = useMobile()

  // Cargar tipos de contacto de la base de datos
  const { data: contactTypes = [] } = useContactTypes()

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
          onClick: () => openModal('contact', { isEditing: false }),
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
      clearActions()
    }
  }, [isMobile])

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
      filtered = filtered.filter(contact => 
        contact.contact_types && contact.contact_types.some((type: any) => type.name.toLowerCase() === filterByType)
      )
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

        default:
          return 0
      }
    })

    return filtered
  }, [contacts, searchValue, filterByType, sortBy])

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
      
      // Invalidar ambas claves de caché para contactos
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['organization-contacts'] })
      
      // Modal se cierra automáticamente
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
      className: "w-1/5",
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
      key: "contact_types" as const,
      label: "Tipos",
      className: "w-1/5",
      render: (contact: any) => (
        <div className="flex flex-wrap gap-1">
          {contact.contact_types && contact.contact_types.length > 0 ? (
            contact.contact_types.map((type: any) => (
              <Badge key={type.id} variant="secondary" className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md border">
                {type.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin tipo</span>
          )}
        </div>
      )
    },
    {
      key: "email" as const,
      label: "Email",
      className: "w-1/5",
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.email || '—'}
        </div>
      )
    },
    {
      key: "company_name" as const,
      label: "Empresa",
      className: "w-1/5",
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.company_name || '—'}
        </div>
      )
    },

    {
      key: "actions" as const,
      label: "Acciones",
      sortable: false,
      className: "w-1/5",
      render: (contact: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(`${contact.full_name || `${contact.first_name} ${contact.last_name}`}\nEmail: ${contact.email || 'N/A'}\nTeléfono: ${contact.phone || 'N/A'}\nEmpresa: ${contact.company_name || 'N/A'}`)
              toast({
                title: "Información copiada",
                description: "Los datos del contacto se han copiado al portapapeles"
              })
            }}
            className="h-8 w-8 p-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openModal('contact', { editingContact: contact, isEditing: true })
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteContact(contact)
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]



  if (isLoading || contactsLoading) {
    return (
      <Layout>
        <div>Cargando...</div>
      </Layout>
    )
  }

  if (contacts.length === 0 && !searchValue && filterByType === 'all') {
    return (
      <Layout
        headerProps={{
          icon: Users,
          title: "Contactos",
          actionButton: {
            label: 'Crear Contacto',
            icon: UserPlus,
            onClick: () => openModal('contact', { isEditing: false })
          }
        }}
      >
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="No hay contactos"
          description="Comienza agregando tu primer contacto a la organización"
        />
      </Layout>
    )
  }

  return (
    <Layout
      headerProps={{
        icon: Users,
        title: "Contactos",
        actionButton: {
          label: 'Crear Contacto',
          icon: UserPlus,
          onClick: () => openModal('contact', { isEditing: false })
        }
      }}
    >
      <div className="space-y-6">


        {/* FeatureIntroduction - Solo mobile */}
        <div className="md:hidden">
          <FeatureIntroduction
            title="Contactos"
            icon={<Users className="w-5 h-5" />}
            features={[
              {
                icon: <Building className="w-5 h-5" />,
                title: "Gestión integral de personas",
                description: "Esta página tiene el rol de agregar cada persona que está vinculada a acciones que suceden en la plataforma, tales como compañeros de trabajo, clientes, asesores, trabajadores y cualquier persona relevante para los proyectos de la organización."
              },
              {
                icon: <UserCheck className="w-5 h-5" />,
                title: "Vinculación con usuarios de Archub",
                description: "En el caso de que algún contacto estuviera registrado en Archub, se puede vincular ahí mismo de manera tal que se pueda contactar con él y enviarle avisos o información importante directamente a través de la plataforma."
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Base fundamental para otras funciones",
                description: "Es fundamental entender que los contactos se relacionan directamente con la gran mayoría de funciones de la página y por ende, el primer paso muchas veces es aquí. Desde asignar responsables hasta vincular clientes con proyectos."
              },
              {
                icon: <Share2 className="w-5 h-5" />,
                title: "Compartir información fácilmente",
                description: "Se puede compartir información de un contacto (como el teléfono, el mail, empresa, etc.) muy fácilmente haciendo click en el botón 'Compartir Información' de las acciones, copiando automáticamente los datos al portapapeles."
              }
            ]}
          />
        </div>

        <Table
          data={filteredContacts}
          columns={columns}
          isLoading={contactsLoading}
          defaultSort={{
            key: "name",
            direction: "asc",
          }}
          topBar={{
            showSearch: true,
            searchValue: searchValue,
            onSearchChange: setSearchValue,
            showFilter: true,
            isFilterActive: sortBy !== 'name_asc' || filterByType !== 'all',
            renderFilterContent: () => (
              <div className="space-y-3 p-2 min-w-[200px]">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Ordenar</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Más Recientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Tipo</Label>
                  <Select value={filterByType} onValueChange={setFilterByType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos los Tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Tipos</SelectItem>
                      {contactTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.name.toLowerCase()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ),
            onClearFilters: () => {
              setSearchValue("");
              setSortBy('name_asc');
              setFilterByType('all');
            }
          }}
          emptyState={
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No se encontraron contactos</p>
              <p className="text-xs text-muted-foreground mt-1">Intenta ajustar los filtros o crear un nuevo contacto</p>
            </div>
          }
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
      </div>

      {/* Los modales de confirmación ahora se manejan a través del sistema global */}
    </Layout>
  )
}