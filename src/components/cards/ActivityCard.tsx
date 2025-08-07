import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type ActivityCardProps = {
  activity: {
    id: string;
    type: string;
    type_label: string;
    title: string;
    description: string;
    created_at: string;
    author: {
      full_name?: string;
      avatar_url?: string;
    };
  };
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

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const {
    author,
    type_label,
    created_at
  } = activity;

  // Calculate days ago with validation
  const dateValue = created_at ? new Date(created_at) : null;
  const isValidDate = dateValue && !isNaN(dateValue.getTime());
  const daysAgo = isValidDate ? Math.floor((Date.now() - dateValue.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysDisplay = !isValidDate ? 'N/A' : daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? '1 día' : `${daysAgo} días`;

  return (
      {/* Left: Avatar */}
          <AvatarImage 
            src={author?.avatar_url || ''} 
            alt={author?.full_name || 'Usuario'} 
          />
            {getInitials(author?.full_name || 'Usuario')}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Center: Date and Days */}
            {isValidDate ? format(dateValue, 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
          </div>
            {daysDisplay}
          </div>
        </div>
        
            {type_label}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;