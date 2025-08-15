import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Trash2, DollarSign, Calendar, User, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
}

export function Subcontract({ subcontract, currencyView, onEdit, onDelete }: SubcontractProps) {
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
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{subcontract.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es })}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {getContactName()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {getStatusBadge(subcontract.status)}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Monto Total</span>
            </div>
            <p className="text-lg font-semibold">
              {formatSingleCurrency(amountARS, amountUSD, originalCurrency)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pago a la Fecha</span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatSingleCurrency(pagoARS, pagoUSD, 'ARS')}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Saldo</span>
            </div>
            <p className="text-lg font-semibold text-orange-600">
              {formatSingleCurrency(saldoARS, saldoUSD, 'ARS')}
            </p>
          </div>
        </div>
        
        {subcontract.contact?.email && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Contacto: {subcontract.contact.email}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}