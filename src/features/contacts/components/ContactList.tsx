import { useMemo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import ContactAvatar from './ContactAvatar';
import type { ContactWithRelations } from '@/features/contacts/types';

interface ContactListProps {
  contacts: ContactWithRelations[];
  onEdit: (contact: ContactWithRelations) => void;
  onDelete: (contact: ContactWithRelations) => void;
  onRowClick?: (contact: ContactWithRelations) => void;
}

export default function ContactList({ 
  contacts, 
  onEdit, 
  onDelete,
  onRowClick
}: ContactListProps) {
  // Sort contacts alphabetically by name
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
      const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
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
      total: totalContacts,
      archubUsers,
      organizationMembers,
      uniqueTypes: uniqueTypes.size
    };
  }, [contacts]);
  
  const columns = useMemo(() => [
    {
      key: "first_name" as const,
      label: "Nombre",
      sortable: false,
      render: (contact: ContactWithRelations) => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '—';
        
        return (
          <div className="flex items-center gap-3">
            <ContactAvatar contact={contact} size="md" />
            <span className="font-semibold text-sm">
              {fullName}
            </span>
          </div>
        );
      }
    },
    {
      key: "email" as const,
      label: "Email",
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
      label: "Tipos",
      sortable: false,
      render: (contact: ContactWithRelations) => {
        if (!contact.contact_types || contact.contact_types.length === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {contact.contact_types.slice(0, 2).map((type) => (
              <Badge key={type.id} className="text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
                {type.name}
              </Badge>
            ))}
            {contact.contact_types.length > 2 && (
              <Badge className="text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard>
          <StatCardTitle>Total Contactos</StatCardTitle>
          <StatCardValue>{kpis.total}</StatCardValue>
        </StatCard>
        
        <StatCard>
          <StatCardTitle>Usuarios Archub</StatCardTitle>
          <StatCardValue>{kpis.archubUsers}</StatCardValue>
          <StatCardMeta>
            {kpis.total > 0 
              ? `${Math.round((kpis.archubUsers / kpis.total) * 100)}% del total`
              : '0% del total'
            }
          </StatCardMeta>
        </StatCard>
        
        <StatCard>
          <StatCardTitle>Miembros</StatCardTitle>
          <StatCardValue>{kpis.organizationMembers}</StatCardValue>
          <StatCardMeta>En la organización</StatCardMeta>
        </StatCard>
        
        <StatCard>
          <StatCardTitle>Tipos Únicos</StatCardTitle>
          <StatCardValue>{kpis.uniqueTypes}</StatCardValue>
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
