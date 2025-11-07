import React, { useMemo } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ContactListProps {
  contacts: any[]
  onEdit: (contact: any) => void
  onDelete: (contact: any) => void
  filterByType?: string
  setFilterByType?: (value: string) => void
  contactTypes?: any[]
}

export default function ContactList({ 
  contacts, 
  onEdit, 
  onDelete,
  filterByType = 'all',
  setFilterByType,
  contactTypes = []
}: ContactListProps) {
  
  // Calcular KPIs
  const kpis = useMemo(() => {
    const totalContacts = contacts.length
    const archubUsers = contacts.filter(c => c.linked_user).length
    
    // Contactos que son miembros de la organización
    const organizationMembers = contacts.filter(c => c.is_organization_member).length
    
    // Tipos de contacto únicos
    const uniqueTypes = new Set()
    contacts.forEach(contact => {
      if (contact.contact_types && Array.isArray(contact.contact_types)) {
        contact.contact_types.forEach((type: any) => {
          if (type.name) uniqueTypes.add(type.name)
        })
      }
    })
    
    return {
      total: totalContacts,
      archubUsers,
      organizationMembers,
      uniqueTypes: uniqueTypes.size
    }
  }, [contacts])
  
  // Columnas de la tabla
  const columns = useMemo(() => [
    {
      key: "avatar" as const,
      label: "Avatar",
      sortable: false,
      width: "80px",
      render: (contact: any) => (
        <div className="flex items-center justify-center">
          {contact.linked_user ? (
            <Avatar className="w-10 h-10">
              <AvatarImage src={contact.linked_user.avatar_url} />
              <AvatarFallback>
                {contact.linked_user.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-medium">
              {contact.first_name?.charAt(0) || 'C'}
            </div>
          )}
        </div>
      )
    },
    {
      key: "first_name" as const,
      label: "Nombre",
      sortable: true,
      sortType: "string" as const,
      render: (contact: any) => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '—'
        
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-sm">
              {fullName}
            </div>
            {contact.email && (
              <div className="text-xs text-muted-foreground">
                {contact.email}
              </div>
            )}
            {contact.phone && (
              <div className="text-xs text-muted-foreground">
                {contact.phone}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "contact_types" as const,
      label: "Tipos de contacto",
      sortable: false,
      render: (contact: any) => (
        <div className="flex flex-wrap gap-1">
          {contact.contact_types && contact.contact_types.length > 0 ? (
            contact.contact_types.map((type: any) => (
              <Badge 
                key={type.id}
                className="text-xs px-2 py-0.5 bg-accent/10 text-accent border-accent/20"
                variant="outline"
              >
                {type.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      )
    },
    {
      key: "attachments_count" as const,
      label: "Archivos",
      sortable: false,
      width: "100px",
      render: (contact: any) => {
        const count = contact.attachments_count || 0
        
        return (
          <div className="text-sm text-center">
            {count > 0 ? (
              <span className="font-medium">{count}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        )
      }
    },
    {
      key: "actions" as const,
      label: "",
      sortable: false,
      width: "60px",
      render: (contact: any) => (
        <div className="flex items-center justify-end">
          <TableActionButtons
            onEdit={() => onEdit(contact)}
            onDelete={() => onDelete(contact)}
          />
        </div>
      )
    }
  ], [onEdit, onDelete])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="statcard-total-contacts">
          <StatCardTitle showArrow={false}>Total de Contactos</StatCardTitle>
          <StatCardValue>{kpis.total}</StatCardValue>
          <StatCardMeta>En tu organización</StatCardMeta>
        </StatCard>

        <StatCard data-testid="statcard-archub-users">
          <StatCardTitle showArrow={false}>Usuarios de Archub</StatCardTitle>
          <StatCardValue>{kpis.archubUsers}</StatCardValue>
          <StatCardMeta>
            {kpis.total > 0 
              ? `${Math.round((kpis.archubUsers / kpis.total) * 100)}% del total`
              : 'Sin contactos'
            }
          </StatCardMeta>
        </StatCard>

        <StatCard 
          data-testid="statcard-organization-members"
          href="/organization/preferences"
        >
          <StatCardTitle>Miembros de la Organización</StatCardTitle>
          <StatCardValue>{kpis.organizationMembers}</StatCardValue>
          <StatCardMeta>
            {kpis.total > 0 
              ? `${Math.round((kpis.organizationMembers / kpis.total) * 100)}% del total`
              : 'Sin contactos'
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="statcard-contact-types">
          <StatCardTitle showArrow={false}>Tipos de Contacto</StatCardTitle>
          <StatCardValue>{kpis.uniqueTypes}</StatCardValue>
          <StatCardMeta>Categorías activas</StatCardMeta>
        </StatCard>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={contacts}
        defaultSort={{
          key: 'first_name',
          direction: 'asc'
        }}
        emptyStateConfig={{
          title: "No hay contactos",
          description: "Comienza agregando tu primer contacto a la organización"
        }}
        topBar={{
          showFilter: true,
          renderFilterContent: () => (
            <div className="space-y-2">
              <div className="text-sm font-medium">Filtrar por tipo</div>
              <Select value={filterByType} onValueChange={setFilterByType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {contactTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.name.toLowerCase()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
          isFilterActive: filterByType !== 'all',
          onClearFilters: () => setFilterByType?.('all')
        }}
      />
    </div>
  )
}
