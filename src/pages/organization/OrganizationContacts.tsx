import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table } from '@/components/ui-custom/Table'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
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
          label: 'Crear Contacto',
          onClick: () => openModal('contact', { isEditing: false }),
          variant: 'primary'
        },
        slot4: {
          id: 'filter',
          label: 'Filtros',
          onClick: () => {
            console.log('Toggle filtros')
          }
        },
        slot5: {
          id: 'clear',
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
      render: (contact: any) => (
          {contact.linked_user ? (
              <AvatarImage src={contact.linked_user.avatar_url} />
              <AvatarFallback>
                {contact.linked_user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
              {contact.first_name?.charAt(0) || 'C'}
            </div>
          )}
          <div>
              {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
            </div>
            {contact.linked_user && (
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
          {contactTypes.find(t => t.id === contact.contact_type_id)?.name || 'Sin tipo'}
        </Badge>
      )
    },
    {
      key: "email" as const,
      label: "Email",
      render: (contact: any) => (
          {contact.email || '—'}
        </div>
      )
    },
    {
      key: "company_name" as const,
      label: "Empresa",
      render: (contact: any) => (
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
          {format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: "actions" as const,
      label: "Acciones",
      sortable: false,
      render: (contact: any) => (
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
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openModal('contact', { editingContact: contact, isEditing: true })
            }}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteContact(contact)
            }}
          >
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
      <Layout>
        <EmptyState
          description="Comienza agregando tu primer contacto a la organización"
        />
      </Layout>
    )
  }

  return (
    <Layout>
        {/* ActionBar Desktop */}
        <ActionBarDesktopRow
          filters={[
            {
              key: 'sort',
              label: 'Ordenar',
              icon: FILTER_ICONS.FILTER,
              value: sortBy === 'name_asc' ? 'Nombre (A-Z)' : 
                     sortBy === 'name_desc' ? 'Nombre (Z-A)' :
                     sortBy === 'date_asc' ? 'Más Antiguos' : 'Más Recientes',
              setValue: (value) => {
                if (value === 'Nombre (A-Z)') setSortBy('name_asc')
                else if (value === 'Nombre (Z-A)') setSortBy('name_desc')
                else if (value === 'Más Antiguos') setSortBy('date_asc')
                else setSortBy('date_desc')
              },
              options: ['Más Antiguos', 'Nombre (A-Z)', 'Nombre (Z-A)'],
              defaultLabel: 'Más Recientes'
            },
            {
              key: 'type',
              label: 'Tipo',
              icon: FILTER_ICONS.TYPE,
              value: filterByType === 'all' ? 'Todos los Tipos' : contactTypes.find(t => t.id === filterByType)?.name || 'Todos los Tipos',
              setValue: (value) => {
                if (value === 'Todos los Tipos') {
                  setFilterByType('all')
                } else {
                  const type = contactTypes.find(t => t.name === value)
                  if (type) setFilterByType(type.id)
                }
              },
              options: ['Arquitecto', 'Ingeniero', 'Constructor', 'Proveedor', 'Cliente'],
              defaultLabel: 'Todos los Tipos'
            }
          ]}
          actions={[
            {
              label: 'Crear contacto',
              icon: Plus,
              onClick: () => openModal('contact', { isEditing: false }),
              variant: 'default'
            }
          ]}
        />

            features={[
              {
                title: "Gestión integral de personas",
                description: "Esta página tiene el rol de agregar cada persona que está vinculada a acciones que suceden en la plataforma, tales como compañeros de trabajo, clientes, asesores, trabajadores y cualquier persona relevante para los proyectos de la organización."
              },
              {
                title: "Vinculación con usuarios de Archub",
                description: "En el caso de que algún contacto estuviera registrado en Archub, se puede vincular ahí mismo de manera tal que se pueda contactar con él y enviarle avisos o información importante directamente a través de la plataforma."
              },
              {
                title: "Base fundamental para otras funciones",
                description: "Es fundamental entender que los contactos se relacionan directamente con la gran mayoría de funciones de la página y por ende, el primer paso muchas veces es aquí. Desde asignar responsables hasta vincular clientes con proyectos."
              },
              {
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
          emptyState={
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