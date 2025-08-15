import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Trash2, DollarSign, Calendar, User, Package, MoreVertical, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SubcontractProps {
  subcontract: {
    id: string;
    title: string;
    date: string;
    contact?: {
      id: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    amount_total?: number;
    currency_id?: string;
    exchange_rate?: number;
    status: string;
    analysis?: {
      pagoALaFecha: number;
      pagoALaFechaUSD: number;
      saldo: number;
      saldoUSD: number;
    };
  };
  currencyView: 'discriminado' | 'pesificado' | 'dolarizado';
  onEdit: () => void;
  onDelete: () => void;
  onNewProposal: () => void;
}

export function Subcontract({ subcontract, currencyView, onEdit, onDelete, onNewProposal }: SubcontractProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'en_proceso': { variant: 'default' as const, label: 'En Proceso' },
      'completado': { variant: 'default' as const, label: 'Completado' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const convertAmount = (amountARS: number, amountUSD: number, currencyCode: string) => {
    if (currencyView === 'discriminado') {
      return currencyCode === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return amountARS;
    } else if (currencyView === 'dolarizado') {
      return amountUSD;
    }
    return amountARS;
  };

  const formatSingleCurrency = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amountARS, amountUSD, originalCurrency);
    
    if (currencyView === 'discriminado') {
      const symbol = originalCurrency === 'USD' ? 'USD' : 'ARS';
      return `${symbol} ${convertedAmount.toLocaleString('es-AR')}`;
    } else if (currencyView === 'pesificado') {
      return `ARS ${convertedAmount.toLocaleString('es-AR')}`;
    } else {
      return `USD ${Math.round(convertedAmount).toLocaleString('es-AR')}`;
    }
  };

  // Obtener el nombre del contacto
  const getContactName = () => {
    const contact = subcontract.contact;
    if (!contact) return 'Sin proveedor';
    
    return contact.full_name || 
      `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
      'Nombre no disponible';
  };

  // Calcular montos
  const amountARS = subcontract.amount_total || 0;
  const amountUSD = amountARS / (subcontract.exchange_rate || 1);
  const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
  
  const pagoARS = subcontract.analysis?.pagoALaFecha || 0;
  const pagoUSD = subcontract.analysis?.pagoALaFechaUSD || 0;
  
  const saldoARS = subcontract.analysis?.saldo || 0;
  const saldoUSD = subcontract.analysis?.saldoUSD || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Columna izquierda - Información principal */}
          <div className="space-y-3">
            {/* Fila 1: Título con ícono y estado */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight">{subcontract.title}</h3>
                <div className="mt-1">
                  {getStatusBadge(subcontract.status)}
                </div>
              </div>
            </div>
            
            {/* Fila 2: Fecha y proveedor */}
            <div className="pl-11 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{getContactName()}</span>
              </div>
              {subcontract.contact?.email && (
                <div className="text-xs text-muted-foreground truncate">
                  {subcontract.contact.email}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Botones y montos */}
          <div className="space-y-3">
            {/* Fila 1: Botones de acción */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={onNewProposal}
                className="h-8"
              >
                <FileText className="w-4 h-4 mr-2" />
                Nueva Propuesta
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Fila 2: Montos optimizados */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">
                  {formatSingleCurrency(amountARS, amountUSD, originalCurrency)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pagado</p>
                <p className="text-sm font-semibold text-green-600">
                  {formatSingleCurrency(pagoARS, pagoUSD, 'ARS')}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="text-sm font-semibold text-orange-600">
                  {formatSingleCurrency(saldoARS, saldoUSD, 'ARS')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}