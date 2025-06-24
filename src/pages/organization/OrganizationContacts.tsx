import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
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
import { Users, Plus, Mail, Phone, Building, MapPin, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewContactModal } from '@/modals/NewContactModal'
import { CustomTable } from '@/components/ui-custom/CustomTable'

export default function OrganizationContacts() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterByType, setFilterByType] = useState('all')
  const [editingContact, setEditingContact] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<any>(null)
  const [newContactModalOpen, setNewContactModalOpen] = useState(false)
  
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

  // Configuración de columnas para la tabla
  const columns = [
    {
      key: 'full_name',
      label: 'Contacto',
      width: '20%',
      render: (contact: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-muted">
              {`${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">
              {contact.first_name} {contact.last_name}
            </div>
          </div>
        </div>
      ),
      sortType: 'string' as const
    },
    {
      key: 'email',
      label: 'Email',
      width: '20%',
      render: (contact: any) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span className="truncate">{contact.email}</span>
        </div>
      ),
      sortType: 'string' as const
    },
    {
      key: 'phone',
      label: 'Teléfono',
      width: '15%',
      render: (contact: any) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="w-3 h-3" />
          <span>{contact.phone || 'Sin teléfono'}</span>
        </div>
      ),
      sortType: 'string' as const
    },
    {
      key: 'contact_type',
      label: 'Tipo',
      width: '15%',
      render: (contact: any) => (
        <Badge variant="outline" className="text-xs">
          {contact.contact_type?.name || 'Sin tipo'}
        </Badge>
      ),
      sortType: 'string' as const
    },
    {
      key: 'company_location',
      label: 'Empresa/Ubicación',
      render: (contact: any) => (
        <div className="text-xs">
          {contact.company_name && (
            <div className="flex items-center gap-1 mb-1">
              <Building className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{contact.company_name}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">{contact.location}</span>
            </div>
          )}
        </div>
      ),
      sortType: 'string' as const
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (contact: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingContact(contact)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setContactToDelete(contact)
                setDeleteDialogOpen(true)
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      sortable: false
    }
  ];

  return (
    <Layout headerProps={headerProps}>
      <CustomTable
        columns={columns}
        data={filteredContacts}
        isLoading={contactsLoading}
        emptyState={
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No hay contactos en esta organización.</p>
            <p className="text-xs">Los contactos aparecerán aquí cuando los agregues.</p>
          </div>
        }
      />

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
    </Layout>
  )
}