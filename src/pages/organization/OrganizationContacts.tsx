import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import CustomTable from '@/components/ui-custom/misc/CustomTable'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { Users, Plus, Edit, Trash2, Mail, Phone, Building, MapPin, MessageCircle, CheckCircle } from 'lucide-react'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewContactModal } from '@/modals/contacts/NewContactModal'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'

export default function OrganizationContacts() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<any>(null)
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Lista hardcoded de tipos de contacto
  const contactTypes = [
    { id: 'arquitecto', name: 'Arquitecto' },
    { id: 'ingeniero', name: 'Ingeniero' },
    { id: 'constructor', name: 'Constructor' },
    { id: 'proveedor', name: 'Proveedor' },
    { id: 'cliente', name: 'Cliente' }
  ]

  // Limpiar estado cuando cambia la organización
  React.useEffect(() => {
    setSelectedContact(null)
    setSearchValue("")
    setFilterByType('all')
    setSortBy('name_asc')
  }, [userData?.preferences?.last_organization_id])

  // Seleccionar el primer contacto si no hay uno seleccionado
  React.useEffect(() => {
    if (contacts.length > 0 && !selectedContact) {
      setSelectedContact(contacts[0])
    }
  }, [contacts, selectedContact])

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

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact)
  }

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact)
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
      if (selectedContact?.id === contactToDelete?.id) {
        setSelectedContact(null)
      }
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

  if (isLoading || contactsLoading) {
    return (
      <Layout
        headerProps={{
          title: "Contactos",
          description: "Gestiona los contactos de tu organización",
          icon: Users,
          breadcrumb: [
            { label: organizationName, href: "/organization/dashboard" },
            { label: "Contactos", href: "/organization/contacts" }
          ]
        }}
      >
        <div>Cargando...</div>
      </Layout>
    )
  }

  if (contacts.length === 0 && !searchValue && filterByType === 'all') {
    return (
      <Layout
        headerProps={{
          title: "Contactos",
          description: "Gestiona los contactos de tu organización",
          icon: Users,
          breadcrumb: [
            { label: organizationName, href: "/organization/dashboard" },
            { label: "Contactos", href: "/organization/contacts" }
          ]
        }}
      >
        <CustomEmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="No hay contactos"
          description="Comienza agregando tu primer contacto a la organización"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contacto
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
    <Layout
      headerProps={{
        title: "Contactos",
        description: "Gestiona los contactos de tu organización",
        icon: Users,
        breadcrumb: [
          { label: organizationName, href: "/organization/dashboard" },
          { label: "Contactos", href: "/organization/contacts" }
        ]
      }}
    >
      <div className="space-y-6">
        {/* Detalle del contacto seleccionado */}
        {selectedContact && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card de información básica */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground border border-border flex items-center justify-center text-lg font-medium">
                      {selectedContact.first_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {selectedContact.full_name || `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim()}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground">
                          {contactTypes.find(t => t.id === selectedContact.contact_type_id)?.name || 'Sin tipo'}
                        </p>
                        {selectedContact.linked_user && (
                          <Badge variant="secondary" className="text-xs bg-green-50 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Usuario de Archub
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditContact(selectedContact)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteContact(selectedContact)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Empresa</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedContact.company_name || 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ubicación</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedContact.location || 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Notas</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedContact.notes || 'Sin notas'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de usuario vinculado */}
            {selectedContact.linked_user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Usuario de Archub Vinculado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedContact.linked_user.avatar_url} />
                      <AvatarFallback>
                        {selectedContact.linked_user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {selectedContact.linked_user.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedContact.linked_user.email}
                      </div>
                      {selectedContact.linked_user.organization_members?.[0]?.organizations?.name && (
                        <div className="text-sm text-muted-foreground">
                          Organización: {selectedContact.linked_user.organization_members[0].organizations.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Este contacto está vinculado con un usuario de Archub. Los campos de nombre y email se sincronizan automáticamente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card de métodos de contacto */}
            <Card className={selectedContact.linked_user ? "md:col-span-2" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Métodos de Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedContact.email && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enviar email
                      </Button>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Llamar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de información adicional */}
            <Card className={selectedContact.linked_user ? "md:col-span-2" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Información Adicional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Creado el {format(new Date(selectedContact.created_at), 'dd/MM/yyyy', { locale: es })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla de contactos */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lista de Contactos</CardTitle>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contacto
              </Button>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium">Buscar</Label>
                <input
                  id="search"
                  type="text"
                  placeholder="Buscar contactos..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                />
              </div>
              <div>
                <Label htmlFor="sort-select" className="text-sm font-medium">Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                    <SelectItem value="date_asc">Fecha (Más antiguo)</SelectItem>
                    <SelectItem value="date_desc">Fecha (Más reciente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-select" className="text-sm font-medium">Tipo</Label>
                <Select value={filterByType} onValueChange={setFilterByType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {contactTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <CustomTable
              data={filteredContacts}
              columns={columns}
              isLoading={contactsLoading}
              onCardClick={handleSelectContact}
              emptyState={
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron contactos</p>
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
            />
          </CardContent>
        </Card>
      </div>

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

      {showEditModal && selectedContact && (
        <NewContactModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          contact={selectedContact}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            setShowEditModal(false)
            setSelectedContact(null)
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