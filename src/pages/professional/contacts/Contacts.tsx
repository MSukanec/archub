import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { useContactTypes } from '@/hooks/use-contact-types'
import { Users, Plus, Edit, Trash2, CheckCircle, Send, Search, Filter, X, UserPlus, Phone, Mail, Share2, Building, MapPin, Globe, Share, ExternalLink, FileText, Contact, Home, Bell } from 'lucide-react'
import { FILTER_ICONS } from '@/constants/actionBarConstants'
import React, { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import ContactRow from '@/components/ui/data-row/rows/ContactRow'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'


import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"
import ContactCardDesktop from '@/components/ui/cards/contacts/ContactCardDesktop'
import { ContactAvatarUploader } from '@/components/contacts/ContactAvatarUploader'
import { ContactAttachmentsPanel } from '@/components/contacts/ContactAttachmentsPanel'

export default function Contacts() {
  const [activeTab, setActiveTab] = useState("personas")
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [showSearch, setShowSearch] = useState(false)
  const { openModal } = useGlobalModalStore()

  const { showDeleteConfirmation } = useDeleteConfirmation()
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setActions, setShowActionBar, clearActions, setFilterConfig } = useActionBarMobile()
  const isMobile = useMobile()
  const [, navigate] = useLocation()

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
            options: contactTypes.map(type => ({ value: type.name.toLowerCase(), label: type.name }))
          }
        ],
        onClearFilters: () => {
          setSearchValue("");
          setFilterByType("all");
          setSortBy('name_asc');
          setShowSearch(false);
        }
      });
    }
  }, [isMobile, contactTypes, filterByType, setFilterConfig]);

  // Limpiar estado cuando cambia la organización
  React.useEffect(() => {
    setSearchValue("")
    setFilterByType('all')
    setSortBy('name_asc')
  }, [userData?.preferences?.last_organization_id])

  const organizationName = userData?.organization?.name || "Organización"

  // Header tabs configuration
  const headerTabs = [
    {
      id: "personas",
      label: "Personas", 
      isActive: activeTab === "personas"
    },
    {
      id: "empresas",
      label: "Empresas",
      isActive: activeTab === "empresas",
      isRestricted: true,
      restrictionReason: "coming_soon" as const
    }
  ]

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

  // Agrupar contactos por letra
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

  // Seleccionar automáticamente el primer contacto cuando cambien los contactos filtrados
  React.useEffect(() => {
    if (filteredContacts.length > 0 && !selectedContact) {
      setSelectedContact(filteredContacts[0])
    }
  }, [filteredContacts, selectedContact])

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
        <div 
          className={`flex items-center gap-3 cursor-pointer p-2 -m-2 rounded-md transition-colors ${
            selectedContact?.id === contact.id ? 'bg-accent/50' : 'hover:bg-muted/50'
          }`}
          onClick={() => setSelectedContact(contact)}
        >
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
      key: "phone" as const,
      label: "Teléfono",
      className: "w-1/5",
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.phone || '—'}
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
    }
  ]

  const getContactRowActions = (contact: any) => [
    {
      label: 'Compartir',
      icon: Share2,
      onClick: () => {
        navigator.clipboard.writeText(`${contact.full_name || `${contact.first_name} ${contact.last_name}`}\nEmail: ${contact.email || 'N/A'}\nTeléfono: ${contact.phone || 'N/A'}\nEmpresa: ${contact.company_name || 'N/A'}`)
        toast({
          title: "Información copiada",
          description: "Los datos del contacto se han copiado al portapapeles"
        })
      }
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: () => openModal('contact', { editingContact: contact, isEditing: true })
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => handleDeleteContact(contact),
      variant: 'destructive' as const
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
          icon: Contact,
          title: "Contactos",
          tabs: headerTabs,
          onTabChange: (tabId: string) => {
            if (tabId === "empresas") {
              return; // No hacer nada si es empresas (restringida)
            }
            setActiveTab(tabId);
          },
          actionButton: {
            label: 'Crear Contacto',
            icon: UserPlus,
            onClick: () => openModal('contact', { isEditing: false })
          }
        }}
      >
        {activeTab === "personas" ? (
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
        ) : (
          <PlanRestricted reason="coming_soon">
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gestión de Empresas</h3>
              <p className="text-muted-foreground">Próximamente podrás gestionar empresas y organizaciones externas</p>
            </div>
          </PlanRestricted>
        )}
      </Layout>
    )
  }

  return (
    <Layout
      wide={true}
      headerProps={{
        icon: Contact,
        title: "Contactos",
        pageTitle: "Contactos",
        breadcrumb: [
          { name: "Organización", href: "/organization/dashboard" },
          { name: "Contactos", href: "/contacts" }
        ],
        tabs: headerTabs,
        onTabChange: (tabId: string) => {
          if (tabId === "empresas") {
            return; // No hacer nada si es empresas (deshabilitada)
          }
          setActiveTab(tabId);
        },
        // Botones de acción del header
        showFilters: true,

        onHeaderClearFilters: () => {
          setSearchValue("");
          setSortBy('name_asc');
          setFilterByType('all');
          setShowSearch(false);
        },
        actionButton: activeTab === "personas" ? {
          label: 'Crear Contacto',
          icon: UserPlus,
          onClick: () => openModal('contact', { isEditing: false })
        } : undefined
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Columna izquierda - Lista de contactos */}
        <div className="col-span-1 overflow-hidden">
          {/* Lista de contactos agrupada por letra */}
          <div className="h-full overflow-y-auto scrollbar-hide">
            {/* Contenido para la tab de Personas */}
            {activeTab === "personas" && (
              <>
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full"></div>
                  </div>
                ) : filteredContacts.length > 0 ? (
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
                            isMobile ? (
                              <ContactRow
                                key={contact.id}
                                contact={contact}
                                onEdit={handleEditContact}
                                onDelete={handleDeleteContact}
                                onClick={(contact) => openModal('contact', { viewingContact: contact })}
                              />
                            ) : (
                              <ContactCardDesktop
                                key={contact.id}
                                contact={contact}
                                onEdit={handleEditContact}
                                onDelete={handleDeleteContact}
                                onClick={setSelectedContact}
                                isSelected={selectedContact?.id === contact.id}
                              />
                            )
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
              </>
            )}

            {/* Contenido para la tab de Empresas - Restringida */}
            {activeTab === "empresas" && (
              <PlanRestricted reason="coming_soon">
                <div className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Gestión de Empresas</h3>
                  <p className="text-muted-foreground">Próximamente podrás gestionar empresas y organizaciones externas</p>
                </div>
              </PlanRestricted>
            )}
          </div>
        </div>

        {/* Columna derecha - Detalles del contacto - Solo visible en desktop */}
        <div className="col-span-1 hidden md:block">
          <Card className="h-full">
            {selectedContact ? (
              <ContactDetailPanel 
                contact={selectedContact} 
                onEdit={() => handleEditContact(selectedContact)}
                onDelete={() => handleDeleteContact(selectedContact)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Selecciona un contacto</h3>
                  <p className="text-muted-foreground">Haz clic en un contacto para ver sus detalles</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Los modales de confirmación ahora se manejan a través del sistema global */}
    </Layout>
  )
}

// Componente para mostrar detalles del contacto
function ContactDetailPanel({ 
  contact, 
  onEdit, 
  onDelete 
}: { 
  contact: any, 
  onEdit: () => void, 
  onDelete: () => void 
}) {
  const displayName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
  
  // Funciones de acción
  const handleCall = () => {
    if (contact.phone) {
      window.open(`tel:${contact.phone}`, '_self')
    }
  }
  
  const handleEmail = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`, '_self')
    }
  }
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: displayName,
        text: `Información de contacto: ${displayName}`,
        url: window.location.href
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 border-b">
        {/* Badges de tipo de contacto superiores izquierda */}
        {contact.contact_types && contact.contact_types.length > 0 && (
          <div className="absolute top-4 left-4 flex gap-1 flex-wrap max-w-[calc(100%-120px)]">
            {contact.contact_types.map((typeLink: any, index: number) => (
              <Badge key={`${typeLink.type_id}-${index}`} variant="secondary" className="text-xs bg-background/80 hover:bg-background dark:bg-background/80 dark:hover:bg-background">
                {typeLink.contact_type?.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Botones de acción superiores */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 bg-background/80 hover:bg-background dark:bg-background/80 dark:hover:bg-background">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 bg-background/80 hover:bg-background dark:bg-background/80 dark:hover:bg-background">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Avatar y información principal */}
        <div className="flex flex-col items-center text-center space-y-4">
          {contact.linked_user ? (
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              <AvatarImage src={contact.linked_user.avatar_url} />
              <AvatarFallback className="text-2xl font-semibold bg-accent text-accent-foreground">
                {contact.linked_user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <ContactAvatarUploader 
              contactId={contact.id} 
              contact={contact}
            />
          )}
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {displayName}
            </h2>
            
            {contact.linked_user && (
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Usuario de Archub</span>
              </div>
            )}
          </div>

          {/* Botones de acción principales */}
          <div className="flex gap-2 pt-2">
            {contact.phone && (
              <Button onClick={handleCall} variant="default" size="icon" title="Llamar" className="rounded-full">
                <Phone className="w-4 h-4" />
              </Button>
            )}
            {contact.email && (
              <Button onClick={handleEmail} variant="default" size="icon" title="Email" className="rounded-full">
                <Mail className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleShare} variant="default" size="icon" title="Compartir" className="rounded-full">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Información en cards */}
      <div className="p-6 space-y-6">
        {/* Grid de información básica - 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Email */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-sm truncate" title={contact.email || '-'}>
                  {contact.email || '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Teléfono */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium text-sm truncate" title={contact.phone || '-'}>
                  {contact.phone || '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Dirección */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="font-medium text-sm truncate" title={contact.address || '-'}>
                  {contact.address || '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* País */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">País</p>
                <p className="font-medium text-sm truncate" title={contact.country || '-'}>
                  {contact.country || '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Información adicional */}
        {(contact.company_name || contact.notes) && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información Adicional
            </h3>
            
            {contact.company_name && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Building className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="font-medium text-sm">{contact.company_name}</p>
                  </div>
                </div>
              </Card>
            )}

            {contact.notes && (
              <Card className="p-4">
                <h4 className="font-medium text-sm mb-2">Notas</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {contact.notes}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Archivos y Media */}
        <div className="space-y-4">
          <ContactAttachmentsPanel 
            contactId={contact.id} 
            contact={contact}
          />
        </div>
      </div>
    </div>
  )
}