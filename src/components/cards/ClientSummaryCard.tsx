import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ClientSummaryCardProps {
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
  allCurrencies: Array<{
    id: string;
    code: string;
    symbol: string;
    name: string;
  }>;
}

export default function ClientSummaryCard({ item, allCurrencies }: ClientSummaryCardProps) {
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

  const clientCurrency = allCurrencies.find(c => c.id === item.client?.currency_id);
  const committedAmount = item.client?.committed_amount || 0;
  const dollarizedTotal = item.dollarizedTotal || 0;
  const commitmentPercentage = item.commitmentPercentage || 0;
  const contributionPercentage = item.contributionPercentage || 0;

  // Convert committed amount to USD if necessary
  let committedAmountUSD = committedAmount;
  if (item.client?.currency_id && clientCurrency?.code !== 'USD') {
    const exchangeRate = clientCurrency?.code === 'ARS' ? 1200 : 1;
    committedAmountUSD = committedAmount / exchangeRate;
  }
  
  const remaining = committedAmountUSD - dollarizedTotal;

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-3">
      {/* Header with avatar and name */}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium text-sm">{displayName}</div>
          {item.contact.company_name && (
            <div className="text-xs text-muted-foreground">
              {item.contact.first_name} {item.contact.last_name}
            </div>
          )}
        </div>
        {clientCurrency && (
          <Badge variant="outline" className="text-xs">
            {clientCurrency.code}
          </Badge>
        )}
      </div>

      {/* Financial information grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Comprometido</div>
          <div className="font-medium">
            {committedAmount > 0 ? (
              `${clientCurrency?.symbol || '$'}${committedAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            ) : (
              'Sin monto'
            )}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground">% Compromiso</div>
          <div className="font-medium">
            {committedAmount > 0 ? `${commitmentPercentage.toFixed(1)}%` : '-'}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Aporte USD</div>
          <div className="font-medium">
            {dollarizedTotal > 0 ? (
              `US$ ${dollarizedTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            ) : (
              '-'
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">% Aporte</div>
          <div className="font-medium">
            {dollarizedTotal > 0 ? `${contributionPercentage.toFixed(1)}%` : '-'}
          </div>
        </div>

        <div className="col-span-2">
          <div className="text-xs text-muted-foreground">Monto Restante</div>
          <div className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {remaining >= 0 ? '+' : '-'}US$ {Math.abs(remaining).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
}