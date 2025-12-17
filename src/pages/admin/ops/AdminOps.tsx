import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Bell,
  Webhook,
  Briefcase,
  BookOpen,
  Eye,
  Check,
  X,
  RotateCcw,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OpsAlert {
  id: string;
  created_at: string;
  updated_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'ack' | 'resolved' | 'dismissed';
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

interface CheckRun {
  id: string;
  created_at: string;
  check_suite: string;
  status: string;
  duration_ms: number | null;
  stats: Record<string, any>;
  error_message: string | null;
}

interface Runbook {
  id: string;
  alert_type: string;
  title: string;
  steps_md: string;
  links: Array<{ label: string; url: string }>;
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive" className="bg-red-600">Crítico</Badge>;
    case 'high':
      return <Badge variant="destructive">Alto</Badge>;
    case 'medium':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medio</Badge>;
    default:
      return <Badge variant="secondary">Bajo</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge variant="destructive">Abierta</Badge>;
    case 'ack':
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Reconocida</Badge>;
    case 'resolved':
      return <Badge variant="outline" className="border-green-500 text-green-600">Resuelta</Badge>;
    case 'dismissed':
      return <Badge variant="secondary">Descartada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function AlertCard({ alert, onAction }: { alert: OpsAlert; onAction: (id: string, action: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`border-l-4 ${
      alert.severity === 'critical' ? 'border-l-red-600' :
      alert.severity === 'high' ? 'border-l-red-500' :
      alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-gray-400'
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-${alert.id}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {alert.status === 'open' && (
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
            {(alert.status === 'open' || alert.status === 'ack') && (
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
            {(alert.status === 'open' || alert.status === 'ack') && (
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
            {(alert.status === 'resolved' || alert.status === 'dismissed') && (
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

        {expanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <code className="bg-muted px-1 rounded">{alert.alert_type}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  {alert.provider || '-'}
                </div>
                {alert.provider_payment_id && (
                  <div>
                    <span className="text-muted-foreground">Payment ID:</span>{' '}
                    <code className="bg-muted px-1 rounded text-xs">{alert.provider_payment_id}</code>
                  </div>
                )}
                {alert.fingerprint && (
                  <div>
                    <span className="text-muted-foreground">Fingerprint:</span>{' '}
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
  );
}

function AlertsTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('open');

  const { data: alerts = [], isLoading, refetch } = useQuery<OpsAlert[]>({
    queryKey: ['/api/admin/ops/alerts', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/admin/ops/alerts?${params.toString()}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
  });

  const { data: stats } = useQuery<OpsStats>({
    queryKey: ['/api/admin/ops/stats'],
  });

  const runChecksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/ops/run-checks');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Checks ejecutados', description: `Alertas creadas: ${data.stats?.total_created || 0}` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/check-runs'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/ops/alerts/${id}`, { action });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/stats'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAction = (id: string, action: string) => {
    updateAlertMutation.mutate({ id, action });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
            data-testid="filter-open"
          >
            Abiertas {stats?.open ? `(${stats.open})` : ''}
          </Button>
          <Button
            variant={statusFilter === 'ack' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('ack')}
            data-testid="filter-ack"
          >
            Reconocidas {stats?.ack ? `(${stats.ack})` : ''}
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            data-testid="filter-all"
          >
            Todas
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-alerts"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refrescar
          </Button>
          <Button
            size="sm"
            onClick={() => runChecksMutation.mutate()}
            disabled={runChecksMutation.isPending}
            data-testid="button-run-checks"
          >
            <Play className="h-4 w-4 mr-1" />
            {runChecksMutation.isPending ? 'Ejecutando...' : 'Ejecutar Checks'}
          </Button>
        </div>
      </div>

      {stats?.last_run && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Último check: {formatDistanceToNow(new Date(stats.last_run.created_at), { addSuffix: true, locale: es })}
          {stats.last_run.duration_ms && ` (${stats.last_run.duration_ms}ms)`}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando alertas...</div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No hay alertas {statusFilter === 'open' ? 'abiertas' : ''}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckRunsTab() {
  const { data: runs = [], isLoading } = useQuery<CheckRun[]>({
    queryKey: ['/api/admin/ops/check-runs'],
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>;
  }

  return (
    <div className="space-y-2">
      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay ejecuciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        runs.map((run) => (
          <Card key={run.id} data-testid={`run-card-${run.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {run.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : run.status === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{run.check_suite}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      {run.duration_ms && ` · ${run.duration_ms}ms`}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  {run.stats?.alerts_opened !== undefined && (
                    <p>Alertas creadas: <span className="font-medium">{run.stats.alerts_opened}</span></p>
                  )}
                  {run.stats?.scanned !== undefined && (
                    <p className="text-muted-foreground">Items escaneados: {run.stats.scanned}</p>
                  )}
                </div>
              </div>
              {run.error_message && (
                <p className="text-xs text-red-600 mt-2">{run.error_message}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function RunbooksTab() {
  const { data: runbooks = [], isLoading } = useQuery<Runbook[]>({
    queryKey: ['/api/admin/ops/runbooks'],
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando runbooks...</div>;
  }

  const defaultRunbooks = [
    {
      alert_type: 'payment.approved_but_not_applied',
      title: 'Pago aprobado pero plan no aplicado',
      steps: [
        '1. Verificar en Supabase que el pago existe en `payments` con status `approved`',
        '2. Verificar el `product_id` del pago (debería ser el UUID del plan)',
        '3. Comparar con `organizations.plan_id`',
        '4. Si no coinciden, actualizar `organizations.plan_id` manualmente',
        '5. Crear billing_cycle si es necesario',
        '6. Marcar alerta como resuelta'
      ]
    },
    {
      alert_type: 'webhook.stuck_received',
      title: 'Webhook atascado en RECEIVED',
      steps: [
        '1. Revisar logs del servidor al momento del webhook',
        '2. Verificar que el custom_id del evento es válido',
        '3. Intentar reprocesar manualmente si es posible',
        '4. Si el pago ya fue procesado por otro evento, marcar como descartado',
        '5. Si requiere acción, procesar y marcar como resuelto'
      ]
    },
    {
      alert_type: 'job.failed',
      title: 'Job del sistema falló',
      steps: [
        '1. Revisar el error_message del job',
        '2. Verificar logs del servidor',
        '3. Si es transitorio, ejecutar manualmente',
        '4. Si es un bug, reportar y arreglar',
        '5. Marcar alerta como resuelta'
      ]
    }
  ];

  const allRunbooks = runbooks.length > 0 ? runbooks : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Guías de resolución para cada tipo de alerta.
      </p>
      
      {defaultRunbooks.map((rb) => {
        const saved = allRunbooks.find(r => r.alert_type === rb.alert_type);
        return (
          <Card key={rb.alert_type} data-testid={`runbook-${rb.alert_type}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {rb.title}
              </CardTitle>
              <CardDescription>
                <code className="text-xs">{rb.alert_type}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {(saved?.steps_md || rb.steps.join('\n')).split('\n').map((step, i) => (
                  <p key={i} className="text-muted-foreground">{step}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminOps() {
  const { data: stats } = useQuery<OpsStats>({
    queryKey: ['/api/admin/ops/stats'],
  });

  const totalOpen = (stats?.open || 0) + (stats?.ack || 0);
  const hasCritical = (stats?.critical || 0) > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${hasCritical ? 'bg-red-100 dark:bg-red-900/30' : totalOpen > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
            {hasCritical ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : totalOpen > 0 ? (
              <Bell className="h-6 w-6 text-yellow-600" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Operations Center</h1>
            <p className="text-muted-foreground text-sm">
              {hasCritical
                ? `${stats?.critical} alertas críticas requieren atención`
                : totalOpen > 0
                ? `${totalOpen} alertas abiertas`
                : 'Todos los sistemas operando normalmente'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
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

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts" className="flex items-center gap-1" data-testid="tab-alerts">
            <Bell className="h-4 w-4" />
            Alertas
            {totalOpen > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{totalOpen}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1" data-testid="tab-history">
            <Activity className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="runbooks" className="flex items-center gap-1" data-testid="tab-runbooks">
            <BookOpen className="h-4 w-4" />
            Runbooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>

        <TabsContent value="history">
          <CheckRunsTab />
        </TabsContent>

        <TabsContent value="runbooks">
          <RunbooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
