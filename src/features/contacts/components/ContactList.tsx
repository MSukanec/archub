import { useMemo } from 'react';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Eye } from 'lucide-react';
import type { ContactWithRelations, ContactType } from '@/features/contacts/types';

interface ContactListProps {
  contacts: ContactWithRelations[];
  onEdit: (contact: ContactWithRelations) => void;
  onDelete: (contact: ContactWithRelations) => void;
  onRowClick?: (contact: ContactWithRelations) => void;
  filterByType?: string;
  setFilterByType?: (value: string) => void;
  contactTypes?: ContactType[];
}

export default function ContactList({ 
  contacts, 
  onEdit, 
  onDelete,
  onRowClick,
  filterByType = 'all',
  setFilterByType,
  contactTypes = []
}: ContactListProps) {
  
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
      key: "avatar" as const,
      label: "Avatar",
      sortable: false,
      width: "80px",
      render: (contact: ContactWithRelations) => (
        <div className="flex items-center justify-center">
          {contact.linked_user ? (
            <Avatar className="w-10 h-10">
              <AvatarImage src={contact.linked_user.avatar_url || undefined} />
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
      render: (contact: ContactWithRelations) => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '—';
        
        return (
          <div className="font-semibold text-sm">
            {fullName}
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
      render: (contact: ContactWithRelations) => {
        if (!contact.phone) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        
        const cleanPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
        
        return (
          <Popover>
            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-sm text-foreground hover:text-accent hover:underline transition-colors cursor-pointer text-left">
                {contact.phone}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-8"
                  onClick={() => window.location.href = `tel:${cleanPhone}`}
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                  onClick={() => window.open(`https://wa.me/${cleanPhone}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
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
              <Badge key={type.id} variant="secondary" className="text-xs">
                {type.name}
              </Badge>
            ))}
            {contact.contact_types.length > 2 && (
              <Badge variant="secondary" className="text-xs">
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
    },
    {
      key: "actions" as const,
      label: "Acciones",
      sortable: false,
      width: "120px",
      render: (contact: ContactWithRelations) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <TableActionButtons
            onEdit={() => onEdit(contact)}
            onDelete={() => onDelete(contact)}
            editLabel="Editar contacto"
            deleteLabel="Eliminar contacto"
            deleteTitle="¿Eliminar contacto?"
            deleteDescription={`¿Estás seguro de que quieres eliminar a ${contact.first_name || 'este contacto'}? Esta acción no se puede deshacer.`}
          />
        </div>
      )
    }
  ], [onEdit, onDelete]);
  
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

      {setFilterByType && (
        <div className="flex items-center gap-4">
          <Select value={filterByType} onValueChange={setFilterByType}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por tipo" />
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
      )}

      <Table
        data={contacts}
        columns={columns}
        onRowClick={onRowClick}
        emptyMessage="No hay contactos disponibles"
        searchable
        searchPlaceholder="Buscar contactos..."
      />
    </div>
  );
}
