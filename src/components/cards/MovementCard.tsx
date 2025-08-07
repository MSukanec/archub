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
          onClick: () => onToggleFavorite?.(movement)
        },
        {
          label: "Editar",
          onClick: () => onEdit?.(movement)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete?.(movement)
        }
      ]}
    >
      <div className={`flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors`}
           style={{ borderRight: isIngreso ? '4px solid var(--movement-income-border)' : '4px solid var(--movement-expense-border)' }}>
        {/* Left: Avatar */}
            <AvatarImage 
              src={creator?.avatar_url || ''} 
              alt={creator?.name || 'Usuario'} 
            />
              {getInitials(creator?.name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Center: Data - Two rows layout */}
            <div 
              title={category}
            >
              {categoryDisplay}
            </div>
            <div className={`font-semibold text-sm ${amountColor} ml-4`}>
              {amountPrefix}${formatAmount(amount)}
            </div>
          </div>
          
            {subcategoryDisplay ? (
              <div 
                title={subcategoryDisplay}
              >
                {subcategoryDisplay}
              </div>
            ) : (
                Sin subcategoría
              </div>
            )}
              {currency}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default MovementCard;