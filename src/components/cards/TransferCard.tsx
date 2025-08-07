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
          onClick: () => onToggleFavorite?.(transfer)
        },
        {
          label: "Editar",
          onClick: () => onEdit?.(transfer)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete?.(transfer)
        }
      ]}
    >
           style={{ borderRight: '4px solid rgb(139, 69, 255)' }}>
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
              Transferencia
            </div>
              ${formatAmount(amount)}
            </div>
          </div>
          
              <span>{from_wallet}</span>
              <span>{to_wallet}</span>
            </div>
              {currency}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default TransferCard;