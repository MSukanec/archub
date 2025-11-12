import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { CreditCard, Download, ArrowUpCircle, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrganizationSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  started_at: string;
  expires_at: string;
  amount: number;
  currency: string;
  plans: {
    name: string;
    slug: string;
  };
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

  useEffect(() => {
    setSidebarLevel('settings');
  }, [setSidebarLevel]);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<OrganizationSubscription | null>({
    queryKey: ['current-subscription', currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) throw new Error('Missing required data');

      const { data, error } = await supabase
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
          plans(name, slug)
        `)
        .eq('organization_id', currentOrganizationId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
    enabled: !!currentOrganizationId && !!supabase,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
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

  const planName = subscription?.plans?.name || 'Free';
  const planSlug = subscription?.plans?.slug || 'free';
  const billingPeriod = subscription?.billing_period === 'monthly' ? 'mes' : 'año';
  const amount = subscription?.amount || 0;
  const currency = subscription?.currency || 'USD';
  const expiresAt = subscription?.expires_at;

  const isFreePlan = planSlug === 'free';

  const columns = [
    {
      key: 'invoice',
      label: 'Factura',
      width: '25%',
      render: (payment: Payment) => (
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
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm capitalize">
            {payment.provider === 'paypal' ? 'PayPal' : 'MercadoPago'}
          </span>
        </div>
      ),
    },
  ];

  const headerProps = {
    title: "Facturación",
    icon: CreditCard,
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Actual</CardTitle>
              <CardDescription>
                Tu plan de suscripción y detalles de facturación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionLoading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${amount}</span>
                    <span className="text-muted-foreground">/ {billingPeriod}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan:</span>
                      <Badge variant="outline">{planName}</Badge>
                    </div>
                    
                    {expiresAt && !isFreePlan && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Próxima renovación:</span>
                        <span className="font-medium">
                          {format(new Date(expiresAt), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>

                  {isFreePlan && (
                    <Button className="w-full" data-testid="button-upgrade-plan">
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Mejorar Plan
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de Pago</CardTitle>
              <CardDescription>
                Administra tu información de pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionLoading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : isFreePlan ? (
                <div className="text-sm text-muted-foreground">
                  No hay método de pago configurado para el plan Free
                </div>
              ) : payments.length > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-16 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
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

                  <Button variant="outline" className="w-full" data-testid="button-edit-payment">
                    Editar
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No hay métodos de pago registrados
                </div>
              )}
            </CardContent>
          </Card>
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
