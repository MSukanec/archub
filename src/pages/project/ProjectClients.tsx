import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Users, Plus, Trash2, UserPlus, Handshake, CreditCard, UserCheck, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DangerousConfirmationModal } from '@/components/ui-custom/DangerousConfirmationModal'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState'

interface Contact {
  id: string
  first_name: string
  last_name: string
  company_name: string
  email: string
  phone: string
  full_name: string
}

interface ProjectClient {
  id: string
  project_id: string
  client_id: string
  committed_amount: number
  currency_id: string
  role: string
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
  contact: Contact
}

export default function ProjectClients() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<ProjectClient | null>(null)

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.organization?.id

  // Get organization contacts
  const { data: organizationContacts } = useQuery({
    queryKey: ['organization-contacts', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone,
          full_name
        `)
        .eq('organization_id', organizationId)
        .order('first_name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Get project clients
  const { data: projectClients, isLoading: loadingClients } = useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) throw new Error('Missing required parameters')
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          contact:contacts!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            full_name
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .eq('contact.organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Sort clients alphabetically by name
      const sortedData = (data || []).sort((a, b) => {
        const nameA = a.contact?.company_name || 
                     `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim()
        const nameB = b.contact?.company_name || 
                     `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim()
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
      })
      
      return sortedData
    },
    enabled: !!projectId && !!organizationId && !!supabase
  })

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('project_clients')
        .insert({
          project_id: projectId,
          client_id: contactId,
          committed_amount: 0,
          role: 'cliente',
          is_active: true,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Cliente agregado",
        description: "El cliente ha sido agregado al proyecto exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ['project-clients', projectId] })
      setShowAddClientModal(false)
      setSelectedContactId('')
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar cliente",
        description: error.message || "Hubo un problema al agregar el cliente",
        variant: "destructive",
      })
    }
  })

  // Remove client mutation
  const removeClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { error } = await supabase
        .from('project_clients')
        .update({ is_active: false })
        .eq('id', clientId)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Cliente removido",
        description: "El cliente ha sido removido del proyecto",
      })
      queryClient.invalidateQueries({ queryKey: ['project-clients', projectId] })
    },
    onError: (error: any) => {
      toast({
        title: "Error al remover cliente",
        description: error.message || "Hubo un problema al remover el cliente",
        variant: "destructive",
      })
    }
  })

  const handleAddClient = () => {
    if (!selectedContactId) return
    addClientMutation.mutate(selectedContactId)
  }

  const handleRemoveClient = (client: ProjectClient) => {
    setClientToDelete(client)
    setShowDeleteModal(true)
  }

  const confirmRemoveClient = () => {
    if (clientToDelete) {
      removeClientMutation.mutate(clientToDelete.id)
      setShowDeleteModal(false)
      setClientToDelete(null)
    }
  }

  // Get available contacts (not already clients)
  const availableContacts = organizationContacts?.filter(contact => 
    !projectClients?.some(client => client.client_id === contact.id)
  ) || []

  const headerProps = {
    title: "Clientes del Proyecto",
    actions: [(
      <Dialog key="add-client" open={showAddClientModal} onOpenChange={setShowAddClientModal}>
        <DialogTrigger asChild>
          <Button className="h-8 px-3 text-sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar Cliente
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Cliente al Proyecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Contacto</label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un contacto" />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts.map(contact => {
                    const displayName = contact.company_name || 
                                     `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                    return (
                      <SelectItem key={contact.id} value={contact.id}>
                        {displayName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddClientModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddClient} 
                disabled={!selectedContactId || addClientMutation.isPending}
              >
                {addClientMutation.isPending ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )]
  }

  if (isLoading || loadingClients) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando clientes...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Gestión de Clientes del Proyecto"
          icon={<Handshake className="h-6 w-6" />}
          features={[
            {
              icon: <UserCheck className="h-4 w-4" />,
              title: "Vincular Contactos al Proyecto",
              description: "Agrega contactos de tu organización como clientes del proyecto actual para un control detallado."
            },
            {
              icon: <CreditCard className="h-4 w-4" />,
              title: "Gestión de Compromisos Financieros",
              description: "Administra los montos comprometidos por cada cliente y configura las monedas correspondientes."
            },
            {
              icon: <Users className="h-4 w-4" />,
              title: "Roles y Permisos",
              description: "Asigna roles específicos a cada cliente y controla su nivel de acceso a la información del proyecto."
            },
            {
              icon: <TrendingUp className="h-4 w-4" />,
              title: "Seguimiento de Aportes",
              description: "Conecta automáticamente los aportes financieros con los clientes correspondientes para un seguimiento completo."
            }
          ]}
        />

        {/* Project Clients Card - Only show when there are clients */}
        {projectClients && projectClients.length > 0 && (
          <Card>
            <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Clientes Activos</h3>
                <div className="text-sm text-muted-foreground">
                  {projectClients?.length || 0} cliente{projectClients?.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="space-y-3">
                {projectClients.map((client) => {
                    const contact = client.contact
                    const displayName = contact?.company_name || 
                                      `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
                    const initials = contact?.company_name 
                      ? contact.company_name.charAt(0).toUpperCase()
                      : `${contact?.first_name?.charAt(0) || ''}${contact?.last_name?.charAt(0) || ''}`.toUpperCase()

                    return (
                      <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              {contact?.email || 'Sin email'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {client.role || 'Cliente'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClient(client)}
                            disabled={removeClientMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Custom Empty State - Only show when no clients */}
        {(!projectClients || projectClients.length === 0) && (
          <CustomEmptyState
            icon={<Users className="w-16 h-16 text-muted-foreground/50" />}
            title="No hay clientes agregados"
            description="Comienza agregando el primer cliente al proyecto desde tus contactos organizacionales."
            action={
              <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar Primer Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Cliente al Proyecto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Seleccionar Contacto</label>
                      <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un contacto" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableContacts.map(contact => {
                            const displayName = contact.company_name || 
                                             `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            return (
                              <SelectItem key={contact.id} value={contact.id}>
                                {displayName}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddClientModal(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleAddClient} 
                        disabled={!selectedContactId || addClientMutation.isPending}
                      >
                        {addClientMutation.isPending ? 'Agregando...' : 'Agregar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            }
          />
        )}
      </div>
      
      {/* Dangerous Confirmation Modal */}
      {clientToDelete && (
        <DangerousConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setClientToDelete(null)
          }}
          onConfirm={confirmRemoveClient}
          title="Remover Cliente del Proyecto"
          description="Vas a remover este cliente del proyecto. Esta acción no se puede deshacer y el cliente perderá el acceso a toda la información del proyecto."
          confirmationText={
            clientToDelete.contact?.company_name || 
            `${clientToDelete.contact?.first_name || ''} ${clientToDelete.contact?.last_name || ''}`.trim()
          }
          buttonText="Remover Cliente"
          isLoading={removeClientMutation.isPending}
        />
      )}
    </Layout>
  )
}