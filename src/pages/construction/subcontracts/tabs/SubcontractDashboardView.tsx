import { AlertCircle, Users, FileCheck, Award, Plus, FileText, Zap, FolderOpen, Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Callout } from '@/components/ui-custom/Callout';
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

interface SubcontractDashboardViewProps {
  subcontract: any;
  project: any;
  bids: any[];
  winnerBid: any;
  provider: any;
  onTabChange?: (tab: string) => void;
}

export function SubcontractDashboardView({ 
  subcontract, 
  project, 
  bids = [], 
  winnerBid, 
  provider,
  onTabChange 
}: SubcontractDashboardViewProps) {
  const { openModal } = useGlobalModalStore();

  // Función para formatear el estado
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { variant: 'secondary' as const, label: 'Borrador' },
      'pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'en_proceso': { variant: 'default' as const, label: 'En Proceso' },
      'completado': { variant: 'default' as const, label: 'Completado' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Estados vacíos
  const isDraft = subcontract.status === 'draft';
  const isTendering = subcontract.status === 'pendiente';
  const hasScope = false; // TODO: Conectar con datos reales de alcance
  const receivedBids = bids.filter(bid => bid.status === 'submitted');

  return (
    <div className="space-y-6">
      {/* Estados vacíos */}
      {isDraft && !hasScope && (
        <Callout 
          icon={AlertCircle}
          onClick={() => onTabChange?.('Alcance')}
        >
          Este subcontrato está en borrador y no tiene alcance definido.{' '}
          <span className="font-medium text-accent cursor-pointer hover:underline">
            Agregar tareas al alcance
          </span>
        </Callout>
      )}

      {isTendering && receivedBids.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este subcontrato está en licitación pero no hay ofertas recibidas.{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium"
              onClick={() => {
                openModal('subcontract-bid', {
                  subcontractId: subcontract.id,
                  isEditing: false
                });
              }}
            >
              Invitar oferentes
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card izquierda - Ficha */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={FileText}
            title="Ficha del Subcontrato"
            description="Información general y detalles del subcontrato"
          />
          <CardContent className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Proyecto</p>
                  <p className="text-sm text-muted-foreground">{project?.name || 'Sin proyecto'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fecha</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-4 w-4 flex items-center justify-center">
                  {getStatusBadge(subcontract.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <p className="text-sm text-muted-foreground">Estado actual del subcontrato</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Monto Total</p>
                  <p className="text-sm text-muted-foreground">
                    {winnerBid && subcontract.amount_total 
                      ? `$${subcontract.amount_total.toLocaleString('es-AR')}`
                      : 'Sin adjudicar'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Proveedor</p>
                  <p className="text-sm text-muted-foreground">
                    {provider 
                      ? (provider.company_name || `${provider.first_name} ${provider.last_name}`)
                      : 'Sin adjudicar'
                    }
                  </p>
                </div>
              </div>

              {subcontract.notes && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Notas</p>
                  <p className="text-sm text-muted-foreground">{subcontract.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card derecha - Acciones rápidas */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={Zap}
            title="Acciones Rápidas"
            description="Accesos directos para gestionar el subcontrato"
          />
          <CardContent className="flex-1 space-y-3">
            <FormSubsectionButton
              icon={<Plus className="h-4 w-4" />}
              title="Definir alcance"
              description="Agregar tareas al subcontrato"
              onClick={() => onTabChange?.('Alcance')}
            />

            <FormSubsectionButton
              icon={<Users className="h-4 w-4" />}
              title="Invitar oferentes"
              description="Enviar RFQ a proveedores"
              onClick={() => onTabChange?.('Ofertas')}
            />

            {receivedBids.length >= 2 && (
              <FormSubsectionButton
                icon={<FileCheck className="h-4 w-4" />}
                title="Comparar ofertas"
                description={`${receivedBids.length} ofertas recibidas`}
                onClick={() => onTabChange?.('Ofertas')}
              />
            )}

            {receivedBids.length >= 1 && (
              <FormSubsectionButton
                icon={<Award className="h-4 w-4" />}
                title="Adjudicar"
                description="Seleccionar proveedor ganador"
                onClick={() => onTabChange?.('Ofertas')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card inferior - Documentos */}
      <Card className="h-full flex flex-col">
        <CardHeader 
          icon={FolderOpen}
          title="Documentos"
          description="Contratos firmados, anexos y documentación adicional"
        />
        <CardContent className="flex-1">
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">Sin documentos adjuntos</p>
            <p className="text-xs">Los documentos del subcontrato aparecerán aquí una vez que sean subidos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}