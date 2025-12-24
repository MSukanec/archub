import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { organizationKeys } from '@/core/query-keys';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Calendar, DollarSign, Loader2, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-formatter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const memberSchema = z.object({
  email: z.string().email('Email inválido'),
  roleId: z.string().min(1, 'Debe seleccionar un rol'),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface SeatPricingData {
  canAddSeat: boolean;
  error?: string;
  organization: {
    id: string;
    name: string;
    planSlug: string;
    planName: string;
  } | null;
  subscription: {
    id: string;
    billingPeriod: 'monthly' | 'annual';
    startedAt: string;
    expiresAt: string;
    currentSeats: number;
    maxSeats: number;
    paymentProvider: 'mercadopago' | 'paypal' | 'bank_transfer' | null;
    payerEmail: string | null;
  } | null;
  pricing: {
    seatPriceUSD: number;
    seatPriceARS: number;
    daysRemaining: number;
    totalDays: number;
    percentageRemaining: number;
    proratedAmountUSD: number;
    proratedAmountARS: number;
  } | null;
  nextBilling: {
    date: string;
    totalSeats: number;
    amountPerSeatUSD: number;
    amountPerSeatARS: number;
    totalAmountUSD: number;
    totalAmountARS: number;
  } | null;
  invitation: {
    email: string;
    roleId: string;
    roleName?: string;
  };
}

interface MemberModalProps {
  editingMember?: any;
  defaultEmail?: string;
  onClose: () => void;
}

const planColors: Record<string, string> = {
  free: 'var(--plan-free-bg)',
  pro: 'var(--plan-pro-bg)',
  teams: 'var(--plan-teams-bg)',
  enterprise: 'var(--plan-enterprise-bg)',
};

function getPlanColor(planSlug: string | undefined): string {
  if (!planSlug) return planColors.free;
  const normalized = planSlug.toLowerCase();
  if (normalized.includes('enterprise')) return planColors.enterprise;
  if (normalized.includes('teams')) return planColors.teams;
  if (normalized.includes('pro')) return planColors.pro;
  return planColors.free;
}

export function MemberFormModal({ editingMember, defaultEmail, onClose }: MemberModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { setPanel } = useModalPanelStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<SeatPricingData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  const isReinvite = !!defaultEmail;
  const organizationId = userData?.preferences?.last_organization_id;
  const isEditing = !!editingMember;

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, type')
        .eq('type', 'organization')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: '',
      roleId: '',
    },
  });

  const watchedEmail = form.watch('email');
  const watchedRoleId = form.watch('roleId');

  useEffect(() => {
    if (editingMember) {
      form.reset({
        email: editingMember.users?.email || '',
        roleId: editingMember.role_id || '',
      });
      setPanel('edit');
    } else {
      form.reset({
        email: defaultEmail || '',
        roleId: '',
      });
      setPanel('edit');
    }
  }, [editingMember, defaultEmail, form, setPanel]);

  useEffect(() => {
    if (!isEditing && watchedEmail && watchedRoleId && !hasCalculated) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
      if (isValidEmail) {
        calculateSeatCost({ email: watchedEmail, roleId: watchedRoleId });
      }
    }
  }, [watchedEmail, watchedRoleId, isEditing, hasCalculated]);

  const calculateSeatCost = useCallback(async (data: MemberFormData): Promise<SeatPricingData | null> => {
    if (!organizationId) return null;
    
    setIsCalculating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('/api/checkout/calculate-seat-proration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          invitee_email: data.email,
          role_id: data.roleId,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error calculando costo');
      }

      const pricingResult = result.data as SeatPricingData;
      setPricingData(pricingResult);
      setHasCalculated(true);
      return pricingResult;
    } catch (error: any) {
      console.error('Error calculating seat cost:', error);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [organizationId]);

  const createMemberMutation = useOptimisticMutation<any, MemberFormData>({
    mutationFn: async (memberData: MemberFormData) => {
      if (!organizationId) throw new Error('No organization selected');

      const response = await apiRequest('POST', '/api/invite-member', {
        email: memberData.email,
        roleId: memberData.roleId,
        organizationId: organizationId,
      });

      return response.json();
    },
    queryKey: organizationKeys.invitations(organizationId),
    optimisticUpdate: (oldData: any, _variables: MemberFormData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: isReinvite ? 'Miembro reinvitado exitosamente' : 'Invitación enviada exitosamente',
    onErrorMessage: 'Error al invitar miembro',
  });

  const updateMemberMutation = useOptimisticMutation<any, MemberFormData>({
    mutationFn: async (memberData: MemberFormData) => {
      if (!editingMember?.id) throw new Error('No member to update');

      const { data, error } = await supabase
        .from('organization_members')
        .update({
          role_id: memberData.roleId,
        })
        .eq('id', editingMember.id)
        .select();

      if (error) throw error;
      return data;
    },
    queryKey: organizationKeys.members(organizationId),
    optimisticUpdate: (oldData: any, variables: MemberFormData) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      const selectedRoleData = roles.find(r => r.id === variables.roleId);
      return oldData.map((member: any) =>
        member.id === editingMember?.id
          ? { 
              ...member, 
              role_id: variables.roleId,
              roles: selectedRoleData ? {
                id: selectedRoleData.id,
                name: selectedRoleData.name,
                type: selectedRoleData.type,
              } : member.roles
            }
          : member
      );
    },
    onSuccessMessage: 'Rol del miembro actualizado correctamente',
    onErrorMessage: 'Error al actualizar miembro',
  });

  const handleClose = () => {
    form.reset();
    setPricingData(null);
    setHasCalculated(false);
    setPanel('view');
    onClose();
  };

  const handleFormSubmit = async (data: MemberFormData) => {
    if (editingMember) {
      updateMemberMutation.mutate(data);
      handleClose();
      return;
    }

    let pricing = pricingData;
    if (!pricing) {
      pricing = await calculateSeatCost(data);
    }
    
    if (!pricing) return;

    if (!pricing.canAddSeat) {
      toast({
        title: 'No se puede agregar miembro',
        description: pricing.error || 'Error desconocido',
        variant: 'destructive',
      });
      return;
    }

    const isPayPal = pricing.subscription?.paymentProvider === 'paypal';
    const needsPayment = pricing.pricing && (isPayPal 
      ? pricing.pricing.proratedAmountUSD > 0 
      : pricing.pricing.proratedAmountARS > 0
    );
    
    if (needsPayment) {
      await handleProceedToPayment(pricing);
    } else {
      createMemberMutation.mutate(data);
      handleClose();
    }
  };

  const handleProceedToPayment = async (pricing: SeatPricingData) => {
    if (!pricing?.subscription || !pricing?.pricing) return;
    
    setIsLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const formData = form.getValues();
      const isPayPalProvider = pricing.subscription.paymentProvider === 'paypal';
      
      if (isPayPalProvider) {
        const response = await fetch('/api/checkout/paypal/create-seat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            organization_id: organizationId,
            invitee_email: formData.email,
            role_id: formData.roleId,
            prorated_amount_usd: pricing.pricing.proratedAmountUSD,
            subscription_id: pricing.subscription.id,
            billing_period: pricing.subscription.billingPeriod,
          }),
        });

        const result = await response.json();
        
        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Error creando orden de pago');
        }

        window.location.href = result.approval_url;
      } else {
        const response = await fetch('/api/checkout/mp/create-seat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            organization_id: organizationId,
            invitee_email: formData.email,
            role_id: formData.roleId,
            prorated_amount_ars: pricing.pricing.proratedAmountARS,
            subscription_id: pricing.subscription.id,
            billing_period: pricing.subscription.billingPeriod,
          }),
        });

        const result = await response.json();
        
        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Error creando preferencia de pago');
        }

        window.location.href = result.init_point;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const isPayPal = pricingData?.subscription?.paymentProvider === 'paypal';
  const needsPayment = pricingData?.pricing && (isPayPal 
    ? pricingData.pricing.proratedAmountUSD > 0 
    : pricingData.pricing.proratedAmountARS > 0
  );
  const selectedRole = roles.find(r => r.id === watchedRoleId);

  const formatPrice = (amountARS: number, amountUSD: number) => {
    // Use Intl.NumberFormat with currency style for proper locale formatting
    // Always show 2 decimals for consistency with payment provider receipts
    const formatAmount = (amount: number, currency: 'USD' | 'ARS') => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };
    
    if (isPayPal) {
      return formatAmount(amountUSD, 'USD');
    }
    return formatAmount(amountARS, 'ARS');
  };

  const formPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="Ingresa el email del miembro"
                  disabled={!!editingMember || !!defaultEmail}
                  data-testid="input-member-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-member-role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem 
                      key={role.id} 
                      value={role.id}
                      data-testid={`option-role-${role.name.toLowerCase()}`}
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && watchedEmail && watchedRoleId && (
          <>
            <Separator className="my-4" />
            
            {isCalculating ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : pricingData && pricingData.pricing && pricingData.subscription ? (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Costo del nuevo miembro</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Miembro:</span>
                    <span className="font-medium">{pricingData.invitation.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rol:</span>
                    <Badge variant="neutral" className="text-xs">{selectedRole?.name || pricingData.invitation.roleName}</Badge>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge 
                      className="text-xs text-white border-0"
                      style={{ backgroundColor: getPlanColor(pricingData.organization?.planSlug) }}
                    >
                      {pricingData.organization?.planName}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Período:</span>
                    </div>
                    <span>{pricingData.subscription.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Días restantes:</span>
                    <span>{pricingData.pricing.daysRemaining} de {pricingData.pricing.totalDays}</span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio asiento completo:</span>
                    <span>{formatPrice(pricingData.pricing.seatPriceARS, pricingData.pricing.seatPriceUSD)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Porcentaje prorrateado:</span>
                    <span>{pricingData.pricing.percentageRemaining}%</span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold">Total a pagar ahora:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(pricingData.pricing.proratedAmountARS, pricingData.pricing.proratedAmountUSD)}
                    </span>
                  </div>

                  {!isPayPal && pricingData.subscription.payerEmail && (
                    <div className="mt-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs">
                      <span className="text-blue-600 dark:text-blue-400">
                        El pago se procesará con el email de MercadoPago: <strong>{pricingData.subscription.payerEmail}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {pricingData.nextBilling && (
                  <div className="mt-4 p-3 rounded-md bg-background border">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Próximo cobro</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="font-medium">
                          {format(new Date(pricingData.nextBilling.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Asientos ({pricingData.nextBilling.totalSeats}):</span>
                        <span className="font-medium">
                          {formatPrice(pricingData.nextBilling.totalAmountARS, pricingData.nextBilling.totalAmountUSD)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : pricingData && !pricingData.canAddSeat ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {pricingData.error || 'No se puede agregar este miembro'}
              </div>
            ) : null}
          </>
        )}
      </form>
    </Form>
  );
  
  const headerContent = (
    <FormModalHeader
      title={
        isEditing 
          ? 'Editar Miembro' 
          : (isReinvite ? 'Reinvitar Miembro' : 'Invitar Miembro')
      }
      description={
        isEditing 
          ? 'Actualiza el rol y permisos del miembro en tu organización.' 
          : isReinvite 
            ? 'Selecciona el rol para reinvitar a este miembro anterior.'
            : 'Ingresa el email del nuevo miembro. Si no tiene cuenta, recibirá una invitación por correo.'
      }
      icon={isEditing ? Users : UserPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={
        isLoading 
          ? (needsPayment ? 'Redirigiendo...' : 'Procesando...')
          : isCalculating 
            ? 'Calculando...' 
            : isEditing 
              ? 'Actualizar' 
              : needsPayment
                ? 'Proceder al Pago'
                : (isReinvite ? 'Reinvitar' : 'Invitar')
      }
      onRightClick={form.handleSubmit(handleFormSubmit)}
      isSubmitting={isLoading || isCalculating}
    />
  );

  const viewPanel = editingMember ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Email</h4>
        <p className="text-muted-foreground mt-1">{editingMember?.email || 'Sin email'}</p>
      </div>
      <div>
        <h4 className="font-medium">Rol</h4>
        <p className="text-muted-foreground mt-1">{editingMember?.role?.name || 'Sin rol'}</p>
      </div>
      <div>
        <h4 className="font-medium">Estado</h4>
        <p className="text-muted-foreground mt-1">{editingMember?.status || 'Activo'}</p>
      </div>
    </div>
  ) : null;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={formPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}
