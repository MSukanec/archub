import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { useContactTypes } from '@/hooks/use-contact-types'
import { Users, Plus, Mail, Phone, Building, MapPin, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewContactModal } from '@/modals/NewContactModal'

export default function OrganizationContacts() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const [editingContact, setEditingContact] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<any>(null)
  const [newContactModalOpen, setNewContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(userData?.organization?.id)
  const { data: contactTypes = [] } = useContactTypes()
  const { toast } = useToast()
  const queryClient = useQueryClient()

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
  }, [contacts, searchValue, filterByType, sortBy])

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact)
  }

  const handleEditClick = (contact: any) => {
    setEditingContact(contact)
    setNewContactModalOpen(true)
  }

  const handleDeleteClick = (contact: any) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase) throw new Error('Supabase no disponible')
      
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
      
      // Si el contacto eliminado estaba seleccionado, limpiar la selección
      if (selectedContact?.id === contactToDelete?.id) {
        setSelectedContact(null)
      }
      
      setContactToDelete(null)
      setDeleteDialogOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contacto.",
        variant: "destructive"
      })
    }
  })

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      deleteMutation.mutate(contactToDelete.id)
    }
  }

  const clearFilters = () => {
    setSearchValue("")
    setSortBy('name_asc')
    setFilterByType('all')
  }

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank')
  }

  // Filtros personalizados para el header
  const customFilters = (
    <div className="space-y-4 w-72">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
            <SelectItem value="date_desc">Más recientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Filtrar por tipo</Label>
        <Select value={filterByType} onValueChange={setFilterByType}>
          <SelectTrigger>
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
  )

  const actions = [
    <Button 
      key="new-contact"
      className="h-8 px-3 text-sm"
      onClick={() => setNewContactModalOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Contacto
    </Button>
  ]

  const headerProps = {
    icon: Users,
    title: "Contactos",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
  }

  if (isLoading || contactsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando contactos...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="flex h-full">
        {/* Columna izquierda - Lista de contactos (33%) */}
        <div className="w-1/3 border-r">
          <div className="space-y-1 p-2">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedContact?.id === contact.id ? 'bg-accent' : ''
                }`}
                onClick={() => handleSelectContact(contact)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {contact.first_name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {contact.contact_type?.name || 'Sin tipo'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay contactos</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha - Detalles del contacto (67%) */}
        <div className="flex-1 p-6">
          {selectedContact ? (
            <div className="space-y-6">
              {/* Card superior con información general y botones de acción */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-medium">
                        {selectedContact.first_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim()}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          {selectedContact.contact_type?.name || 'Sin tipo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(selectedContact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteClick(selectedContact)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Card de métodos de contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métodos de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedContact.email && (
                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEmail(selectedContact.email)}
                    >
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">{selectedContact.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedContact.phone && (
                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleWhatsApp(selectedContact.phone)}
                    >
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-sm text-muted-foreground">{selectedContact.phone}</div>
                      </div>
                    </div>
                  )}

                  {!selectedContact.email && !selectedContact.phone && (
                    <p className="text-sm text-muted-foreground">No hay métodos de contacto disponibles</p>
                  )}
                </CardContent>
              </Card>

              {/* Card de información de la empresa */}
              {(selectedContact.company || selectedContact.location) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de la Empresa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedContact.company && (
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Empresa</div>
                          <div className="text-sm text-muted-foreground">{selectedContact.company}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedContact.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Ubicación</div>
                          <div className="text-sm text-muted-foreground">{selectedContact.location}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Card de notas */}
              {selectedContact.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedContact.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona un contacto para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Dialog para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el contacto permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para crear/editar contacto */}
      <NewContactModal
        open={newContactModalOpen}
        onClose={() => {
          setNewContactModalOpen(false)
          setEditingContact(null)
        }}
        editingContact={editingContact}
      />
    </Layout>
  )
}