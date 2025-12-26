import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
function HealthCheckRow({ 
  label, 
  passed, 
  warning = false,
  detail,
  action,
  actionLabel,
  actionLoading,
  onAction
}: { 
  label: string; 
  passed: boolean;
  warning?: boolean;
  detail?: string;
  action?: boolean;
  actionLabel?: string;
  actionLoading?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {passed ? (
          <CheckCircle2 className="h-4 w-4 text-positive shrink-0" />
        ) : warning ? (
          <AlertTriangle className="h-4 w-4 text-neutral shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-negative shrink-0" />
        )}
        <span className="text-sm truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {passed && detail && (
          <span className="text-xs text-muted-foreground">{detail}</span>
        )}
        {!passed && action && onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            disabled={actionLoading}
            className="h-7 text-xs"
          >
            {actionLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              actionLabel || 'Reparar'
            )}
          </Button>
        )}
        {!passed && !action && detail && (
          <span className="text-xs text-muted-foreground">{detail}</span>
        )}
      </div>
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
interface AdminAuditTabProps {
  onRefreshAction?: (refetchFn: () => void) => void;
}
export default function AdminAuditTab({ onRefreshAction }: AdminAuditTabProps) {
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
      toast({ title: 'Status de fundador reparado'});
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
        title: data.already_enrolled ? 'Ya estaba inscrito': 'Owner inscrito al curso',
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
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
        <Card>
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
                <h2 className="text-xl font-semibold">{report.organization.name}</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  {report.organization.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchAudit()}
                data-testid="button-refresh-audit"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Badge 
                variant={health?.all_passed ? 'default': 'destructive'}
                className={health?.all_passed ? 'bg-positive': ''}
              >
                {health?.all_passed ? 'OK': 'Requiere Atención'}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.owner ? (
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{report.owner.full_name}</p>
                    <p className="text-xs text-muted-foreground">{report.owner.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin owner</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.subscription ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.subscription.status === 'active'? 'default': 'secondary'} className="text-xs">
                        {report.subscription.status}
                      </Badge>
                      <span className="text-sm">{report.subscription.plan_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {report.subscription.billing_period === 'annual'? 'Anual': 'Mensual'} • Desde {formatDate(report.subscription.started_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin suscripción activa</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ciclo Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.billing_cycle ? (
                  <div className="space-y-0.5">
                    <Badge variant="outline" className="text-xs">{report.billing_cycle.status}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(report.billing_cycle.cycle_start)} - {formatDate(report.billing_cycle.cycle_end)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ciclo de facturación</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Health Checks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <HealthCheckRow 
                label="Plan coincide con suscripción" 
                passed={health?.plan_matches_subscription || false}
                detail={report.organization.plan_name || 'Sin plan'}
                action={!health?.plan_matches_subscription}
                actionLabel="Sincronizar"
                actionLoading={syncPlanMutation.isPending}
                onAction={() => syncPlanMutation.mutate()}
              />
              <HealthCheckRow 
                label="Suscripción activa" 
                passed={health?.has_active_subscription || false}
                detail={report.subscription?.status || 'Sin suscripción'}
              />
              <HealthCheckRow 
                label="Ciclo de facturación" 
                passed={health?.has_billing_cycle || false}
                warning={!health?.has_active_subscription}
                detail={report.billing_cycle ? 'Activo': 'Sin ciclo'}
              />
              <HealthCheckRow 
                label="Pagos registrados" 
                passed={health?.has_payments || false}
                detail={`${report.payments.length} pagos`}
              />
              <HealthCheckRow 
                label="Webhooks procesados" 
                passed={health?.has_payment_events || false}
                detail={`${report.payment_events.length} eventos`}
              />
              <Separator className="my-2" />
              <HealthCheckRow 
                label="Status Fundador" 
                passed={health?.is_founder || false}
                detail={health?.is_founder ? 'Activo': 'No es fundador'}
                action={!health?.is_founder}
                actionLabel="Activar"
                actionLoading={repairFounderMutation.isPending}
                onAction={() => repairFounderMutation.mutate()}
              />
              <HealthCheckRow 
                label="Curso Fundador" 
                passed={health?.founder_has_course || false}
                warning={!health?.is_founder}
                detail={report.founder_course_enrollment.enrolled ? 'Inscrito': 'No inscrito'}
                action={!health?.founder_has_course && health?.is_founder}
                actionLabel="Inscribir"
                actionLoading={enrollFounderCourseMutation.isPending}
                onAction={() => enrollFounderCourseMutation.mutate()}
              />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Pagos ({report.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.payments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {report.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={payment.status === 'completed'? 'default': 'secondary'} className="text-xs">
                            {payment.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{payment.provider}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">${payment.amount} {payment.currency}</span>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Eventos de Webhook ({report.payment_events.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.payment_events.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {report.payment_events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.status === 'processed'? 'default': 'secondary'} className="text-xs">
                            {event.status}
                          </Badge>
                          <span className="text-xs font-mono truncate max-w-32">{event.provider_event_type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin eventos de webhook</p>
                )}
              </CardContent>
            </Card>
          </div>
          {report.mp_preferences.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  MercadoPago Preferences ({report.mp_preferences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {report.mp_preferences.map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{pref.plan_slug}</Badge>
                        <span className="text-xs">{pref.billing_period === 'annual'? 'Anual': 'Mensual'}</span>
                      </div>
                      <div className="text-right">
                        {pref.preapproval_id && (
                          <p className="text-xs font-mono truncate max-w-32">{pref.preapproval_id}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatDate(pref.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Curso Fundador
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.founder_course_enrollment.enrolled ? (
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{report.founder_course_enrollment.course_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Acceso: {report.founder_course_enrollment.access_type}
                    {report.founder_course_enrollment.expires_at && 
                      ` • Expira: ${formatDate(report.founder_course_enrollment.expires_at)}`
                    }
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">No inscrito al curso fundador</p>
                  {health?.is_founder && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enrollFounderCourseMutation.mutate()}
                      disabled={enrollFounderCourseMutation.isPending}
                      className="h-7 text-xs"
                    >
                      {enrollFounderCourseMutation.isPending ? 'Inscribiendo...': 'Inscribir'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
