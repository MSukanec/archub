import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Trash2, Edit } from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';

type MovementCardProps = {
  movement: {
    id: string;
    date: string;
    creator?: {
      name: string;
      avatar_url?: string;
    };
    type: 'Ingreso' | 'Egreso';
    category: string;
    subcategory?: string;
    description?: string;
    wallet: string;
    currency: string;
    amount: number;
  };
  onEdit?: (movement: any) => void;
  onDelete?: (movement: any) => void;
  onToggleFavorite?: (movement: any) => void;
};

// Utility function to format amount with thousands separators
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
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

const MovementCard: React.FC<MovementCardProps> = ({ movement, onEdit, onDelete, onToggleFavorite }) => {
  const {
    creator,
    type,
    category,
    subcategory,
    description,
    currency,
    amount
  } = movement;

  // Format the category line without type (user will know by color)
  const categoryLine = subcategory 
    ? `${category} / ${subcategory}`
    : category;

  // Truncate description to 30 characters
  const truncatedDescription = description 
    ? description.length > 30 
      ? `${description.slice(0, 30)}...`
      : description
    : 'Sin descripción';

  // Format amount with sign and color
  const isIngreso = type === 'Ingreso';
  const amountPrefix = isIngreso ? '+' : '-';
  const amountColor = isIngreso ? 'text-green-600' : 'text-red-600';
  
  // Apply same CSS classes as desktop table rows
  const cardClassName = isIngreso ? 'movement-row-income' : 'movement-row-expense';

  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          icon: <Star className="w-4 h-4" />,
          onClick: () => onToggleFavorite?.(movement)
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(movement)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete?.(movement)
        }
      ]}
    >
      <div className={`flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors cursor-pointer`}
           style={{ borderRight: isIngreso ? '4px solid var(--movement-income-border)' : '4px solid var(--movement-expense-border)' }}
           onClick={() => onEdit?.(movement)}>
        {/* Left: Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={creator?.avatar_url || ''} 
              alt={creator?.name || 'Usuario'} 
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
              {getInitials(creator?.name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Center: Data */}
        <div className="flex-1 min-w-0">
          <div 
            className="text-[var(--card-fg)] font-medium text-sm"
            title={subcategory ? `${category} / ${subcategory}` : category}
          >
            {categoryLine}
          </div>
          <div 
            className="text-[var(--muted-fg)] text-sm mt-1 truncate"
            title={description || 'Sin descripción'}
          >
            {truncatedDescription}
          </div>
        </div>

        {/* Right: Amount + Currency */}
        <div className="flex-shrink-0 text-right">
          <div className={`font-semibold text-sm ${amountColor}`}>
            {amountPrefix}${formatAmount(amount)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {currency}
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default MovementCard;