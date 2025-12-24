import { useMemo } from 'react';
import { Edit, Trash2, Users, UserCheck, Building2, Tags } from 'lucide-react';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { Badge } from '@/components/ui/badge';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { calculateCountKPI, calculatePercentageKPI } from '@/lib/kpis';
import type { ContactWithRelations } from '@/features/contacts/types';

interface ContactListProps {
  contacts: ContactWithRelations[];
  onEdit: (contact: ContactWithRelations) => void;
  onDelete: (contact: ContactWithRelations) => void;
  onRowClick?: (contact: ContactWithRelations) => void;
}

export function ContactList({ 
  contacts, 
  onEdit, 
  onDelete,
  onRowClick
}: ContactListProps) {
  // Sort contacts alphabetically by name
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const nameA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.linked_user?.full_name || '').toLowerCase();
      const nameB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.linked_user?.full_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [contacts]);
  
  const kpis = useMemo(() => {
    const totalContacts = contacts.length;
    const archubUsers = contacts.filter(c => c.linked_user).length;
    const organizationMembers = contacts.filter(c => c.is_organization_member).length;
    
    const uniqueTypes = new Set();
    contacts.forEach(contact => {
      if (contact.contact_types && Array.isArray(contact.contact_types)) {
        contact.contact_types.forEach((type: any) => {
          if (type.name) uniqueTypes.add(type.name);
        });
      }
    });
    
    return {
      total: calculateCountKPI({ count: totalContacts }),
      archubUsers: calculateCountKPI({ count: archubUsers }),
      archubUsersPercent: calculatePercentageKPI({ 
        numerator: archubUsers, 
        denominator: totalContacts || 1 
      }),
      organizationMembers: calculateCountKPI({ count: organizationMembers }),
      uniqueTypes: calculateCountKPI({ count: uniqueTypes.size })
    };
  }, [contacts]);
  
  const columns: Column<ContactWithRelations>[] = useMemo(() => [
    {
      key: "first_name" as const,
      label: "Nombre",
      type: 'medium-text' as const,
      sortable: false,
      render: (contact: ContactWithRelations) => {
        const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.linked_user?.full_name;
        
        return (
          <IdentityBadge
            name={fullName}
            linkedUser={contact.linked_user}
            size="sm"
            layout="row"
            showName={true}
          />
        );
      }
    },
    {
      key: "email" as const,
      label: "Email",
      type: 'email' as const,
      sortable: true,
      sortType: "string" as const,
      render: (contact: ContactWithRelations) => {
        if (!contact.email) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        
        return (
          <a 
            href={`mailto:${contact.email}`}
            className="text-sm text-foreground hover:text-accent hover:underline transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.email}
          </a>
        );
      }
    },
    {
      key: "phone" as const,
      label: "Teléfono",
      type: 'short-text' as const,
      sortable: true,
      sortType: "string" as const,
      render: (contact: ContactWithRelations) => (
        <span className="text-sm">
          {contact.phone || '—'}
        </span>
      )
    },
    {
      key: "contact_types" as const,
      label: "Tipo",
      type: 'long-text' as const,
      sortable: false,
      render: (contact: ContactWithRelations) => {
        if (!contact.contact_types || contact.contact_types.length === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {contact.contact_types.slice(0, 2).map((type) => (
              <Badge key={type.id} variant="neutral">
                {type.name}
              </Badge>
            ))}
            {contact.contact_types.length > 2 && (
              <Badge variant="neutral">
                +{contact.contact_types.length - 2}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: "company_name" as const,
      label: "Empresa",
      type: 'short-text' as const,
      sortable: true,
      sortType: "string" as const,
      render: (contact: ContactWithRelations) => (
        <span className="text-sm">
          {contact.company_name || '—'}
        </span>
      )
    }
  ], []);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total-contacts">
          <StatCardTitle>
            <Users className="h-4 w-4" />
            Total Contactos
          </StatCardTitle>
          <StatCardValue>{kpis.total.formatted}</StatCardValue>
        </StatCard>
        
        <StatCard data-testid="kpi-archub-users">
          <StatCardTitle>
            <UserCheck className="h-4 w-4" />
            Usuarios Archub
          </StatCardTitle>
          <StatCardValue>{kpis.archubUsers.formatted}</StatCardValue>
          <StatCardMeta>{kpis.archubUsersPercent.formatted} del total</StatCardMeta>
        </StatCard>
        
        <StatCard data-testid="kpi-organization-members">
          <StatCardTitle>
            <Building2 className="h-4 w-4" />
            Miembros
          </StatCardTitle>
          <StatCardValue>{kpis.organizationMembers.formatted}</StatCardValue>
          <StatCardMeta>En la organización</StatCardMeta>
        </StatCard>
        
        <StatCard data-testid="kpi-unique-types">
          <StatCardTitle>
            <Tags className="h-4 w-4" />
            Tipos Únicos
          </StatCardTitle>
          <StatCardValue>{kpis.uniqueTypes.formatted}</StatCardValue>
          <StatCardMeta>Categorías diferentes</StatCardMeta>
        </StatCard>
      </div>

      <Table
        data={sortedContacts}
        columns={columns}
        onRowClick={onRowClick}
        rowActions={(contact) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => onEdit(contact)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => onDelete(contact),
            variant: 'destructive' as const
          }
        ]}
        emptyStateConfig={{
          title: "No hay contactos",
          description: "Comienza creando tu primer contacto"
        }}
      />
    </div>
  );
}
