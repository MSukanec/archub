import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  Clock,
  Eye,
  Check,
  X,
  RotateCcw,
  RefreshCw,
  Wrench,
  Loader2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
interface RepairAction {
  id: string;
  label: string;
  description: string;
  dangerous: boolean;
  requiredEvidence?: string[];
}
interface OpsAlert {
  id: string;
  created_at: string;
  updated_at: string;
  severity: 'low'| 'medium'| 'high'| 'critical';
  status: 'open'| 'ack'| 'resolved'| 'dismissed';
  alert_type: string;
  title: string;
  description: string | null;
  organization_id: string | null;
  user_id: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  payment_id: string | null;
  event_id: string | null;
  fingerprint: string | null;
  evidence: Record<string, any>;
  ack_by: string | null;
  ack_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  organizations?: { id: string; name: string } | null;
  users?: { id: string; email: string; full_name: string } | null;
  payments?: { id: string; amount: number; currency: string; status: string } | null;
  payment_events?: { id: string; provider_event_type: string; status: string } | null;
}
interface OpsStats {
  open: number;
  ack: number;
  resolved: number;
  critical: number;
  high: number;
  last_run: {
    id: string;
    created_at: string;
    status: string;
    duration_ms: number;
    stats: Record<string, any>;
  } | null;
}
function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge variant="error">Crítico</Badge>;
    case 'high':
      return <Badge variant="error">Alto</Badge>;
    case 'medium':
      return <Badge variant="warning">Medio</Badge>;
    default:
      return <Badge variant="neutral">Bajo</Badge>;
  }
}
function getStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge variant="error">Abierta</Badge>;
    case 'ack':
      return <Badge variant="info">Reconocida</Badge>;
    case 'resolved':
      return <Badge variant="success">Resuelta</Badge>;
    case 'dismissed':
      return <Badge variant="neutral">Descartada</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
