import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useContacts } from '@/hooks/use-contacts'
import { useContactTypes } from '@/hooks/use-contact-types'
import { Users, Plus, Mail, Phone, Building, MapPin, MoreHorizontal, Edit, Trash2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewContactModal } from '@/modals/NewContactModal'
import { ContactModal } from '@/modals/ContactModal'

export default function OrganizationContacts() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const [editingContact, setEditingContact] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<any>(null)
  const [newContactModalOpen, setNewContactModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(userData?.organization?.id)
  const { data: contactTypes = [] } = useContactTypes()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrar y ordenar contactos
  let filteredContacts = contacts?.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchValue.toLowerCase()) || 
                         contact.email.toLowerCase().includes(searchValue.toLowerCase()) ||
                         contact.company_name?.toLowerCase().includes(searchValue.toLowerCase()) || ''
    
    if (filterByType === "all") return matchesSearch
    return matchesSearch && contact.contact_type_id === filterByType
  }) || []

  // Aplicar ordenamiento
  filteredContacts = [...filteredContacts].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      case 'name_desc':
        return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`)
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date_oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'company_asc':
        return (a.company_name || '').localeCompare(b.company_name || '')
      case 'company_desc':
        return (b.company_name || '').localeCompare(a.company_name || '')
      default:
        return 0
    }
  })

  const handleEdit = (contact: any) => {
    setEditingContact(contact)
    setNewContactModalOpen(true)
  }

  const handleContact = (contact: any) => {
    setSelectedContact(contact)
    setContactModalOpen(true)
  }

  const handleDeleteClick = (contact: any) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  const clearFilters = () => {
    setSearchValue("")
    setSortBy('name_asc')
    setFilterByType('all')
  }

  const getContactTypeLabel = (typeId: string) => {
    const type = contactTypes.find(t => t.id === typeId)
    return type?.name || 'Sin especificar'
  }

  // Filtros personalizados
  const customFilters = (
    <div className="w-64 p-3 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[var(--menues-fg)] opacity-70">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
            <SelectItem value="company_asc">Empresa (A-Z)</SelectItem>
            <SelectItem value="company_desc">Empresa (Z-A)</SelectItem>
            <SelectItem value="date_recent">Fecha (Más reciente)</SelectItem>
            <SelectItem value="date_oldest">Fecha (Más antigua)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[var(--menues-fg)] opacity-70">Filtrar por tipo</Label>
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
      <div className="space-y-6">
        {/* Headers de columnas */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-3">Contacto</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">Teléfono</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Empresa</div>
          <div className="col-span-1">Acciones</div>
        </div>

        {/* Lista de contactos */}
        <div className="space-y-2">
          {filteredContacts.map((contact) => {
            return (
              <Card 
                key={contact.id} 
                className="w-full transition-all hover:shadow-sm border"
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Contacto */}
                    <div className="col-span-3 flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {(contact.first_name.charAt(0) + contact.last_name.charAt(0)).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {contact.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {contact.email}
                      </span>
                    </div>

                    {/* Teléfono */}
                    <div className="col-span-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {contact.phone || 'Sin especificar'}
                      </span>
                    </div>

                    {/* Tipo */}
                    <div className="col-span-2">
                      <Badge variant="outline" className="text-xs">
                        {getContactTypeLabel(contact.contact_type_id)}
                      </Badge>
                    </div>

                    {/* Empresa */}
                    <div className="col-span-2 flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {contact.company_name || 'Sin especificar'}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1 flex justify-start">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {(contact.email || contact.phone) && (
                            <DropdownMenuItem onClick={() => handleContact(contact)}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Contactar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(contact)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-sm font-medium mb-1">No se encontraron contactos</h3>
              <p className="text-xs">
                {searchValue || filterByType !== 'all' 
                  ? 'Prueba ajustando los filtros de búsqueda' 
                  : 'Comienza agregando tu primer contacto'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el contacto "{contactToDelete?.first_name} {contactToDelete?.last_name}". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // TODO: Implementar eliminación
                setDeleteDialogOpen(false)
                setContactToDelete(null)
              }}
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

      <ContactModal
        contact={selectedContact}
        open={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false)
          setSelectedContact(null)
        }}
      />
    </Layout>
  )
}