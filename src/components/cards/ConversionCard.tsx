import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Edit, Trash2 } from "lucide-react";
import SwipeableCard from "@/components/layout/mobile/SwipeableCard";

type ConversionCardProps = {
  conversion: {
    id: string;
    conversion_group_id: string;
    movements: any[];
    from_currency: string;
    to_currency: string;
    from_amount: number;
    to_amount: number;
    description: string;
    movement_date: string;
    created_at: string;
    creator?: {
      id: string;
      full_name?: string;
      email: string;
      avatar_url?: string;
    };
    is_conversion_group: true;
  };
  onEdit?: (conversion: any) => void;
  onDelete?: (conversion: any) => void;
  onToggleFavorite?: (conversion: any) => void;
};

const ConversionCard = ({ conversion, onEdit, onDelete, onToggleFavorite }: ConversionCardProps) => {
  const { creator, from_currency, to_currency, from_amount, to_amount } = conversion;

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format amount with thousands separators
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR').format(amount);
  };

  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          icon: <Star className="w-4 h-4" />,
          onClick: () => onToggleFavorite?.(conversion)
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(conversion)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete?.(conversion)
        }
      ]}
    >
      <div className="flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors"
           style={{ borderRight: '4px solid rgb(59, 130, 246)' }}>
        {/* Left: Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={creator?.avatar_url || ''} 
              alt={creator?.full_name || creator?.email || 'Usuario'} 
            />
            <AvatarFallback className="text-sm font-medium">
              {getInitials(creator?.full_name || creator?.email || 'Usuario')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Center: Data - Two rows layout exactly like MovementCard */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="text-[var(--card-fg)] font-medium text-sm">
              Conversión
            </div>
            <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 ml-4">
              ${formatAmount(from_amount)} → ${formatAmount(to_amount)}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="text-[var(--muted-fg)] text-sm">
              {from_currency} - {to_currency}
            </div>
            <div className="text-xs text-gray-500 ml-4">
              {from_currency} → {to_currency}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ConversionCard;