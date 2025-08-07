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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
    currency,
    amount
  } = movement;

  // Format the category and subcategory as separate lines
  const categoryDisplay = category;
  const subcategoryDisplay = subcategory || '';

  // Format amount with sign and color
  const isIngreso = type === 'Ingreso';
  const amountPrefix = isIngreso ? '+' : '-';
  const amountColor = isIngreso ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  
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
      <div className={`flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors`}
           style={{ borderRight: isIngreso ? '4px solid var(--movement-income-border)' : '4px solid var(--movement-expense-border)' }}>
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

        {/* Center: Data - Two rows layout */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div 
              className="text-[var(--card-fg)] font-medium text-sm"
              title={category}
            >
              {categoryDisplay}
            </div>
            <div className={`font-semibold text-sm ${amountColor} ml-4`}>
              {amountPrefix}${formatAmount(amount)}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            {subcategoryDisplay ? (
              <div 
                className="text-[var(--muted-fg)] text-sm truncate"
                title={subcategoryDisplay}
              >
                {subcategoryDisplay}
              </div>
            ) : (
              <div className="text-[var(--muted-fg)] text-sm">
                Sin subcategoría
              </div>
            )}
            <div className="text-xs text-gray-500 ml-4">
              {currency}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default MovementCard;