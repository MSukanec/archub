import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Users, Plus, Trash2, UserPlus, Handshake, CreditCard, UserCheck, TrendingUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Badge } from '@/components/ui/badge'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { EmptyState } from '@/components/ui-custom/EmptyState'

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
  const { openModal } = useGlobalModalStore()



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

  // Calculate available contacts (not already added as clients)
  const availableContacts = useMemo(() => {
    if (!organizationContacts || !projectClients) return []
    
    const existingClientIds = new Set(projectClients.map(pc => pc.client_id))
    return organizationContacts.filter(contact => !existingClientIds.has(contact.id))
  }, [organizationContacts, projectClients])

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase || !projectId || !organizationId) throw new Error('Missing required parameters')
      
      const { error } = await supabase
        .from('project_clients')
        .insert({
          project_id: projectId,
          client_id: contactId,
          committed_amount: 0,
          currency_id: userData?.organization?.default_currency_id || '',
          role: 'Cliente',
          is_active: true,
          notes: '',
          organization_id: organizationId
        })

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Cliente agregado",
        description: "El cliente ha sido agregado al proyecto exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ['project-clients', projectId] })
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar cliente",
        description: error.message || "Hubo un problema al agregar el cliente",
        variant: "destructive",
      })
    }
  })



  const handleRemoveClient = (client: ProjectClient) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar cliente del proyecto',
      description: 'Esta acción eliminará permanentemente el cliente del proyecto. Se perderán todos los datos asociados como compromisos financieros y notas.',
      itemName: client.contact.full_name || `${client.contact.first_name} ${client.contact.last_name}`,
      destructiveActionText: 'Eliminar',
      onConfirm: () => removeClientMutation.mutate(client.id),
      isLoading: removeClientMutation.isPending
    });
  }





  // ActionBar features
  const features = [
    {
      title: "Vincular Contactos al Proyecto",
      description: "Agrega contactos de tu organización como clientes del proyecto actual para un control detallado."
    },
    {
      title: "Gestión de Compromisos Financieros",
      description: "Administra los montos comprometidos por cada cliente y configura las monedas correspondientes."
    },
    {
      title: "Roles y Permisos",
      description: "Asigna roles específicos a cada cliente y controla su nivel de acceso a la información del proyecto."
    },
    {
      title: "Seguimiento de Aportes",
      description: "Conecta automáticamente los aportes financieros con los clientes correspondientes para un seguimiento completo."
    }
  ]

  if (isLoading || loadingClients) {
    return (
      <Layout>
          <ActionBarDesktop
            features={features}
            primaryActionLabel="Agregar Cliente"
            onPrimaryActionClick={() => openModal('project-client')}
          />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
        {/* ActionBar */}
        <ActionBarDesktop
          features={features}
          primaryActionLabel="Agregar Cliente"
          onPrimaryActionClick={() => openModal('project-client')}
        />

        {/* Feature Introduction - Mobile only */}
          features={features}
        />

        {/* Conditional rendering: Two-column layout OR full-width empty state */}
        {projectClients && projectClients.length > 0 ? (
          /* Two Column Layout - Section descriptions left, content right */
            {/* Left Column - Section Description */}
              </div>
                Gestiona los clientes vinculados al proyecto actual. Controla sus compromisos financieros y nivel de acceso.
              </p>
                  {projectClients?.length || 0}
                </div>
              </div>
            </div>

            {/* Right Column - Clients Content */}
                {projectClients.map((client) => {
                  const contact = client.contact
                  const displayName = contact?.company_name || 
                                    `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
                  const initials = contact?.company_name 
                    ? contact.company_name.charAt(0).toUpperCase()
                    : `${contact?.first_name?.charAt(0) || ''}${contact?.last_name?.charAt(0) || ''}`.toUpperCase()

                  return (
                            </Avatar>
                            
                                  {displayName}
                                </h4>
                              </div>
                                {contact?.email || 'Sin email'}
                              </p>
                            </div>
                          </div>

                              {client.role || 'Cliente'}
                            </Badge>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveClient(client)}
                              disabled={removeClientMutation.isPending}
                            >
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            description="Comienza agregando el primer cliente al proyecto desde tus contactos organizacionales."
          />
        )}
      </div>
      

    </Layout>
  )
}