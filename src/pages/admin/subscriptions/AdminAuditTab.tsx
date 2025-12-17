import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Building2,
  User,
  CreditCard,
  Calendar,
  Receipt,
  Webhook,
  Crown,
  GraduationCap,
  Wrench,
  RefreshCw,
  ChevronRight,
  Clock,
  Link2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrganizationListItem {
  id: string;
  name: string;
  plan_name: string;
  created_at: string;
}

interface AuditReport {
  organization: {
    id: string;
    name: string;
    plan_id: string | null;
    plan_name: string | null;
    settings: Record<string, any>;
    created_at: string;
  };
  owner: {
    id: string;
    email: string;
    full_name: string;
  } | null;
  subscription: {
    id: string;
    status: string;
    plan_id: string;
    plan_name: string;
    billing_period: string;
    started_at: string;
    expires_at: string | null;
    provider_subscription_id: string | null;
    amount: number | null;
    currency: string | null;
  } | null;
  billing_cycle: {
    id: string;
    cycle_start: string;
    cycle_end: string;
    status: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    provider: string;
    provider_payment_id: string | null;
  }>;
  payment_events: Array<{
    id: string;
    provider_event_type: string;
    status: string;
    created_at: string;
    custom_id: string | null;
  }>;
  mp_preferences: Array<{
    id: string;
    plan_slug: string;
    billing_period: string;
    created_at: string;
    preapproval_id: string | null;
  }>;
  founder_course_enrollment: {
    enrolled: boolean;
    course_id: string | null;
    course_name: string | null;
    access_type: string | null;
    expires_at: string | null;
  };
  health_checks: {
    has_active_subscription: boolean;
    plan_matches_subscription: boolean;
    has_billing_cycle: boolean;
    has_payments: boolean;
    has_payment_events: boolean;
    is_founder: boolean;
    founder_has_course: boolean;
    all_passed: boolean;
  };
}

function HealthCheckItem({ 
  label, 
  passed, 
  warning = false,
  detail 
}: { 
  label: string; 
  passed: boolean;
  warning?: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle2 className="h-5 w-5 text-chart-positive" />
        ) : warning ? (
          <AlertTriangle className="h-5 w-5 text-chart-neutral" />
        ) : (
          <XCircle className="h-5 w-5 text-chart-negative" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
    </div>
  );
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: es });
  } catch {
    return dateStr;
  }
}

