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
    contact_type?: string;
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
    contact_type,
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

  // Get contact type display
  const contactTypes: { [key: string]: string } = {
    'arquitecto': 'Arquitecto',
    'ingeniero': 'Ingeniero',
    'constructor': 'Constructor',
    'proveedor': 'Proveedor',
    'cliente': 'Cliente'
  };
  
  const typeDisplay = contact_type ? contactTypes[contact_type] || contact_type : '';

  return (
    <SwipeableCard
      onEdit={onEdit ? () => onEdit(contact) : undefined}
      onDelete={onDelete ? () => onDelete(contact) : undefined}
      actions={[
        {
          label: 'Editar',
          variant: 'default',
          onClick: () => onEdit?.(contact)
        },
        {
          label: 'Eliminar',
          variant: 'destructive',
          onClick: () => onDelete?.(contact)
        }
      ]}
    >
          {/* Avatar */}
            <AvatarImage src={avatar} />
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          {/* Contact Info */}
                {displayName}
              </p>
              {linked_user_id && (
                  Usuario
                </Badge>
              )}
              {typeDisplay && (
                  {typeDisplay}
                </Badge>
              )}
            </div>
            
              {displayEmail && (
                  {displayEmail}
                </p>
              )}
              {company_name && (
                  {company_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ContactCard;