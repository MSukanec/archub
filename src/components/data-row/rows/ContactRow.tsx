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

  // Determine subtitle - prioritize email, fallback to company_name
  let subtitle = email || "";
  if (!subtitle && company_name) {
    subtitle = company_name;
  }
  if (!subtitle) {
    subtitle = "Sin información adicional";
  }

  // Get avatar and fallback from linked user if available
  const avatarUrl = linked_user?.avatar_url || "";
  const avatarFallback = linked_user
    ? getInitials(linked_user.full_name)
    : getInitials(displayName);

  // Transform contact data to DataRowCard props
  const dataRowProps: DataRowCardProps = {
    title: displayName,
    subtitle,
    avatarUrl: avatarUrl || undefined,
    avatarFallback,
    selectable,
    selected,
    showChevron: showChevron || !!onClick,
    onClick: onClick ? () => onClick(contact) : undefined,
    density
  };

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
        <DataRowCard {...dataRowProps} />
      </SwipeableCard>
    );
  }

  return <DataRowCard {...dataRowProps} />;
}