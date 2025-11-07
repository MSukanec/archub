import React, { useMemo } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card'

interface ContactListProps {
  contacts: any[]
  onEdit: (contact: any) => void
  onDelete: (contact: any) => void
}

export default function ContactList({ contacts, onEdit, onDelete }: ContactListProps) {
  
  // Calcular KPIs
  const kpis = useMemo(() => {
    const totalContacts = contacts.length
    const archubUsers = contacts.filter(c => c.linked_user).length
    
    // Contactos agregados este mes
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const thisMonthContacts = contacts.filter(c => {
      const createdDate = new Date(c.created_at)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    }).length
    
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
      thisMonth: thisMonthContacts,
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
      render: (contact: any) => (
        <div>
          <div className="font-medium text-sm">
            {contact.first_name || '—'}
          </div>
          {contact.linked_user && (
            <Badge 
              className="mt-1 text-xs px-1.5 py-0 h-5 border-accent text-accent"
              variant="outline"
            >
              Usuario de Archub
            </Badge>
          )}
        </div>
      )
    },
    {
      key: "last_name" as const,
      label: "Apellido",
      sortable: true,
      sortType: "string" as const,
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.last_name || '—'}
        </div>
      )
    },
    {
      key: "email" as const,
      label: "Mail",
      sortable: true,
      sortType: "string" as const,
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.email || '—'}
        </div>
      )
    },
    {
      key: "phone" as const,
      label: "Teléfono",
      sortable: false,
      render: (contact: any) => (
        <div className="text-sm text-muted-foreground">
          {contact.phone || '—'}
        </div>
      )
    },
    {
      key: "address" as const,
      label: "Dirección",
      sortable: false,
      render: (contact: any) => {
        const addressParts = []
        
        if (contact.street_address) addressParts.push(contact.street_address)
        if (contact.city) addressParts.push(contact.city)
        if (contact.state) addressParts.push(contact.state)
        if (contact.country) addressParts.push(contact.country)
        
        const fullAddress = addressParts.join(', ')
        
        return (
          <div className="text-sm text-muted-foreground max-w-xs truncate" title={fullAddress}>
            {fullAddress || '—'}
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(contact)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(contact)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        <StatCard data-testid="statcard-this-month">
          <StatCardTitle showArrow={false}>Agregados Este Mes</StatCardTitle>
          <StatCardValue>{kpis.thisMonth}</StatCardValue>
          <StatCardMeta>Nuevos contactos</StatCardMeta>
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
      />
    </div>
  )
}
