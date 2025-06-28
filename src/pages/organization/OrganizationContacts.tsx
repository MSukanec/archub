import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { Users, Plus, Edit, Trash2, Mail, Phone, Building, MapPin, MessageCircle } from 'lucide-react'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewContactModal } from '@/modals/NewContactModal'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { CustomButton } from '@/components/ui-custom/misc/CustomButton'

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
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(userData?.organization?.id)
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

  // Filtrar y ordenar contactos
  const filteredContacts = React.useMemo(() => {
    let filtered = contacts.filter((contact: any) => {
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      const matchesSearch = !searchValue || 
        (fullName.toLowerCase().includes(searchValue.toLowerCase()) ||
         contact.first_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
         contact.last_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
         contact.email?.toLowerCase().includes(searchValue.toLowerCase()))
      
      const matchesType = filterByType === 'all' || contact.contact_type_id === filterByType
      
      return matchesSearch && matchesType
    })

    // Ordenar
    if (sortBy === 'name_asc') {
      filtered.sort((a: any, b: any) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim()
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim()
        return nameA.localeCompare(nameB)
      })
    } else if (sortBy === 'name_desc') {
      filtered.sort((a: any, b: any) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim()
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim()
        return nameB.localeCompare(nameA)
      })
    } else if (sortBy === 'date_desc') {
      filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return filtered
  }, [contacts, searchValue, sortBy, filterByType])

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact)
  }

  const handleClearFilters = () => {
    setSearchValue("")
    setFilterByType('all')
    setSortBy('name_asc')
  }

  const handleEditContact = () => {
    setShowEditModal(true)
  }

  const handleDeleteContact = () => {
    setContactToDelete(selectedContact)
    setShowDeleteDialog(true)
  }

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase) throw new Error('Supabase no está disponible')
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado correctamente."
      })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setSelectedContact(null)
      setShowDeleteDialog(false)
      setContactToDelete(null)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el contacto. " + error.message
      })
    }
  })

  const handleWhatsApp = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  const handleEmail = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`, '_blank')
    }
  }

  // Mostrar CustomEmptyState si no hay contactos
  if (filteredContacts.length === 0 && !isLoading && !contactsLoading) {
    return (
      <Layout wide={true} headerProps={{
        title: "Contactos",
        showSearch: true,
        searchValue,
        onSearchChange: setSearchValue,
        customFilters: (
          <div className="flex flex-col gap-3 p-3 w-72">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sort" className="text-xs font-medium">Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                  <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                  <SelectItem value="date_desc">Más recientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type" className="text-xs font-medium">Filtrar por tipo</Label>
              <Select value={filterByType} onValueChange={setFilterByType}>
                <SelectTrigger className="h-8">
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
        ),
        onClearFilters: handleClearFilters,
        actions: [
          <CustomButton 
            key="new" 
            size="md" 
            variant="primary"
            icon={<Plus className="w-3 h-3" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo Contacto
          </CustomButton>
        ]
      }}>
        <CustomEmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title="No hay contactos"
          description="Comienza agregando tu primer contacto a la organización"
          action={
            <CustomButton 
              variant="primary"
              size="md"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => setShowCreateModal(true)}
            >
              Nuevo Contacto
            </CustomButton>
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
    <Layout wide={true} headerProps={{
      title: "Contactos",
      showSearch: true,
      searchValue,
      onSearchChange: setSearchValue,
      customFilters: (
        <div className="flex flex-col gap-3 p-3 w-72">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sort" className="text-xs font-medium">Ordenar por</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                <SelectItem value="date_desc">Más recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type" className="text-xs font-medium">Filtrar por tipo</Label>
            <Select value={filterByType} onValueChange={setFilterByType}>
              <SelectTrigger className="h-8">
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
      ),
      onClearFilters: handleClearFilters,
      actions: [
        <Button key="new" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contacto
        </Button>
      ]
    }}>
      <div className="flex gap-6 h-full">
        {/* Columna izquierda - Lista de contactos (33%) */}
        <div className="w-1/3 border-r border-border pr-6">
          <div className="space-y-2">
            {filteredContacts.map((contact: any) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-accent border-accent-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => handleSelectContact(contact)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium">
                      {contact.first_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {contactTypes.find(t => t.id === contact.contact_type_id)?.name || 'Sin tipo'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha - Detalles del contacto (67%) */}
        <div className="flex-1">
          {selectedContact ? (
            <div className="space-y-6">
              {/* Card superior con información general y botones de acción */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground border border-border flex items-center justify-center text-lg font-medium">
                        {selectedContact.first_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim()}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          {contactTypes.find(t => t.id === selectedContact.contact_type_id)?.name || 'Sin tipo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEditContact}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteContact}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Creado el {format(new Date(selectedContact.created_at), 'dd/MM/yyyy', { locale: es })}
                  </div>
                </CardContent>
              </Card>

              {/* Card de métodos de contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métodos de Contacto</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedContact.email || selectedContact.phone ? (
                    <div className="space-y-3">
                      {selectedContact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedContact.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmail(selectedContact.email)}
                            className="ml-auto h-7 px-2 text-xs"
                          >
                            Enviar email
                          </Button>
                        </div>
                      )}
                      {selectedContact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedContact.phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsApp(selectedContact.phone)}
                            className="ml-auto h-7 px-2 text-xs"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No hay métodos de contacto disponibles</p>
                  )}
                </CardContent>
              </Card>

              {/* Card de información de empresa */}
              {(selectedContact.company || selectedContact.location || selectedContact.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedContact.company && (
                        <div className="flex items-center gap-3">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedContact.company}</span>
                        </div>
                      )}
                      {selectedContact.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedContact.location}</span>
                        </div>
                      )}
                      {selectedContact.notes && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Notas</h4>
                          <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Selecciona un contacto para ver los detalles</p>
            </div>
          )}
        </div>
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

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el contacto
              {contactToDelete && ` "${contactToDelete.first_name} ${contactToDelete.last_name}"`}
              de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && deleteMutation.mutate(contactToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}