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
  const organizationId = userData?.preferences?.last_organization_id

  const { data: contactsData, isLoading: contactsLoading } = useContacts(organizationId)
  const contacts = contactsData?.contacts || []
  const contactTypes = contactsData?.contactTypes || []

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setSearchValue("")
    setSortBy('name_asc')
    setFilterByType('all')
  }

  // Filtros aplicados
  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = contact.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                           contact.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
                           contact.company?.toLowerCase().includes(searchValue.toLowerCase())
      const matchesType = filterByType === 'all' || contact.contact_type_id === filterByType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return (b.full_name || '').localeCompare(a.full_name || '')
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: // name_asc
          return (a.full_name || '').localeCompare(b.full_name || '')
      }
    })

  // Mutación para eliminar contacto
  const deleteContactMutation = useMutation({
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
        description: "El contacto ha sido eliminado correctamente.",
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
        description: "No se pudo eliminar el contacto. Inténtalo de nuevo.",
        variant: "destructive",
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
      <div className="flex items-center justify-center min-h-[400px]">
        <CustomEmptyState
          title="No hay contactos"
          description="Comienza agregando tu primer contacto a la organización"
          actionText="Nuevo contacto"
          onAction={() => setShowCreateModal(true)}
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Lista de contactos - 33% */}
      <div className="col-span-4 border-r pr-4">
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <Card 
              key={contact.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedContact?.id === contact.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                    {contact.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{contact.full_name}</h3>
                    {contact.email && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{contact.email}</p>
                    )}
                    {contact.company && (
                      <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {contact.contact_types?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {contact.contact_types.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detalles del contacto - 67% */}
      <div className="col-span-8">
        {selectedContact ? (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-lg">
                    {selectedContact.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedContact.full_name}</CardTitle>
                    {selectedContact.contact_types?.name && (
                      <Badge variant="secondary" className="mt-1">
                        {selectedContact.contact_types.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContact(selectedContact)
                      setShowEditModal(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setContactToDelete(selectedContact)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-base">Información de contacto</h3>
                  
                  {selectedContact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{selectedContact.email}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmail(selectedContact.email)}
                            className="h-6 px-2"
                          >
                            Enviar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedContact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Teléfono</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{selectedContact.phone}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsApp(selectedContact.phone)}
                            className="h-6 px-2"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-base">Información adicional</h3>
                  
                  {selectedContact.company && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Empresa</p>
                        <p className="font-medium">{selectedContact.company}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedContact.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ubicación</p>
                        <p className="font-medium">{selectedContact.location}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Agregado el</p>
                      <p className="font-medium">
                        {format(new Date(selectedContact.created_at), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedContact.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-base mb-3">Notas</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedContact.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Selecciona un contacto
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Elige un contacto de la lista para ver sus detalles
              </p>
            </div>
          </div>
        )}
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

      {showEditModal && (
        <NewContactModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          editingContact={selectedContact}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            setShowEditModal(false)
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && deleteContactMutation.mutate(contactToDelete.id)}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}