import React from 'react'
import { ArrowLeftRight, Edit, Star, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import SwipeableCard from '@/components/layout/mobile/SwipeableCard'

export interface TransferGroup {
  id: string
  transfer_group_id: string
  movements: any[]
  currency: string
  amount: number
  description: string
  movement_date: string
  created_at: string
  creator: any
  from_wallet: string
  to_wallet: string
  is_transfer_group: true
}

interface TransferCardProps {
  transfer: TransferGroup
  onEdit?: (transfer: TransferGroup) => void
  onDelete?: (transfer: TransferGroup) => void
  onToggleFavorite?: (transfer: TransferGroup) => void
}

const TransferCard: React.FC<TransferCardProps> = ({ transfer, onEdit, onDelete, onToggleFavorite }) => {
  const { creator, currency, amount, from_wallet, to_wallet } = transfer;

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
          onClick: () => onToggleFavorite?.(transfer)
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(transfer)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete?.(transfer)
        }
      ]}
    >
      <div className="flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors"
           style={{ borderRight: '4px solid rgb(139, 69, 255)' }}>
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
              Transferencia
            </div>
            <div className="font-semibold text-sm text-violet-600 dark:text-violet-400 ml-4">
              ${formatAmount(amount)}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="text-[var(--muted-fg)] text-sm flex items-center gap-1">
              <span>{from_wallet}</span>
              <ArrowLeftRight className="w-3 h-3" />
              <span>{to_wallet}</span>
            </div>
            <div className="text-xs text-gray-500 ml-4">
              {currency}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default TransferCard;