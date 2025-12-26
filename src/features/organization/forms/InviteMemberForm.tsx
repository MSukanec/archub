import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
import { organizationKeys } from '@/core/query-keys';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, CalendarClock } from 'lucide-react';
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
    billingPeriod: 'monthly'| 'annual';
    startedAt: string;
    expiresAt: string;
    currentSeats: number;
    maxSeats: number;
    paymentProvider: 'mercadopago'| 'paypal'| 'bank_transfer'| null;
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
export interface InviteMemberFormProps {
  organizationId?: string;
  editingMember?: any;
  defaultEmail?: string;
  mode: 'create'| 'edit';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
  onPricingChange?: (pricing: SeatPricingData | null) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}
export function InviteMemberForm({
  organizationId,
  editingMember,
  defaultEmail,
  mode,
  onSuccess,
  onCancel,
  hideActions = false,
  formRef,
  onPricingChange,
  onLoadingChange,
}: InviteMemberFormProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<SeatPricingData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  const isReinvite = !!defaultEmail;
  const effectiveOrgId = organizationId || userData?.preferences?.last_organization_id;
  const isEditing = mode === 'edit'|| !!editingMember;
  const { data: roles = [], isLoading: rolesLoading } = useQuery<{ id: string; name: string; type: string }[]>({
    queryKey: [`/api/roles?organizationId=${effectiveOrgId}`],
    enabled: !!effectiveOrgId,
  });
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: defaultEmail || '',
      roleId: '',
    },
  });
  const watchedEmail = form.watch('email');
  const watchedRoleId = form.watch('roleId');
  useEffect(() => {
    if (editingMember && roles.length > 0) {
      form.reset({
        email: editingMember.users?.email || '',
        roleId: editingMember.role_id || '',
      });
    } else if (!editingMember) {
      form.reset({
        email: defaultEmail || '',
        roleId: '',
      });
    }
  }, [editingMember, defaultEmail, form, roles]);
  useEffect(() => {
    if (!isEditing && watchedEmail && watchedRoleId && !hasCalculated) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
      if (isValidEmail) {
        calculateSeatCost({ email: watchedEmail, roleId: watchedRoleId });
      }
    }
  }, [watchedEmail, watchedRoleId, isEditing, hasCalculated]);
  useEffect(() => {
    onPricingChange?.(pricingData);
  }, [pricingData, onPricingChange]);
  useEffect(() => {
    onLoadingChange?.(isLoading || isCalculating);
  }, [isLoading, isCalculating, onLoadingChange]);
  const calculateSeatCost = useCallback(async (data: MemberFormData): Promise<SeatPricingData | null> => {
    if (!effectiveOrgId) return null;
    
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
          organization_id: effectiveOrgId,
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
  }, [effectiveOrgId]);
  const createMemberMutation = useOptimisticMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!effectiveOrgId) throw new Error('No organization selected');
      const response = await apiRequest('POST', '/api/invite-member', {
        email: memberData.email,
        roleId: memberData.roleId,
        organizationId: effectiveOrgId,
      });
      return response.json();
    },
    queryKey: organizationKeys.invitations(effectiveOrgId),
    optimisticUpdate: (oldData: any, variables: MemberFormData) => {
      if (!oldData) oldData = [];
      
      const selectedRole = roles.find(r => r.id === variables.roleId);
      
      const optimisticInvitation = {
        id: `temp-${Date.now()}`,
        email: variables.email,
        status: 'pending',
        created_at: new Date().toISOString(),
        organization_id: effectiveOrgId,
        role_id: variables.roleId,
        role_data: selectedRole ? {
          id: selectedRole.id,
          name: selectedRole.name,
          type: selectedRole.type,
        } : null,
      };
      
      return [optimisticInvitation, ...oldData];
    },
    onSuccessMessage: isReinvite ? 'Miembro reinvitado exitosamente': 'Invitación enviada exitosamente',
    onErrorMessage: 'Error al invitar miembro',
    additionalQueryKeys: [
      organizationKeys.members(effectiveOrgId),
      organizationKeys.formerMembers(effectiveOrgId),
    ],
  });
  const updateMemberMutation = useOptimisticMutation({
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
    queryKey: organizationKeys.members(effectiveOrgId),
    optimisticUpdate: (oldData: any, variables: MemberFormData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      
      const selectedRole = roles.find(r => r.id === variables.roleId);
      
      return oldData.map((member: any) => {
        if (member.id === editingMember?.id) {
          return {
            ...member,
            role_id: variables.roleId,
            roles: selectedRole ? {
              id: selectedRole.id,
              name: selectedRole.name,
              type: selectedRole.type,
            } : member.roles,
          };
        }
        return member;
      });
    },
    onSuccessMessage: 'El rol del miembro ha sido actualizado correctamente',
    onErrorMessage: 'Error al actualizar miembro',
  });
  const handleFormSubmit = async (data: MemberFormData) => {
    if (isEditing) {
      updateMemberMutation.mutate(data);
      onSuccess();
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
      onSuccess();
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
            organization_id: effectiveOrgId,
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
            organization_id: effectiveOrgId,
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
  const selectedRole = roles.find((r: any) => r.id === watchedRoleId);
  const isSubmitting = isLoading || createMemberMutation.isPending || updateMemberMutation.isPending;
  const formatPrice = (amountARS: number, amountUSD: number) => {
    const formatAmount = (amount: number, currency: 'USD'| 'ARS') => {
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
  const getSubmitLabel = () => {
    if (isSubmitting) {
      return needsPayment ? 'Redirigiendo...': 'Procesando...';
    }
    if (isCalculating) return 'Calculando...';
    if (isEditing) return 'Actualizar';
    if (needsPayment) return 'Proceder al Pago';
    return isReinvite ? 'Reinvitar': 'Invitar';
  };
  return (
    <Form {...form}>
      <form 
        ref={formRef}
        onSubmit={form.handleSubmit(handleFormSubmit)} 
        className="w-full space-y-4"
      >
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
                    <SelectValue placeholder={rolesLoading ? "Cargando roles..." : "Selecciona un rol"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem 
                      key={role.id} 
                      value={role.id}
                      data-testid={`option-role-${role.name.toLowerCase().replace(/\s+/g, '-')}`}
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
                    <span>{pricingData.subscription.billingPeriod === 'monthly'? 'Mensual': 'Anual'}</span>
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
                          {format(new Date(pricingData.nextBilling.date), "d 'de'MMMM, yyyy", { locale: es })}
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
        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isCalculating} 
              className="flex-[3]"
              data-testid="button-submit-invite"
            >
              {getSubmitLabel()}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
