import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOptimisticMutation } from '@/core/save-engine';
import { useProjectContext } from '@/stores/projectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta } from '@/components/ActivityCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/shared/table/Table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard, Download, ArrowUpCircle, Inbox, XCircle, AlertCircle, RefreshCw, Activity, ExternalLink, Clock, RotateCcw, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/features/pdf';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser, refreshCurrentUserCache } from '@/hooks/use-current-user';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useGlobalModalStore } from '@/components/modal';
import { useLocation } from 'wouter';
import { getPlanConfig } from '@/features/shared-content/pricing/data/plans-config';
import { organizationKeys } from '@/core/query-keys';
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
  plan_id: string | null;
  plans: {
    name: string;
    slug: string;
  } | null;
}
interface NextInvoice {
  seats: number;
  pricePerSeat: number;
  baseAmount: number;
  prorationAdjustment: number;
  totalAmount: number;
  currency: string;
  nextBillingDate: string | null;
}
export function OrganizationBillingView() {
  const { currentOrganizationId } = useProjectContext();
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus && currentOrganizationId) {
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
      if (paymentStatus === 'success') {
        refreshCurrentUserCache(queryClient).then(() => {
          queryClient.invalidateQueries({ queryKey: organizationKeys.subscription(currentOrganizationId) });
          queryClient.invalidateQueries({ queryKey: organizationKeys.payments(currentOrganizationId) });
          queryClient.invalidateQueries({ queryKey: organizationKeys.info(currentOrganizationId) });
        });
        
        openModal('payment-feedback', {
          type: 'success',
          planName: userData?.organization?.plan?.name,
          isFounder: userData?.organization?.settings?.is_founder || false,
        });
      } else if (paymentStatus === 'cancelled') {
        openModal('payment-feedback', {
          type: 'cancelled',
        });
      }
    }
  }, [currentOrganizationId, openModal, userData]);
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError, refetch: refetchSubscription } = useQuery<OrganizationSubscription | null>({
    queryKey: organizationKeys.subscription(currentOrganizationId),
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
          plans!plan_id(name, slug)
        `)
        .eq('organization_id', currentOrganizationId)
        .in('status', ['active', 'cancelled'])
        .gt('expires_at', new Date().toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      
      if (data) {
        try {
          const { data: fullData } = await supabase
            .from('organization_subscriptions')
            .select('scheduled_downgrade_plan_id')
            .eq('id', data.id)
            .maybeSingle();
          
          if (fullData?.scheduled_downgrade_plan_id) {
            (data as any).scheduled_downgrade_plan_id = fullData.scheduled_downgrade_plan_id;
            
            const { data: scheduledPlan } = await supabase
              .from('plans')
              .select('name, slug')
              .eq('id', fullData.scheduled_downgrade_plan_id)
              .maybeSingle();
            
            if (scheduledPlan) {
              (data as any).scheduled_downgrade_plan = scheduledPlan;
            }
          }
        } catch (err) {
          console.log('Note: scheduled_downgrade_plan_id column not yet in database');
        }
      }
      
      return data as any;
    },
    enabled: !!currentOrganizationId && !!supabase,
  });
  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: organizationKeys.payments(currentOrganizationId),
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) throw new Error('Missing required data');
      // Get payments for subscriptions (including upgrades)
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .in('product_type', ['subscription', 'subscription_upgrade'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch plan info for each payment that has a product_id
      const paymentsWithPlans = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let plans = null;
          if (payment.product_id) {
            const { data: planData } = await supabase
              .from('plans')
              .select('name, slug')
              .eq('id', payment.product_id)
              .maybeSingle();
            plans = planData;
          }
          return { ...payment, plans, plan_id: payment.product_id };
        })
      );
      
      return paymentsWithPlans;
    },
    enabled: !!currentOrganizationId && !!supabase,
  });
  const { data: organization } = useQuery<{ name: string; logo_url: string | null; plan_id: string | null; plans: { name: string; slug: string } | null }>({
    queryKey: organizationKeys.info(currentOrganizationId),
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) throw new Error('Missing required data');
      const { data, error } = await supabase
        .from('organizations')
        .select('name, image_bucket, image_path, plan_id, plans(name, slug)')
        .eq('is_deleted', false)
        .eq('id', currentOrganizationId)
        .single();
      if (error) throw error;
      
      let logo_url: string | null = null;
      if (data?.image_bucket && data?.image_path) {
        const { data: urlData } = supabase.storage
          .from(data.image_bucket)
          .getPublicUrl(data.image_path);
        logo_url = urlData.publicUrl;
      }
      
      return { ...data, logo_url } as any;
    },
    enabled: !!currentOrganizationId && !!supabase,
  });
  const planSlug = organization?.plans?.slug || subscription?.plans?.slug || 'free';
  const isTeamsPlan = planSlug === 'teams';
  const { data: nextInvoice } = useQuery<NextInvoice>({
    queryKey: organizationKeys.nextInvoice(currentOrganizationId),
    queryFn: async () => {
      const response = await fetch(`/api/billing/next-invoice?organizationId=${currentOrganizationId}`);
      if (!response.ok) throw new Error('Failed to fetch next invoice');
      return response.json();
    },
    enabled: !!currentOrganizationId && isTeamsPlan,
  });
  const { data: billingCycles = [] } = useQuery<any[]>({
    queryKey: organizationKeys.billingCycles(currentOrganizationId),
    queryFn: async () => {
      const response = await fetch(`/api/billing/cycles?organizationId=${currentOrganizationId}`);
      if (!response.ok) throw new Error('Failed to fetch billing cycles');
      return response.json();
    },
    enabled: !!currentOrganizationId && isTeamsPlan,
  });
  const cancelSubscriptionMutation = useOptimisticMutation({
    mutationFn: async (subscriptionId: string) => {
      return await apiRequest('POST', `/api/subscriptions/${subscriptionId}/cancel`);
    },
    queryKey: organizationKeys.subscription(currentOrganizationId),
    optimisticUpdate: (oldData, _subscriptionId) => {
      if (!oldData) return oldData;
      return { ...oldData, status: 'cancelled'};
    },
    onSuccessMessage: 'Suscripción cancelada. Mantendrás acceso hasta la fecha de expiración.',
    onErrorMessage: 'No se pudo cancelar la suscripción',
  });
  const cancelScheduledDowngradeMutation = useOptimisticMutation<unknown, void>({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/subscriptions/cancel-scheduled-downgrade');
    },
    queryKey: organizationKeys.subscription(currentOrganizationId),
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, scheduled_downgrade_plan_id: null, scheduled_downgrade_plan: null };
    },
    onSuccessMessage: 'El cambio de plan programado ha sido cancelado.',
    onErrorMessage: 'No se pudo cancelar el cambio programado',
  });
  const planName = organization?.plans?.name || subscription?.plans?.name || 'Free';
  const billingPeriod = subscription?.billing_period === 'monthly'? 'mes': 'año';
  const amount = subscription?.amount || 0;
  const currency = subscription?.currency || 'USD';
  const expiresAt = subscription?.expires_at;
  const subscriptionStatus = subscription?.status || 'free';
  const isFreePlan = planSlug === 'free';
  const isCancelled = subscriptionStatus === 'cancelled';
  const isActive = subscriptionStatus === 'active';
  const getDaysRemaining = () => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expDate = new Date(expiresAt);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  const daysRemaining = getDaysRemaining();
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
      'free': { slug: 'pro', name: 'PRO'},
      'pro': { slug: 'teams', name: 'TEAMS'},
      'teams': { slug: 'enterprise', name: 'ENTERPRISE'},
      'enterprise': null,
    };
    return planHierarchy[planSlug.toLowerCase()] || null;
  };
  const handleDownloadInvoice = async (payment: Payment) => {
    if (!organization || !subscription) return;
    try {
      const document = (
        <InvoicePDF
          payment={payment}
          subscription={subscription}
          organization={organization}
        />
      );
      const asPdf = await pdf(document).toBlob();
      const url = URL.createObjectURL(asPdf);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = `factura-${payment.provider_payment_id?.slice(0, 12) || payment.id.slice(0, 12)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar la factura',
        variant: 'destructive',
      });
    }
  };
  const columns = [
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
      key: 'plan',
      label: 'Plan',
      width: '20%',
      render: (payment: Payment) => (
        <span className="text-sm">{payment.plans?.name || planName}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '20%',
      render: (payment: Payment) => (
        <span className="text-sm font-medium">
          {currency} ${parseFloat(payment.amount.toString()).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Método',
      width: '20%',
      render: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <img 
            src={payment.provider === 'paypal'? '/Paypal_2014_logo.png': '/MercadoPago_logo.png'}
            alt={payment.provider === 'paypal'? 'PayPal': 'MercadoPago'}
            className="h-4 w-auto object-contain"
          />
          <span className="text-sm">
            {payment.provider === 'paypal'? 'PayPal': 'MercadoPago'}
          </span>
        </div>
      ),
    },
    {
      key: 'invoice',
      label: 'Factura',
      width: '20%',
      render: () => (
        <Badge variant="success" className="text-xs">
          Pagado
        </Badge>
      ),
    },
  ];
  return (
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
        <AppCard>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg">Plan Actual</CardTitle>
            <div className="flex items-center gap-2">
              {isCancelled && (
                <Badge 
                  variant="warning"
                  className="text-xs"
                >
                  Cancelada
                </Badge>
              )}
              {subscription?.scheduled_downgrade_plan_id && !isCancelled && (
                <Badge 
                  variant="info"
                  className="text-xs"
                >
                  Cambio Programado → {subscription?.scheduled_downgrade_plan?.name}
                </Badge>
              )}
              <Badge 
                variant={`plan-${planSlug}` as any}
              >
                {planName}
              </Badge>
            </div>
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
                      {isCancelled ? 'Expira el:': 'Próxima renovación:'}
                    </span>
                    <span className="font-medium">
                      {format(new Date(expiresAt), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                )}
                {isCancelled && (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          Suscripción Cancelada
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                          {daysRemaining > 0 
                            ? `Te quedan ${daysRemaining} día${daysRemaining !== 1 ? 's': ''} de acceso a ${planName}.`
                            : 'Tu acceso expira hoy.'
                          }
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Después del {expiresAt ? format(new Date(expiresAt), 'dd MMM yyyy', { locale: es }) : 'vencimiento'}, 
                          tu plan cambiará automáticamente a Free.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {subscription?.scheduled_downgrade_plan_id && subscription?.scheduled_downgrade_plan && !isCancelled && (
                  <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ArrowDownCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                            Cambio de Plan Programado
                          </h4>
                          <Badge variant="info" className="text-xs">
                            {subscription.scheduled_downgrade_plan.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                          Tu plan cambiará de <strong>{planName}</strong> a <strong>{subscription.scheduled_downgrade_plan.name}</strong> {expiresAt ? `el ${format(new Date(expiresAt), 'dd MMM yyyy', { locale: es })}` : 'al final del ciclo actual'}.
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                          Mantendrás acceso a todas las funciones de {planName} hasta esa fecha.
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => cancelScheduledDowngradeMutation.mutate()}
                          disabled={cancelScheduledDowngradeMutation.isPending}
                          data-testid="button-cancel-scheduled-downgrade"
                        >
                          {cancelScheduledDowngradeMutation.isPending ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                              Cancelando...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1.5" />
                              Cancelar Cambio
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {isActive && !isFreePlan && (
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
                {isCancelled && (
                  <Button 
                    onClick={() => setLocation('/settings/pricing-plan')}
                    data-testid="button-reactivate-subscription"
                    className="w-full text-white"
                    style={{ backgroundColor: `var(--plan-${planSlug})` }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reactivar {planName}
                  </Button>
                )}
                
                {getNextPlan() && !isCancelled && (
                  <Button 
                    onClick={() => {
                      if (getNextPlan()?.slug === 'enterprise') {
                        setLocation('/contact');
                      } else {
                        setLocation('/settings/pricing-plan');
                      }
                    }}
                    data-testid="button-upgrade-plan"
                    className="w-full text-white"
                    style={{ backgroundColor: `var(--plan-${getNextPlan()?.slug})` }}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    {isFreePlan 
                      ? 'Mejorar Plan'
                      : getNextPlan()?.slug === 'enterprise'
                        ? 'Contactar para ENTERPRISE'
                        : `Mejorar a ${getNextPlan()?.name}`
                    }
                  </Button>
                )}
              </div>
            </>
          )}
        </AppCard>
        <AppCard>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded-md bg-white dark:bg-gray-800 border border-border flex items-center justify-center p-1">
                  <img 
                    src={payments[0].provider === 'paypal'? '/Paypal_2014_logo.png': '/MercadoPago_logo.png'}
                    alt={payments[0].provider === 'paypal'? 'PayPal': 'MercadoPago'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {payments[0].provider === 'paypal'? 'PayPal': 'MercadoPago'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payments[0].payer_email}
                  </div>
                </div>
              </div>
              
              {expiresAt && !isFreePlan && (
                <div className="flex items-center justify-between text-sm py-2 border-t border-border">
                  <span className="text-muted-foreground">
                    {isCancelled ? 'Expira el:': 'Próxima renovación:'}
                  </span>
                  <span className="font-medium">
                    {format(new Date(expiresAt), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  const url = payments[0].provider === 'paypal'
                    ? 'https://www.paypal.com/myaccount/autopay'
                    : 'https://www.mercadopago.com.ar/subscriptions';
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                data-testid="button-manage-payment-method"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Gestionar en {payments[0].provider === 'paypal'? 'PayPal': 'MercadoPago'}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No hay métodos de pago registrados
            </div>
          )}
        </AppCard>
      </div>
      {isTeamsPlan && (
        <div className="space-y-6">
          {nextInvoice && (
            <Card>
              <CardHeader>
                <CardTitle>Próxima Factura Estimada</CardTitle>
                <CardDescription>
                  Resumen de tu próxima facturación basada en tus miembros activos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Miembros facturables:</span>
                    <span className="font-medium">{nextInvoice.seats}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Precio por asiento:</span>
                    <span className="font-medium">{nextInvoice.currency} ${nextInvoice.pricePerSeat.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Monto base:</span>
                    <span className="font-medium">{nextInvoice.currency} ${nextInvoice.baseAmount.toFixed(2)}</span>
                  </div>
                  {nextInvoice.prorationAdjustment !== 0 && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Ajuste de prorrateo:</span>
                      <span className={cn(
                        "font-medium",
                        nextInvoice.prorationAdjustment > 0 ? "text-orange-600" : "text-green-600"
                      )}>
                        {nextInvoice.prorationAdjustment > 0 ? '+': ''}
                        {nextInvoice.currency} ${nextInvoice.prorationAdjustment.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-t pt-4">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold">{nextInvoice.currency} ${nextInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  {nextInvoice.nextBillingDate && (
                    <div className="text-sm text-muted-foreground text-center">
                      Próxima fecha de facturación: {format(new Date(nextInvoice.nextBillingDate), 'dd MMM yyyy', { locale: es })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {billingCycles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Ciclos de Facturación</CardTitle>
                <CardDescription>
                  Últimos 12 ciclos de facturación con detalles de asientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Período</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asientos</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Monto</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingCycles.map((cycle: any) => (
                        <tr key={cycle.id} className="border-b last:border-0">
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(cycle.period_start), 'dd MMM', { locale: es })} - {format(new Date(cycle.period_end), 'dd MMM yyyy', { locale: es })}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {cycle.billed_seats} facturado{cycle.billed_seats !== cycle.seats ? ` (${cycle.seats} en org)` : ''}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {cycle.currency_code} ${parseFloat(cycle.total_amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={cycle.status === 'paid'? 'success': cycle.status === 'pending'? 'pending': 'warning'} className="text-xs">
                              {cycle.status === 'paid'? 'Pagado': cycle.status === 'pending'? 'Pendiente': 'Cancelado'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {paymentsLoading ? (
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay facturas</h3>
            <p className="text-sm text-muted-foreground">
              Tus facturas aparecerán aquí cuando realices pagos.
            </p>
          </div>
        </Card>
      ) : (
        <Table
          columns={columns}
          data={payments}
          isLoading={false}
          rowActions={(payment: Payment) => [
            {
              icon: Download,
              label: 'Descargar',
              onClick: () => handleDownloadInvoice(payment)
            }
          ]}
        />
      )}
    </div>
  );
}
