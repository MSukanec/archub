import React from 'react';
import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
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
  density?: 'compact' | 'normal' | 'comfortable';
  showChevron?: boolean;
  enableSwipe?: boolean;
}

// Utility function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ContactRow({ 
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

  // Determine display name - prioritize full_name, fallback to first_name + last_name
  const displayName = full_name || `${first_name} ${last_name || ""}`.trim();

  // Determine subtitle - prioritize email, fallback to company_name, empty if none
  let subtitle = email || company_name || "";

  // Get avatar and fallback from linked user if available
  const avatarUrl = linked_user?.avatar_url || "";
  const avatarFallback = linked_user
    ? getInitials(linked_user.full_name)
    : getInitials(displayName);

  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="font-semibold text-sm truncate">
          {displayName}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-muted-foreground text-sm truncate">
            {subtitle}
          </div>
        )}

        {/* Contact Type Badges */}
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

      {/* Trailing section - Solo espacio para chevron si es necesario */}
      {(showChevron || onClick) && (
        <div className="flex items-center">
          <div className="w-2" />
        </div>
      )}
    </>
  );

  // Usar el nuevo DataRowCard
  const contactCard = (
    <DataRowCard
      avatarUrl={avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : undefined}
      avatarFallback={avatarFallback}
      selected={selected}
      density={density}
      onClick={onClick ? () => onClick(contact) : undefined}
    >
      {cardContent}
    </DataRowCard>
  );

  // If swipe is enabled and we have edit/delete handlers, wrap in SwipeableCard
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