import { AlertCircle, Users, FileCheck, Award, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

interface SubcontractDashboardViewProps {
  subcontract: any;
  project: any;
  bids: any[];
  winnerBid: any;
  provider: any;
}

export function SubcontractDashboardView({ 
  subcontract, 
  project, 
  bids = [], 
  winnerBid, 
  provider 
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este subcontrato está en borrador y no tiene alcance definido.{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium"
              onClick={() => {
                // TODO: Abrir modal de agregar tareas
                console.log('Abrir modal de agregar tareas');
              }}
            >
              Agregar tareas al alcance
            </Button>
          </AlertDescription>
        </Alert>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ficha del Subcontrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Proyecto</label>
              <p className="text-sm">{project?.name || 'Sin proyecto'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha</label>
              <p className="text-sm">{format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es })}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                {getStatusBadge(subcontract.status)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Monto Total</label>
              <p className="text-sm font-medium">
                {winnerBid && subcontract.amount_total 
                  ? `$${subcontract.amount_total.toLocaleString('es-AR')}`
                  : '—'
                }
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Proveedor</label>
              <p className="text-sm">
                {provider 
                  ? (provider.company_name || `${provider.first_name} ${provider.last_name}`)
                  : 'Sin adjudicar'
                }
              </p>
            </div>

            {subcontract.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notas</label>
                <p className="text-sm text-muted-foreground">{subcontract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card derecha - Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                // TODO: Abrir modal de agregar tareas (Tab Alcance)
                console.log('Definir alcance');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Definir alcance
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                openModal('subcontract-bid', {
                  subcontractId: subcontract.id,
                  isEditing: false
                });
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              Invitar oferentes / Enviar RFQ
            </Button>

            {receivedBids.length >= 2 && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implementar comparación de ofertas
                  console.log('Comparar ofertas');
                }}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Comparar ofertas
              </Button>
            )}

            {receivedBids.length >= 1 && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implementar adjudicación
                  console.log('Adjudicar');
                }}
              >
                <Award className="w-4 h-4 mr-2" />
                Adjudicar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card inferior - Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Documentos del subcontrato</p>
            <p className="text-xs">Contratos firmados, anexos y documentación adicional</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}