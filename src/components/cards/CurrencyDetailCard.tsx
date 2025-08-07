import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CurrencyDetailCardProps {
  item: {
    contact?: {
      first_name?: string;
      last_name?: string;
      company_name?: string;
    };
    client?: {
      currency_id?: string;
      committed_amount?: number;
    };
    dollarizedTotal?: number;
    commitmentPercentage?: number;
    contributionPercentage?: number;
    remainingAmount?: number;
  };
}

export default function CurrencyDetailCard({ item }: CurrencyDetailCardProps) {
  if (!item.contact) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <div className="text-sm text-muted-foreground">Sin contacto</div>
      </div>
    );
  }

  const displayName = item.contact.company_name || 
                     `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim();
  const initials = item.contact.company_name 
    ? item.contact.company_name.charAt(0).toUpperCase()
    : `${item.contact.first_name?.charAt(0) || ''}${item.contact.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between">
        {/* Left side: Avatar and name */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            {item.contact.company_name && (
              <div className="text-xs text-muted-foreground">
                {item.contact.first_name} {item.contact.last_name}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Currency and Total */}
        <div className="text-right">
          <div className="text-sm font-medium text-muted-foreground">Aporte USD</div>
          <div className="text-sm font-medium">
            {item.dollarizedTotal ? 
              `US$ ${item.dollarizedTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
              : '-'
            }
          </div>
        </div>
      </div>
    </div>
  );
}