export default function AdminAuditTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: organizations = [], isLoading: orgsLoading, error: orgsError } = useQuery<OrganizationListItem[]>({
    queryKey: ['/api/admin/audit/organizations', 'search', searchTerm],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/audit/organizations?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al buscar');
      return data;
    },
    enabled: searchTerm.length >= 2,
  });

  const { data: auditReport, isLoading: auditLoading, refetch: refetchAudit, error: auditError } = useQuery<AuditReport>({
    queryKey: ['/api/admin/audit/organizations', selectedOrgId, 'audit'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/audit/organizations/${selectedOrgId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al cargar auditoría');
      return data;
    },
    enabled: !!selectedOrgId,
  });

  const repairFounderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/admin/audit/organizations/${selectedOrgId}/repair-founder`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al reparar');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Status de fundador reparado' });
      refetchAudit();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const enrollFounderCourseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/admin/audit/organizations/${selectedOrgId}/enroll-founder-course`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al inscribir');
      return data;
    },
    onSuccess: (data: any) => {
      toast({ 
        title: data.already_enrolled ? 'Ya estaba inscrito' : 'Owner inscrito al curso',
        description: data.course || '',
      });
      refetchAudit();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const syncPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/admin/audit/organizations/${selectedOrgId}/sync-plan`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al sincronizar');
      return data;
    },
    onSuccess: (data: any) => {
      toast({ 
        title: 'Plan sincronizado',
        description: data.message || `Sincronizado a: ${data.synced_to}`,
      });
      refetchAudit();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSearchTerm('');
  };

  const report = auditReport;
  const health = report?.health_checks;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Organización
          </CardTitle>
          <CardDescription>
            Busca por nombre para auditar el estado de pagos y suscripciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Escribe al menos 2 caracteres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              data-testid="input-audit-search"
            />
            {orgsLoading && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {searchTerm.length >= 2 && organizations.length > 0 && (
            <div className="mt-2 border rounded-md divide-y max-h-60 overflow-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSelect(org.id)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center justify-between"
                  data-testid={`button-select-org-${org.id}`}
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Plan: {org.plan_name}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
          
          {searchTerm.length >= 2 && !orgsLoading && organizations.length === 0 && !orgsError && (
            <p className="text-sm text-muted-foreground mt-2">
              No se encontraron organizaciones
            </p>
          )}
          
          {orgsError && (
            <p className="text-sm text-destructive mt-2">
              Error al buscar: {(orgsError as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedOrgId && auditLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {selectedOrgId && auditError && !auditLoading && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error al cargar auditoría: {(auditError as Error).message}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetchAudit()}
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">{report.organization.name}</h2>
                <p className="text-sm text-muted-foreground">
                  ID: {report.organization.id}
                </p>
              </div>
            </div>
            <Badge 
              variant={health?.all_passed ? 'default' : 'destructive'}
              className={health?.all_passed ? 'bg-chart-positive' : ''}
            >
              {health?.all_passed ? 'Todo OK' : 'Requiere Atención'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Health Checks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <HealthCheckItem 
                  label="Plan coincide con suscripción" 
                  passed={health?.plan_matches_subscription || false}
                  detail={report.organization.plan_name || 'Sin plan'}
                />
                <HealthCheckItem 
                  label="Suscripción activa" 
                  passed={health?.has_active_subscription || false}
                  detail={report.subscription?.status}
                />
                <HealthCheckItem 
                  label="Ciclo de facturación" 
                  passed={health?.has_billing_cycle || false}
                  warning={!health?.has_active_subscription}
                />
                <HealthCheckItem 
                  label="Pagos registrados" 
                  passed={health?.has_payments || false}
                  detail={`${report.payments.length} pagos`}
                />
                <HealthCheckItem 
                  label="Webhooks procesados" 
                  passed={health?.has_payment_events || false}
                  detail={`${report.payment_events.length} eventos`}
                />
                <Separator className="my-2" />
                <HealthCheckItem 
                  label="Status Fundador" 
                  passed={health?.is_founder || false}
                  detail={health?.is_founder ? 'Activo' : 'No es fundador'}
                />
                <HealthCheckItem 
                  label="Curso Fundador" 
                  passed={health?.founder_has_course || false}
                  warning={!health?.is_founder}
                  detail={report.founder_course_enrollment.enrolled ? 'Inscrito' : 'No inscrito'}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => repairFounderMutation.mutate()}
                  disabled={repairFounderMutation.isPending || health?.is_founder}
                  data-testid="button-repair-founder"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {repairFounderMutation.isPending ? 'Reparando...' : 'Reparar Status Fundador'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => enrollFounderCourseMutation.mutate()}
                  disabled={enrollFounderCourseMutation.isPending || report.founder_course_enrollment.enrolled}
                  data-testid="button-enroll-founder-course"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {enrollFounderCourseMutation.isPending ? 'Inscribiendo...' : 'Inscribir Owner al Curso Fundador'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => syncPlanMutation.mutate()}
                  disabled={syncPlanMutation.isPending || health?.plan_matches_subscription}
                  data-testid="button-sync-plan"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {syncPlanMutation.isPending ? 'Sincronizando...' : 'Sincronizar Plan con Suscripción'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => refetchAudit()}
                  data-testid="button-refresh-audit"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refrescar Auditoría
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.owner ? (
                  <div className="space-y-1">
                    <p className="font-medium">{report.owner.full_name}</p>
                    <p className="text-sm text-muted-foreground">{report.owner.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">{report.owner.id}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin owner</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.subscription ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.subscription.status === 'active' ? 'default' : 'secondary'}>
                        {report.subscription.status}
                      </Badge>
                      <span className="text-sm">{report.subscription.plan_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.subscription.billing_period === 'annual' ? 'Anual' : 'Mensual'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde: {formatDate(report.subscription.started_at)}
                    </p>
                    {report.subscription.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expira: {formatDate(report.subscription.expires_at)}
                      </p>
                    )}
                    {report.subscription.provider_subscription_id && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        MP: {report.subscription.provider_subscription_id}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin suscripción activa</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ciclo de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.billing_cycle ? (
                  <div className="space-y-1">
                    <Badge variant={report.billing_cycle.status === 'active' ? 'default' : 'secondary'}>
                      {report.billing_cycle.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Inicio: {formatDate(report.billing_cycle.cycle_start)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fin: {formatDate(report.billing_cycle.cycle_end)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ciclo activo</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Historial de Pagos ({report.payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.payments.length > 0 ? (
                <div className="space-y-2">
                  {report.payments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {payment.currency} {payment.amount?.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.provider} • {formatDate(payment.created_at)}
                          </p>
                        </div>
                      </div>
                      {payment.provider_payment_id && (
                        <code className="text-xs text-muted-foreground">
                          {payment.provider_payment_id.substring(0, 20)}...
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhooks ({report.payment_events.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.payment_events.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {report.payment_events.map((event) => (
                      <div 
                        key={event.id} 
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="text-sm font-mono">{event.provider_event_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.created_at)}
                          </p>
                        </div>
                        <Badge variant={event.status === 'PROCESSED' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin eventos de webhook</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  MP Preferences ({report.mp_preferences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.mp_preferences.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {report.mp_preferences.map((pref) => (
                      <div 
                        key={pref.id} 
                        className="py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-1 rounded">{pref.id}</code>
                          <Badge variant="outline">{pref.plan_slug}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pref.billing_period} • {formatDate(pref.created_at)}
                        </p>
                        {pref.preapproval_id && (
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            Preapproval: {pref.preapproval_id}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin preferencias MP</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Raw Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                {JSON.stringify(report.organization.settings, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
