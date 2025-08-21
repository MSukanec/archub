import React from 'react';
import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { Edit, Trash2 } from 'lucide-react';

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

  // Determine subtitle - prioritize email, remove fallback
  let subtitle = email || "";
  if (!subtitle && company_name) {
    subtitle = company_name;
  }
  // No fallback text - just leave empty if no info

  // Get avatar and fallback from linked user if available
  const avatarUrl = linked_user?.avatar_url || "";
  const avatarFallback = linked_user
    ? getInitials(linked_user.full_name)
    : getInitials(displayName);

  // Create custom contact component with real badges instead of using DataRowCard
  const contactContent = (
    <div 
      className="flex items-center gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 transition-colors cursor-pointer"
      onClick={onClick ? () => onClick(contact) : undefined}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          {(avatarUrl && avatarUrl.trim() !== '') ? (
            <img 
              src={avatarUrl} 
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {avatarFallback}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[var(--card-fg)] font-semibold text-base truncate">
          {displayName}
        </div>
        {subtitle && (
          <div className="text-[var(--muted-fg)] text-sm truncate mt-0.5">
            {subtitle}
          </div>
        )}
        {/* Contact Type Badges */}
        {contact.contact_types && contact.contact_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {contact.contact_types.map((type, index) => (
              <span
                key={type.id || index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white bg-[var(--accent)]"
              >
                {type.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
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
        {contactContent}
      </SwipeableCard>
    );
  }

  return contactContent;
}