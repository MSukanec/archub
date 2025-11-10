import React from 'react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  FileCheck,
  PenTool
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";

interface SubcontractHistoryViewProps {
  subcontract: any;
}

export function SubcontractHistoryView({ subcontract }: SubcontractHistoryViewProps) {
  const { data: userData } = useCurrentUser();

  // Query para obtener pagos del subcontrato
  const { data: subcontractPayments = [] } = useQuery({
    queryKey: ['subcontract-payments', subcontract?.id],
    queryFn: async () => {
      if (!subcontract?.id || !userData?.organization?.id) return [];
      
      const response = await fetch(`/api/subcontract-payments/${subcontract.id}?organizationId=${userData.organization.id}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.map((payment: any) => ({
        ...payment,
        currency_symbol: payment.currency_name === 'Peso Argentino' ? '$' : 
                        payment.currency_name === 'Dólar Estadounidense' ? 'US$' : '$'
      }));
    },
    enabled: !!subcontract?.id && !!userData?.organization?.id
  });

  // Query para obtener el historial del subcontrato
  const { data: historyData = [], isLoading } = useQuery({
    queryKey: ['subcontract-history', subcontract?.id, subcontractPayments],
    queryFn: async () => {
      // Por ahora crear datos de prueba basados en la información del subcontrato
      const events = [];

      // 1. Creación del subcontrato
      if (subcontract?.created_at) {
        events.push({
          id: 'creation',
          type: 'creation',
          action: 'Creación',
          description: 'Subcontrato creado',
          created_at: subcontract.created_at,
          user_name: 'Sistema',
          user_avatar: null,
          icon: FileText,
          status: 'completed'
        });
      }

      // 2. Envío de RFQ (Request for Quotation)
      events.push({
        id: 'rfq_sent',
        type: 'rfq',
        action: 'Envío de RFQ',
        description: 'Solicitud de cotización enviada a proveedores',
        created_at: subcontract?.created_at,
        user_name: userData?.user?.full_name || 'Usuario',
        user_avatar: userData?.user?.avatar_url,
        icon: Send,
        status: 'completed'
      });

      // 3. Recepción de ofertas (basado en bids existentes)
      // Simular recepción de ofertas
      events.push({
        id: 'bids_received',
        type: 'bids',
        action: 'Recepción de Ofertas',
        description: 'Se recibieron ofertas de proveedores',
        created_at: subcontract?.created_at,
        user_name: 'Sistema',
        user_avatar: null,
        icon: FileCheck,
        status: 'completed'
      });

      // 4. Adjudicación (si existe winner_bid_id)
      if (subcontract?.winner_bid_id) {
        events.push({
          id: 'award',
          type: 'award',
          action: 'Adjudicación',
          description: 'Subcontrato adjudicado al proveedor ganador',
          created_at: subcontract?.updated_at || subcontract?.created_at,
          user_name: userData?.user?.full_name || 'Usuario',
          user_avatar: userData?.user?.avatar_url,
          icon: CheckCircle,
          status: 'completed'
        });
      }

      // 5. Pagos (basado en datos reales)
      if (subcontractPayments && subcontractPayments.length > 0) {
        subcontractPayments.forEach((payment: any, index: number) => {
          events.push({
            id: `payment_${payment.id || index}`,
            type: 'payment',
            action: 'Pago Registrado',
            description: `Pago de ${payment.currency_symbol}${payment.amount?.toLocaleString()} registrado`,
            created_at: payment.movement_date,
            user_name: userData?.user?.full_name || 'Usuario',
            user_avatar: userData?.user?.avatar_url,
            icon: DollarSign,
            status: 'completed'
          });
        });
      }

      // 6. Firma de contrato (pendiente)
      events.push({
        id: 'contract_signing',
        type: 'contract',
        action: 'Firma de Contrato',
        description: 'Pendiente: Firma del contrato con el proveedor',
        created_at: null,
        user_name: null,
        user_avatar: null,
        icon: PenTool,
        status: 'pending'
      });

      const sortedEvents = events.sort((a, b) => {
        // Eventos pendientes (sin fecha) van al final
        if (!a.created_at && !b.created_at) return 0;
        if (!a.created_at) return 1; 
        if (!b.created_at) return -1;
        
        // Ordenar por fecha: más reciente PRIMERO (descendente)
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descendente: lo más nuevo arriba
      });
      return sortedEvents;
    },
    enabled: !!subcontract?.id
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En Progreso</Badge>;
      default:
        return <Badge variant="outline">Sin estado</Badge>;
    }
  };

  const getIcon = (IconComponent: any, status: string) => {
    const iconClass = status === 'completed' ? 'text-green-600' : 
                     status === 'pending' ? 'text-yellow-600' : 
                     'text-blue-600';
    return <IconComponent className={`w-5 h-5 ${iconClass}`} />;
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      key: 'icon',
      label: '',
      width: '5%',
      render: (event: any) => (
        <div className="flex justify-center">
          {getIcon(event.icon, event.status)}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha',
      width: '19%',
      render: (event: any) => (
        <div className="flex flex-col">
          {event.created_at ? (
            <div className="text-sm font-medium">
              {format(new Date(event.created_at), 'dd/MM/yyyy', { locale: es })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Pendiente</div>
          )}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Acción',
      width: '19%',
      render: (event: any) => (
        <div className="font-medium">{event.action}</div>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      width: '38%',
      render: (event: any) => (
        <div className="text-sm text-muted-foreground">{event.description}</div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      width: '19%',
      render: (event: any) => getStatusBadge(event.status)
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando historial...</div>
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-12 h-12 text-muted-foreground" />}
        title="Sin historial disponible"
        description="No hay eventos registrados para este subcontrato aún."
      />
    );
  }

  return (
    <div className="space-y-6">


      <Table 
        columns={columns}
        data={historyData}
        isLoading={isLoading}
        className="bg-card"
      />
    </div>
  );
}