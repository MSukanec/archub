import { useState, useMemo } from 'react';
import { ChevronDown, Building2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateMonetaryKPI } from '@/lib/kpis';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ClientCommitmentWithRelations, ClientPaymentWithRelations } from '../types';
interface CommitmentAccordionProps {
  commitments: ClientCommitmentWithRelations[];
  payments: ClientPaymentWithRelations[];
  onEdit?: (commitment: ClientCommitmentWithRelations) => void;
  onDelete?: (commitment: ClientCommitmentWithRelations) => void;
}
interface CommitmentItemProps {
  commitment: ClientCommitmentWithRelations;
  payments: ClientPaymentWithRelations[];
  isOpen: boolean;
  onToggle: () => void;
  onEdit?: (commitment: ClientCommitmentWithRelations) => void;
  onDelete?: (commitment: ClientCommitmentWithRelations) => void;
}
const formatCurrency = (amount: number, symbol?: string): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return `${symbol || '$'} ${formattedAmount}`;
};
const getClientDisplayName = (commitment: ClientCommitmentWithRelations): string => {
  const contact = commitment.project_client?.contact;
  
  if (!contact) {
    return 'Sin contacto';
  }
  
  if (contact.company_name) {
    return contact.company_name;
  }
  
  if (contact.full_name) {
    return contact.full_name;
  }
  
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  return 'Sin nombre';
};
const getClientInitials = (commitment: ClientCommitmentWithRelations): string => {
  const contact = commitment.project_client?.contact;
  
  if (!contact) {
    return 'SC';
  }
  
  if (contact.company_name) {
    const words = contact.company_name.split('');
    if (words.length > 1) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
    }
    return contact.company_name.slice(0, 2).toUpperCase();
  }
  
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  
  const firstInitial = firstName.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName.charAt(0)?.toUpperCase() || '';
  
  return firstInitial + lastInitial || 'CL';
};
const getContactAvatarUrl = (commitment: ClientCommitmentWithRelations): string | null => {
  const contact = commitment.project_client?.contact;
  if (!contact?.image_bucket || !contact?.image_path) return null;
  return null;
};
function CommitmentItem({ 
  commitment, 
  payments,
  isOpen, 
  onToggle,
  onEdit,
  onDelete,
}: CommitmentItemProps) {
  const clientName = getClientDisplayName(commitment);
  const initials = getClientInitials(commitment);
  const avatarUrl = getContactAvatarUrl(commitment);
  
  const totalCommitted = commitment.amount || 0;
  
  const totalPaid = useMemo(() => {
    const commitmentPayments = payments
      .filter(p => p.commitment_id === commitment.id && p.status === 'confirmed')
      .map(payment => ({
        amount: payment.amount,
        currency_id: payment.currency_id,
        currency: payment.currency,
        exchange_rate: payment.exchange_rate
      }));
    
    if (commitmentPayments.length === 0 || !commitment.currency) {
      return 0;
    }
    
    const kpi = calculateMonetaryKPI({
      items: commitmentPayments,
      baseCurrencyId: commitment.currency.code || commitment.currency.id,
      symbol: commitment.currency.symbol
    });
    
    return kpi.value;
  }, [payments, commitment.id, commitment.currency]);
  
  const remainingAmount = totalCommitted - totalPaid;
  const paymentPercentage = totalCommitted > 0 ? (totalPaid / totalCommitted) * 100 : 0;
  
  const headerDisplay = commitment.unit_name 
    ? `${clientName} - ${commitment.unit_name}` 
    : clientName;
  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        "bg-card hover:shadow-sm",
        isOpen && "ring-1 ring-primary/20"
      )}
      data-testid={`commitment-accordion-${commitment.id}`}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left",
          "hover:bg-muted/50 transition-colors"
        )}
        data-testid={`commitment-accordion-trigger-${commitment.id}`}
      >
        <Avatar className="h-10 w-10 flex-shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={clientName} />}
          <AvatarFallback className="text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate flex items-center gap-2">
            {headerDisplay}
          </div>
          {!isOpen && (
            <div className="text-muted-foreground text-xs mt-0.5">
              {formatCurrency(totalCommitted, commitment.currency?.symbol)} • {paymentPercentage.toFixed(0)}% pagado
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              data-testid={`commitment-actions-${commitment.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(commitment);
              }}
              data-testid={`commitment-edit-${commitment.id}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(commitment);
              }}
              className="text-destructive focus:text-destructive"
              data-testid={`commitment-delete-${commitment.id}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t">
            {commitment.unit_name && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <Building2 className="h-4 w-4" />
                <span>{commitment.unit_name}</span>
                {commitment.unit_description && (
                  <span className="text-xs">— {commitment.unit_description}</span>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Precio Total
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(totalCommitted, commitment.currency?.symbol)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {commitment.currency?.code}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Pagado
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  paymentPercentage > 0 ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
                )}>
                  {formatCurrency(totalPaid, commitment.currency?.symbol)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {paymentPercentage.toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Saldo
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  remainingAmount > 0 ? "text-amber-600 dark:text-amber-500" : "text-green-600 dark:text-green-500"
                )}>
                  {formatCurrency(remainingAmount, commitment.currency?.symbol)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(100 - paymentPercentage).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    paymentPercentage >= 100 
                      ? "bg-green-500" 
                      : paymentPercentage > 50 
                        ? "bg-amber-500" 
                        : "bg-primary"
                  )}
                  style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function CommitmentAccordion({ 
  commitments, 
  payments,
  onEdit,
  onDelete,
}: CommitmentAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  
  const sortedCommitments = useMemo(() => {
    const hasAnyUnitName = commitments.some(c => c.unit_name);
    
    return [...commitments].sort((a, b) => {
      if (hasAnyUnitName) {
        const unitA = a.unit_name || '';
        const unitB = b.unit_name || '';
        if (unitA !== unitB) {
          if (!unitA) return 1;
          if (!unitB) return -1;
          return unitA.localeCompare(unitB, 'es', { numeric: true });
        }
      }
      
      const nameA = getClientDisplayName(a).toLowerCase();
      const nameB = getClientDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB, 'es');
    });
  }, [commitments]);
  const handleToggle = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };
  if (sortedCommitments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          No hay compromisos de pago registrados
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="commitment-accordion-list">
      {sortedCommitments.map(commitment => (
        <CommitmentItem
          key={commitment.id}
          commitment={commitment}
          payments={payments}
          isOpen={openId === commitment.id}
          onToggle={() => handleToggle(commitment.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
export type { CommitmentAccordionProps };
