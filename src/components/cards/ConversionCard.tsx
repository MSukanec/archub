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
          onClick: () => onToggleFavorite?.(conversion)
        },
        {
          label: "Editar",
          onClick: () => onEdit?.(conversion)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete?.(conversion)
        }
      ]}
    >
           style={{ borderRight: '4px solid rgb(59, 130, 246)' }}>
        {/* Left: Avatar */}
            <AvatarImage 
              src={creator?.avatar_url || ''} 
              alt={creator?.full_name || creator?.email || 'Usuario'} 
            />
              {getInitials(creator?.full_name || creator?.email || 'Usuario')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Center: Data - Two rows layout exactly like MovementCard */}
              Conversión
            </div>
              ${formatAmount(from_amount)} → ${formatAmount(to_amount)}
            </div>
          </div>
          
              {from_currency} - {to_currency}
            </div>
              {from_currency} → {to_currency}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ConversionCard;