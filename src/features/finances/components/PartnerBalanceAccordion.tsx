import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IdentityBadge } from '@/components/shared/IdentityBadge';

interface PartnerBalanceData {
  partnerId: string;
  partnerName: string;
  balance: number;
  contributions: number;
  withdrawals: number;
  linkedUser?: { avatar_url?: string | null } | null;
}

interface PartnerBalanceAccordionProps {
  partners: PartnerBalanceData[];
  currencySymbol?: string;
}

interface PartnerBalanceItemProps {
  partner: PartnerBalanceData;
  currencySymbol: string;
  isOpen: boolean;
  onToggle: () => void;
}

const formatCurrency = (amount: number, symbol: string = '$'): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return `${symbol} ${formattedAmount}`;
};

const getPartnerInitials = (name: string): string => {
  if (!name || name === 'Sin Socio') return 'SS';
  
  const words = name.split(' ');
  if (words.length > 1) {
    return words.slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  }
  return name.slice(0, 2).toUpperCase();
};

function PartnerBalanceItem({ 
  partner, 
  currencySymbol,
  isOpen, 
  onToggle,
}: PartnerBalanceItemProps) {
  const initials = getPartnerInitials(partner.partnerName);
  const total = partner.contributions + partner.withdrawals;
  const contributionPercentage = total > 0 ? (partner.contributions / total) * 100 : 50;
  const balancePercentage = partner.contributions > 0 
    ? Math.min((partner.balance / partner.contributions) * 100, 100) 
    : 0;

  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        "bg-card hover:shadow-sm",
        isOpen && "ring-1 ring-primary/20"
      )}
      data-testid={`partner-balance-accordion-${partner.partnerId}`}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left",
          "hover:bg-muted/50 transition-colors"
        )}
        data-testid={`partner-balance-accordion-trigger-${partner.partnerId}`}
      >
        <div className="flex-1 min-w-0">
          <IdentityBadge 
            name={partner.partnerName}
            size="md"
            layout="row"
            linkedUser={partner.linkedUser}
            subLabel={!isOpen ? `Balance: ${partner.balance >= 0 ? '' : '-'}${formatCurrency(partner.balance, currencySymbol)}` : undefined}
          />
        </div>
        
        <div className={cn(
          "text-sm font-bold flex-shrink-0",
          partner.balance >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
        )}>
          {partner.balance >= 0 ? '+' : ''}{formatCurrency(partner.balance, currencySymbol)}
        </div>
        
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Aportes
                </div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(partner.contributions, currencySymbol)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Retiros
                </div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-500">
                  {formatCurrency(partner.withdrawals, currencySymbol)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Balance Neto
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  partner.balance >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                )}>
                  {partner.balance >= 0 ? '+' : ''}{formatCurrency(partner.balance, currencySymbol)}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    balancePercentage >= 80 
                      ? "bg-green-500" 
                      : balancePercentage >= 50 
                        ? "bg-amber-500" 
                        : "bg-primary"
                  )}
                  style={{ width: `${Math.max(balancePercentage, 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Retirado: {(100 - balancePercentage).toFixed(0)}%</span>
                <span>Disponible: {balancePercentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerBalanceAccordion({ 
  partners,
  currencySymbol = '$',
}: PartnerBalanceAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  
  const sortedPartners = [...partners].sort((a, b) => b.balance - a.balance);

  const handleToggle = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  if (sortedPartners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          No hay balances de socios registrados
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="partner-balance-accordion-list">
      {sortedPartners.map(partner => (
        <PartnerBalanceItem
          key={partner.partnerId}
          partner={partner}
          currencySymbol={currencySymbol}
          isOpen={openId === partner.partnerId}
          onToggle={() => handleToggle(partner.partnerId)}
        />
      ))}
    </div>
  );
}

export type { PartnerBalanceAccordionProps, PartnerBalanceData };
