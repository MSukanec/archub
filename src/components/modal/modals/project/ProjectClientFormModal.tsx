import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { FormModalLayout } from '../../form/FormModalLayout'
import { FormModalHeader } from '../../form/FormModalHeader'
import { FormModalFooter } from '../../form/FormModalFooter'
import { useModalPanelStore } from '../../form/modalPanelStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
  contact: Contact
}

interface ProjectClientFormModalProps {
  onClose: () => void
}

export default function ProjectClientFormModal({ onClose }: ProjectClientFormModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()
  const [selectedContactId, setSelectedContactId] = useState<string>('')

  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.organization?.id

  // Initialize panel to edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

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

  // Get project clients to filter available contacts
  const { data: projectClients } = useQuery({
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
      return data || []
    },
    enabled: !!projectId && !!organizationId && !!supabase
  })

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase || !organizationId) throw new Error('Supabase client not initialized or missing organization ID')
      
      const { data, error } = await supabase
        .from('project_clients')
        .insert({
          project_id: projectId,
          client_id: contactId,
          committed_amount: 0,
          currency_id: userData?.organization?.default_currency_id || null,
          role: 'Cliente',
          is_active: true,
          notes: '',
          organization_id: organizationId
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
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar cliente",
        description: error.message || "Hubo un problema al agregar el cliente",
        variant: "destructive",
      })
    }
  })

  const handleSubmit = () => {
    if (!selectedContactId) return
    addClientMutation.mutate(selectedContactId)
  }

  // Get available contacts (not already clients)
  const availableContacts = organizationContacts?.filter(contact => 
    !projectClients?.some(client => client.client_id === contact.id)
  ) || []

  const viewPanel = (
    <div>
      <p className="text-muted-foreground">
        Selecciona un contacto de tu organización para agregarlo como cliente del proyecto actual.
      </p>
    </div>
  )

  const editPanel = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Seleccionar Contacto *</label>
        {organizationContacts === undefined ? (
          <div className="text-sm text-muted-foreground">Cargando contactos...</div>
        ) : (
          <Select value={selectedContactId} onValueChange={setSelectedContactId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un contacto disponible" />
            </SelectTrigger>
            <SelectContent>
              {availableContacts.length === 0 ? (
                <SelectItem value="" disabled>
                  No hay contactos disponibles
                </SelectItem>
              ) : (
                availableContacts.map(contact => {
                  const displayName = contact.company_name || 
                                   `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                  return (
                    <SelectItem key={contact.id} value={contact.id}>
                      {displayName}
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>
        )}
        {organizationContacts !== undefined && availableContacts.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Todos los contactos disponibles ya están agregados como clientes del proyecto.
          </p>
        )}
        {organizationContacts !== undefined && (
          <p className="text-xs text-muted-foreground">
            Contactos disponibles: {availableContacts.length} de {organizationContacts.length} total
          </p>
        )}
      </div>
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title="Agregar Cliente al Proyecto"
      icon={UserPlus}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Agregar Cliente"
      onRightClick={handleSubmit}
      submitDisabled={!selectedContactId || availableContacts.length === 0}
      showLoadingSpinner={addClientMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}