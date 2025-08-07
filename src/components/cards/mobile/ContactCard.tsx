import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';

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
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ContactCard: React.FC<ContactCardProps> = ({ contact, onEdit, onDelete, onClick }) => {
  const {
    first_name,
    last_name,
    full_name,
    email,
    phone,
    company_name,
    contact_types,
    linked_user_id,
    linked_user
  } = contact;

  // Determine display name - prioritize full_name, fallback to first_name + last_name
  const displayName = full_name || `${first_name} ${last_name || ''}`.trim();
  
  // Determine display email
  const displayEmail = email || '';

  // Get avatar and name from linked user if available
  const avatar = linked_user?.avatar_url || '';
  const avatarFallback = linked_user ? getInitials(linked_user.full_name) : getInitials(displayName);

  return (
    <div className="mb-3">
      <SwipeableCard
        onEdit={onEdit ? () => onEdit(contact) : undefined}
        onDelete={onDelete ? () => onDelete(contact) : undefined}
        actions={[
          {
            label: 'Editar',
            icon: <Edit className="w-4 h-4" />,
            variant: 'default',
            onClick: () => onEdit?.(contact)
          },
          {
            label: 'Eliminar',
            icon: <Trash2 className="w-4 h-4" />,
            variant: 'destructive',
            onClick: () => onDelete?.(contact)
          }
        ]}
      >
        <div className="p-4 bg-card border border-card-border rounded-lg">
          <div className="flex items-center gap-3">
            {/* Avatar - same size as MovementCard */}
            <Avatar className="w-12 h-12">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-sm font-medium">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm truncate">
                  {displayName}
                </p>
                {linked_user_id && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Usuario
                  </Badge>
                )}
                {contact_types && contact_types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contact_types.map((type) => (
                      <Badge key={type.id} variant="outline" className="text-xs shrink-0">
                        {type.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-0.5">
                {displayEmail && (
                  <p className="text-xs text-muted-foreground truncate">
                    {displayEmail}
                  </p>
                )}
                {company_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {company_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SwipeableCard>
    </div>
  );
};

export default ContactCard;