import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InstallmentDetailCardProps {
  item: {
    id: string;
    movement_date: string;
    amount: number;
    description?: string;
    contact_name?: string;
    contact_company_name?: string;
    currency_code?: string;
    currency_symbol?: string;
    wallet_name?: string;
    exchange_rate?: number;
    subcategory_name?: string;
  };
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onToggleFavorite?: (item: any) => void;
}

export default function InstallmentDetailCard({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}: InstallmentDetailCardProps) {
  if (!item.contact_name) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <div className="text-sm text-muted-foreground">Sin contacto</div>
      </div>
    );
  }

  const displayName = item.contact_company_name || item.contact_name || 'Sin nombre';
  const initials = item.contact_company_name 
    ? item.contact_company_name.charAt(0).toUpperCase()
    : (item.contact_name?.split(' ').map(n => n[0]).join('') || 'SC').toUpperCase();

  const formattedDate = format(new Date(item.movement_date), "dd MMM yyyy", { locale: es });

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between">
        {/* Left side: Avatar, name, date and type */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-muted-foreground">{formattedDate}</div>
            {item.subcategory_name && (
              <Badge variant="secondary" className="text-xs mt-1">
                {item.subcategory_name}
              </Badge>
            )}
          </div>
        </div>

        {/* Right side: Wallet and Amount with exchange rate */}
        <div className="text-right">
          <div className="text-sm">{item.wallet_name || '-'}</div>
          <div className="font-medium text-green-600">
            {item.currency_symbol || '$'} {item.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          {item.exchange_rate && (
            <div className="text-xs text-muted-foreground">
              Cotización: $ {item.exchange_rate.toLocaleString('es-AR')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}