function AlertCard({ 
  alert, 
  onAction,
  onExecuteRepair
}: { 
  alert: OpsAlert; 
  onAction: (id: string, action: string) => void;
  onExecuteRepair: (alertId: string, actionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRepairActions, setShowRepairActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<RepairAction | null>(null);
  const { toast } = useToast();
  const { data: repairActionsData, isLoading: loadingActions } = useQuery<{ actions: RepairAction[] }>({
    queryKey: [`/api/admin/ops/repair-actions/${encodeURIComponent(alert.alert_type)}`],
    enabled: showRepairActions,
  });
  const repairActions = repairActionsData?.actions || [];
  const handleConfirmRepair = () => {
    if (confirmAction) {
      onExecuteRepair(alert.id, confirmAction.id);
      setConfirmAction(null);
      setShowRepairActions(false);
    }
  };
  return (
    <>
      <Card className={`border-l-4 ${
        alert.severity === 'critical'? 'border-l-red-600':
        alert.severity === 'high'? 'border-l-red-500':
        alert.severity === 'medium'? 'border-l-yellow-500': 'border-l-gray-400'
      }`} data-testid={`alert-card-${alert.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getSeverityBadge(alert.severity)}
                {getStatusBadge(alert.status)}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>
              <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
              {alert.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
              )}
              {alert.organizations && (
                <p className="text-xs text-muted-foreground mt-1">
                  Org: {alert.organizations.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(alert.status === 'open'|| alert.status === 'ack') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-amber-600"
                  onClick={() => setShowRepairActions(!showRepairActions)}
                  data-testid={`button-repair-${alert.id}`}
                  title="Acciones de reparación"
                >
                  <Wrench className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpanded(!expanded)}
                data-testid={`button-expand-${alert.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {alert.status === 'open'&& (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-blue-600"
                  onClick={() => onAction(alert.id, 'ack')}
                  data-testid={`button-ack-${alert.id}`}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {(alert.status === 'open'|| alert.status === 'ack') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600"
                  onClick={() => onAction(alert.id, 'resolve')}
                  data-testid={`button-resolve-${alert.id}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              {(alert.status === 'open'|| alert.status === 'ack') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500"
                  onClick={() => onAction(alert.id, 'dismiss')}
                  data-testid={`button-dismiss-${alert.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {(alert.status === 'resolved'|| alert.status === 'dismissed') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onAction(alert.id, 'reopen')}
                  data-testid={`button-reopen-${alert.id}`}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {showRepairActions && (
            <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50 dark:bg-amber-950/20 -mx-4 px-4 pb-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Acciones de Reparación</span>
              </div>
              {loadingActions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando acciones...
                </div>
              ) : (
                <div className="space-y-2">
                  {repairActions.map((action) => (
                    <div 
                      key={action.id}
                      className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-background rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={action.dangerous ? "destructive" : "outline"}
                        onClick={() => setConfirmAction(action)}
                        data-testid={`button-action-${action.id}`}
                      >
                        Ejecutar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {expanded && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{''}
                    <code className="bg-muted px-1 rounded">{alert.alert_type}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider:</span>{''}
                    {alert.provider || '-'}
                  </div>
                  {alert.provider_payment_id && (
                    <div>
                      <span className="text-muted-foreground">Payment ID:</span>{''}
                      <code className="bg-muted px-1 rounded text-xs">{alert.provider_payment_id}</code>
                    </div>
                  )}
                  {alert.fingerprint && (
                    <div>
                      <span className="text-muted-foreground">Fingerprint:</span>{''}
                      <code className="bg-muted px-1 rounded text-xs">{alert.fingerprint.slice(0, 12)}...</code>
                    </div>
                  )}
                </div>
                {Object.keys(alert.evidence).length > 0 && (
                  <div className="mt-2">
                    <span className="text-muted-foreground">Evidence:</span>
                    <pre className="bg-muted p-2 rounded mt-1 overflow-auto max-h-40 text-xs">
                      {JSON.stringify(alert.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmAction?.dangerous && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              Confirmar acción
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium">{confirmAction?.label}</p>
              <p>{confirmAction?.description}</p>
              <p className="text-xs bg-muted p-2 rounded">
                Esta acción se registrará en el log de auditoría.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRepair}>
              Confirmar y Ejecutar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
interface AdminOpsAlertsTabProps {
  stats?: OpsStats;
}
export default function AdminOpsAlertsTab({ stats }: AdminOpsAlertsTabProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const { data: currentUser } = useCurrentUser();
  
  const currentLayout = currentUser?.preferences?.layout || 'experimental';
  const isLabLayout = currentLayout === 'lab';
  const updateLayoutMutation = useMutation({
    mutationFn: async (newLayout: string) => {
      if (!currentUser?.user?.id) throw new Error('User not found');
      const res = await apiRequest('PATCH', '/api/user/profile', { 
        user_id: currentUser.user.id,
        layout: newLayout 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({ 
        title: 'Layout actualizado', 
        description: `Ahora estás usando el layout "${isLabLayout ? 'experimental': 'lab'}"` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive'});
    },
  });
  const handleLayoutToggle = (checked: boolean) => {
    const newLayout = checked ? 'lab': 'experimental';
    updateLayoutMutation.mutate(newLayout);
  };
  const alertsUrl = statusFilter && statusFilter !== 'all'
    ? `/api/admin/ops/alerts?status=${statusFilter}`
    : '/api/admin/ops/alerts';
    
  const { data: alerts = [], isLoading, refetch } = useQuery<OpsAlert[]>({
    queryKey: [alertsUrl],
  });
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/ops/alerts/${id}`, { action });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [alertsUrl] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/stats'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive'});
    },
  });
  const executeRepairMutation = useMutation({
    mutationFn: async ({ alertId, actionId }: { alertId: string; actionId: string }) => {
      const res = await apiRequest('POST', `/api/admin/ops/alerts/${alertId}/repair`, { actionId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: 'Acción ejecutada', 
          description: data.message,
        });
      } else {
        toast({ 
          title: 'Error', 
          description: data.message, 
          variant: 'destructive'
        });
      }
      queryClient.invalidateQueries({ queryKey: [alertsUrl] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/stats'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive'});
    },
  });
  const handleAction = (id: string, action: string) => {
    updateAlertMutation.mutate({ id, action });
  };
  const handleExecuteRepair = (alertId: string, actionId: string) => {
    executeRepairMutation.mutate({ alertId, actionId });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-4 flex-1">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.critical || 0}</p>
              <p className="text-xs text-muted-foreground">Críticas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats?.high || 0}</p>
              <p className="text-xs text-muted-foreground">Altas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.ack || 0}</p>
              <p className="text-xs text-muted-foreground">Reconocidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
              <p className="text-xs text-muted-foreground">Resueltas</p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="ml-4 shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <Label htmlFor="layout-switch" className="text-xs font-medium">
                  Layout Mode
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${!isLabLayout ? 'font-medium': 'text-muted-foreground'}`}>
                    Exp
                  </span>
                  <Switch
                    id="layout-switch"
                    checked={isLabLayout}
                    onCheckedChange={handleLayoutToggle}
                    disabled={updateLayoutMutation.isPending}
                    data-testid="switch-layout-mode"
                  />
                  <span className={`text-xs ${isLabLayout ? 'font-medium': 'text-muted-foreground'}`}>
                    Lab
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === 'open'? 'default': 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
            data-testid="filter-open"
          >
            Abiertas {stats?.open ? `(${stats.open})` : ''}
          </Button>
          <Button
            variant={statusFilter === 'ack'? 'default': 'outline'}
            size="sm"
            onClick={() => setStatusFilter('ack')}
            data-testid="filter-ack"
          >
            Reconocidas {stats?.ack ? `(${stats.ack})` : ''}
          </Button>
          <Button
            variant={statusFilter === 'all'? 'default': 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            data-testid="filter-all"
          >
            Todas
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {stats?.last_run && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Último check: {formatDistanceToNow(new Date(stats.last_run.created_at), { addSuffix: true, locale: es })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-alerts"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando alertas...</div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No hay alertas {statusFilter === 'open'? 'abiertas': ''}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onAction={handleAction}
              onExecuteRepair={handleExecuteRepair}
            />
          ))}
        </div>
      )}
    </div>
  );
}
