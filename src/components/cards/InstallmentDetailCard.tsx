import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InstallmentDetailCardProps {
  item: {
    id: string;
    movement_date: string;
    amount: number;
    description?: string;
    contact?: {
      first_name?: string;
      last_name?: string;
      company_name?: string;
    };
    currency?: {
      code: string;
      symbol: string;
    };
    wallet?: {
      name: string;
    };
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

  const formattedDate = format(new Date(item.movement_date), "dd MMM yyyy", { locale: es });

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-3">
      {/* Header with avatar and contact info */}
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
      </div>

      {/* Financial details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Fecha</div>
          <div className="font-medium">{formattedDate}</div>
        </div>
        
        <div>
          <div className="text-xs text-muted-foreground">Moneda</div>
          <div className="font-medium">{item.currency?.code || '-'}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Billetera</div>
          <div className="font-medium">{item.wallet?.name || '-'}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Monto</div>
          <div className="font-medium">
            {item.currency?.symbol || '$'}{item.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Description if available */}
      {item.description && (
        <div>
          <div className="text-xs text-muted-foreground">Descripción</div>
          <div className="text-sm">{item.description}</div>
        </div>
      )}
    </div>
  );
}