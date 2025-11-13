import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard, Download, ArrowUpCircle, Inbox, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser, refreshCurrentUserCache } from '@/hooks/use-current-user';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useLocation } from 'wouter';

interface OrganizationSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  started_at: string;
  expires_at: string;
  amount: number;
  currency: string;
  scheduled_downgrade_plan_id?: string | null;
  plans: {
    name: string;
    slug: string;
  };
  scheduled_downgrade_plan?: {
    name: string;
    slug: string;
  } | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  provider: string;
  provider_payment_id: string;
  payer_email: string;
  created_at: string;
}

const Billing = () => {
  const { currentOrganizationId } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success' && currentOrganizationId) {
      refreshCurrentUserCache(queryClient).then(() => {
        queryClient.invalidateQueries({ queryKey: ['current-subscription', currentOrganizationId] });
        queryClient.invalidateQueries({ queryKey: ['subscription-payments', currentOrganizationId] });
        queryClient.invalidateQueries({ queryKey: ['organization', currentOrganizationId] });
      });
      
      toast({
        title: '¡Pago exitoso!',
        description: 'Tu suscripción ha sido activada correctamente.',
      });

      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('collection_id');
      url.searchParams.delete('collection_status');
      url.searchParams.delete('payment_id');
      url.searchParams.delete('status');
      url.searchParams.delete('external_reference');
      url.searchParams.delete('payment_type');
      url.searchParams.delete('merchant_order_id');
      url.searchParams.delete('preference_id');
      url.searchParams.delete('site_id');
      url.searchParams.delete('processing_mode');
      url.searchParams.delete('merchant_account_id');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [currentOrganizationId, toast]);

  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError, refetch: refetchSubscription } = useQuery<OrganizationSubscription | null>({
    queryKey: ['current-subscription', currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) throw new Error('Missing required data');

      const { data, error} = await supabase
        .from('organization_subscriptions')
        .select(`
          id,
          plan_id,
          status,
          billing_period,
          started_at,
          expires_at,
          amount,
          currency,
          scheduled_downgrade_plan_id,
          plans!plan_id(name, slug),
          scheduled_downgrade_plan:plans!scheduled_downgrade_plan_id(name, slug)
        `)
        .eq('organization_id', currentOrganizationId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
    enabled: !!currentOrganizationId && !!supabase,
  });

  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: ['subscription-payments', currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) throw new Error('Missing required data');

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .eq('product_type', 'subscription')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganizationId && !!supabase,
  });

  const { data: organization } = useQuery<{ name: string; logo_url: string | null; plan_id: string | null; plans: { name: string; slug: string } | null }>({
    queryKey: ['organization', currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) throw new Error('Missing required data');

      const { data, error } = await supabase
        .from('organizations')
        .select('name, logo_url, plan_id, plans(name, slug)')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!currentOrganizationId && !!supabase,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return await apiRequest('POST', `/api/subscriptions/${subscriptionId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: 'Suscripción cancelada',
        description: 'Tu suscripción ha sido cancelada. Mantendrás acceso hasta la fecha de expiración.',
      });
      queryClient.invalidateQueries({ queryKey: ['current-subscription', currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-payments', currentOrganizationId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar la suscripción',
        variant: 'destructive',
      });
    },
  });

  const planName = organization?.plans?.name || subscription?.plans?.name || 'Free';
  const planSlug = organization?.plans?.slug || subscription?.plans?.slug || 'free';
  const billingPeriod = subscription?.billing_period === 'monthly' ? 'mes' : 'año';
  const amount = subscription?.amount || 0;
  const currency = subscription?.currency || 'USD';
  const expiresAt = subscription?.expires_at;
  const subscriptionStatus = subscription?.status || 'free';

  const isFreePlan = planSlug === 'free';
  const isCancelled = subscriptionStatus === 'cancelled';
  const isActive = subscriptionStatus === 'active';

  const getPlanBadgeClass = (slug: string) => {
    const classes: Record<string, string> = {
      'free': 'plan-card-free',
      'pro': 'plan-card-pro',
      'teams': 'plan-card-teams',
      'enterprise': 'plan-card-enterprise',
    };
    return classes[slug.toLowerCase()] || classes['free'];
  };

  const getNextPlan = () => {
    const planHierarchy: Record<string, { slug: string; name: string } | null> = {
      'free': { slug: 'pro', name: 'PRO' },
      'pro': { slug: 'teams', name: 'TEAMS' },
      'teams': { slug: 'enterprise', name: 'ENTERPRISE' },
      'enterprise': null,
    };
    return planHierarchy[planSlug.toLowerCase()] || null;
  };

  const columns = [
    {
      key: 'invoice',
      label: 'Factura',
      width: '25%',
      render: (payment: Payment) => (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                #{payment.provider_payment_id?.slice(0, 12) || payment.id.slice(0, 12)}
              </span>
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                Pagado
              </Badge>
            </div>
          </div>
          {organization && (
            <PDFDownloadLink
              document={
                <InvoicePDF
                  payment={payment}
                  subscription={subscription ?? null}
                  organization={organization}
                />
              }
              fileName={`factura-${payment.provider_payment_id?.slice(0, 12) || payment.id.slice(0, 12)}.pdf`}
            >
              {({ loading }) => (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  disabled={loading}
                  data-testid={`button-download-invoice-${payment.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '20%',
      render: (payment: Payment) => (
        <span className="text-sm">
          {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: es })}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '15%',
      render: (payment: Payment) => (
        <span className="text-sm font-medium">
          {currency} ${parseFloat(payment.amount.toString()).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      width: '20%',
      render: () => (
        <span className="text-sm">{planName}</span>
      ),
    },
    {
      key: 'method',
      label: 'Método',
      width: '20%',
      render: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <img 
            src={payment.provider === 'paypal' ? '/Paypal_2014_logo.png' : '/MercadoPago_logo.png'}
            alt={payment.provider === 'paypal' ? 'PayPal' : 'MercadoPago'}
            className="h-4 w-auto object-contain"
          />
          <span className="text-sm">
            {payment.provider === 'paypal' ? 'PayPal' : 'MercadoPago'}
          </span>
        </div>
      ),
    },
  ];

  const headerProps = {
    title: "Facturación",
    icon: CreditCard,
    subtitle: "Suscripción y Pagos",
    description: "Gestiona tu plan de suscripción, consulta tu historial de pagos y descarga facturas.",
  };

  return (
    <Layout wide={false} headerProps={headerProps}>
      <div className="space-y-6">
        {subscriptionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar la suscripción</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>No se pudo cargar la información de tu suscripción. Por favor, intenta nuevamente.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchSubscription()}
                className="ml-4"
                data-testid="button-retry-subscription"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {paymentsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar pagos</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>No se pudo cargar el historial de pagos. Por favor, intenta nuevamente.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchPayments()}
                className="ml-4"
                data-testid="button-retry-payments"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Plan Actual</CardTitle>
              <Badge 
                className={`text-xs text-white ${getPlanBadgeClass(planSlug)}`}
              >
                {planName}
              </Badge>
            </div>
            <CardDescription className="mb-4">
              Tu plan de suscripción y detalles de facturación
            </CardDescription>
            
            {subscriptionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">${amount}</span>
                  <span className="text-muted-foreground">/ {billingPeriod}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {expiresAt && !isFreePlan && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {isCancelled ? 'Expira el:' : 'Próxima renovación:'}
                      </span>
                      <span className="font-medium">
                        {format(new Date(expiresAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Tu suscripción está cancelada. Mantendrás acceso a las funciones premium hasta la fecha de expiración.
                      </p>
                    </div>
                  )}

                  {subscription?.scheduled_downgrade_plan_id && subscription?.scheduled_downgrade_plan && (
                    <div className="bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                          Cambio Programado
                        </Badge>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-400">
                        Tu plan cambiará a <strong>{subscription.scheduled_downgrade_plan.name}</strong> {expiresAt ? `el ${format(new Date(expiresAt), 'dd MMM yyyy', { locale: es })}` : 'al final del ciclo actual'}.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {isActive && (
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      onClick={() => {
                        openModal('delete-confirmation', {
                          mode: 'dangerous',
                          title: 'Cancelar Suscripción',
                          description: `¿Estás seguro que deseas cancelar tu suscripción al plan ${planName}? Mantendrás acceso hasta ${expiresAt ? format(new Date(expiresAt), 'dd MMM yyyy', { locale: es }) : 'el final del período de facturación'}. Después de esa fecha, tu plan volverá a Free.`,
                          itemName: 'CANCELAR',
                          destructiveActionText: 'Cancelar Suscripción',
                          onConfirm: () => {
                            if (subscription?.id) {
                              cancelSubscriptionMutation.mutate(subscription.id);
                            }
                          },
                          isLoading: cancelSubscriptionMutation.isPending
                        });
                      }}
                      data-testid="button-cancel-subscription"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Suscripción
                    </Button>
                  )}
                  
                  {getNextPlan() && (
                    <Button 
                      className={cn(
                        "w-full text-white",
                        `plan-card-${getNextPlan()?.slug}`
                      )}
                      onClick={() => setLocation('/settings/pricing-plan')}
                      data-testid="button-upgrade-plan"
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      {isFreePlan ? 'Mejorar Plan' : `Mejorar a ${getNextPlan()?.name}`}
                    </Button>
                  )}
                </div>
              </>
            )}
          </StatCard>

          <StatCard>
            <CardTitle className="text-lg mb-4">Método de Pago</CardTitle>
            <CardDescription className="mb-4">
              Administra tu información de pago
            </CardDescription>
            
            {subscriptionLoading || paymentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : isFreePlan ? (
              <div className="text-sm text-muted-foreground">
                No hay método de pago configurado para el plan Free
              </div>
            ) : payments.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded-md bg-white dark:bg-gray-800 border border-border flex items-center justify-center p-1">
                  <img 
                    src={payments[0].provider === 'paypal' ? '/Paypal_2014_logo.png' : '/MercadoPago_logo.png'}
                    alt={payments[0].provider === 'paypal' ? 'PayPal' : 'MercadoPago'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {payments[0].provider === 'paypal' ? 'PayPal' : 'MercadoPago'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payments[0].payer_email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No hay métodos de pago registrados
              </div>
            )}
          </StatCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Facturación</CardTitle>
            <CardDescription>
              Descarga tus facturas y revisa el historial de pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              columns={columns}
              data={payments}
              isLoading={paymentsLoading}
              rowActions={(payment: Payment) => [
                {
                  icon: Download,
                  label: 'Descargar',
                  onClick: () => console.log('Download invoice:', payment.id)
                }
              ]}
              emptyStateConfig={{
                icon: <Inbox />,
                title: 'No hay facturas',
                description: 'Tus facturas aparecerán aquí cuando realices pagos.',
              }}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Billing;
