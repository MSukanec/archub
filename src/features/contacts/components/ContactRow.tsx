import React from 'react';
import DataRowCard, { DataRowCardProps } from '@/components/shared/DataRowCard';
import { SwipeableCard } from '@/layouts';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
type Contact = {
  id: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  contact_types?: Array<{
    id: string;
    name: string;
  }>;
  linked_user_id?: string;
  avatar_url?: string;
  linked_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
};
interface ContactRowProps {
  contact: Contact;
  onClick?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  selected?: boolean;
  selectable?: boolean;
  density?: 'compact'| 'normal'| 'comfortable';
  showChevron?: boolean;
  enableSwipe?: boolean;
}
const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
export function ContactRow({ 
  contact, 
  onClick, 
  onEdit,
  onDelete,
  selected, 
  selectable = false,
  density = 'normal',
  showChevron = false,
  enableSwipe = true
}: ContactRowProps) {
  const {
    first_name,
    last_name,
    full_name,
    email,
    company_name,
    linked_user,
  } = contact;
  const displayName = full_name || `${first_name || ''} ${last_name || ""}`.trim() || linked_user?.full_name || "";
  let subtitle = email || company_name || "";
  const avatarUrl = contact.avatar_url || "";
  const avatarFallback = getInitials(displayName);
  const cardContent = (
    <>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {displayName}
        </div>
        {subtitle && (
          <div className="text-muted-foreground text-sm truncate">
            {subtitle}
          </div>
        )}
        {contact.contact_types && contact.contact_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {contact.contact_types.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white bg-[var(--accent)]"
              >
                {type.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {(showChevron || onClick) && (
        <div className="flex items-center">
          <div className="w-2" />
        </div>
      )}
    </>
  );
  const contactCard = (
    <DataRowCard
      avatarUrl={avatarUrl && avatarUrl.trim() !== ''? avatarUrl : undefined}
      avatarFallback={avatarFallback}
      selected={selected}
      density={density}
      onClick={onClick ? () => onClick(contact) : undefined}
    >
      {cardContent}
    </DataRowCard>
  );
  if (enableSwipe && (onEdit || onDelete)) {
    const swipeActions = [];
    
    if (onEdit) {
      swipeActions.push({
        label: "Editar",
        icon: <Edit className="w-4 h-4" />,
        variant: "default" as const,
        onClick: () => onEdit(contact),
      });
    }
    
    if (onDelete) {
      swipeActions.push({
        label: "Eliminar",
        icon: <Trash2 className="w-4 h-4" />,
        variant: "destructive" as const,
        onClick: () => onDelete(contact),
      });
    }
    return (
      <SwipeableCard actions={swipeActions}>
        {contactCard}
      </SwipeableCard>
    );
  }
  return contactCard;
}
