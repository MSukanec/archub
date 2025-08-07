import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Edit, Trash2 } from "lucide-react";
import SwipeableCard from "@/components/layout/mobile/SwipeableCard";

type ContactCardProps = {
  contact: {
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
  onEdit?: (contact: any) => void;
  onDelete?: (contact: any) => void;
  onClick?: (contact: any) => void;
};

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

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onClick,
}) => {
  const {
    first_name,
    last_name,
    full_name,
    email,
    phone,
    company_name,
    contact_types,
    linked_user_id,
    linked_user,
  } = contact;

  // Determine display name - prioritize full_name, fallback to first_name + last_name
  const displayName = full_name || `${first_name} ${last_name || ""}`.trim();

  // Determine display email
  const displayEmail = email || "";

  // Get avatar and name from linked user if available
  const avatar = linked_user?.avatar_url || "";
  const avatarFallback = linked_user
    ? getInitials(linked_user.full_name)
    : getInitials(displayName);

  return (
    <SwipeableCard
      actions={[
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          variant: "default",
          onClick: () => onEdit?.(contact),
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive",
          onClick: () => onDelete?.(contact),
        },
      ]}
    >
      <div className="flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors">
        {/* Avatar - same size as MovementCard */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="text-[var(--card-fg)] font-semibold text-base truncate">
              {displayName}
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            {displayEmail ? (
              <div
                className="text-[var(--muted-fg)] text-sm truncate"
                title={displayEmail}
              >
                {displayEmail}
              </div>
            ) : company_name ? (
              <div
                className="text-[var(--muted-fg)] text-sm truncate"
                title={company_name}
              >
                {company_name}
              </div>
            ) : (
              <div className="text-[var(--muted-fg)] text-sm">
                Sin información adicional
              </div>
            )}
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ContactCard;
