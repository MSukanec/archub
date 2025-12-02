import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { useGlobalModalStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, UserPlus, CreditCard, Calculator, ArrowLeft, Calendar, DollarSign, Loader2, ExternalLink, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-formatter';
import { SiMercadopago } from 'react-icons/si';

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

type ModalStep = 'form' | 'pricing' | 'paying';

export function MemberFormModal({ editingMember, defaultEmail, onClose }: MemberModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { setPanel } = useModalPanelStore();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<ModalStep>('form');
  const [pricingData, setPricingData] = useState<SeatPricingData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
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

      return result.data as SeatPricingData;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [organizationId, toast]);

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!organizationId) throw new Error('No organization selected');

      const response = await apiRequest('POST', '/api/invite-member', {
        email: memberData.email,
        roleId: memberData.roleId,
        organizationId: organizationId,
      });

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members-full'] });
      queryClient.invalidateQueries({ queryKey: ['organization-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-former-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: isReinvite ? 'Miembro reinvitado' : 'Miembro invitado',
        description: data.isNewUser 
          ? 'La invitación ha sido enviada por email' 
          : 'El usuario recibirá una notificación para unirse nuevamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al invitar miembro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMemberMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: 'Miembro actualizado',
        description: 'El rol del miembro ha sido actualizado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar miembro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setStep('form');
    setPricingData(null);
    setPanel('view');
    onClose();
  };

  const handleFormSubmit = async (data: MemberFormData) => {
    if (editingMember) {
      setIsLoading(true);
      try {
        await updateMemberMutation.mutateAsync(data);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const pricing = await calculateSeatCost(data);
    if (!pricing) return;

    setPricingData(pricing);

    if (!pricing.canAddSeat) {
      toast({
        title: 'No se puede agregar miembro',
        description: pricing.error || 'Error desconocido',
        variant: 'destructive',
      });
      return;
    }

    const needsPayment = pricing.pricing && pricing.pricing.proratedAmountARS > 0;
    
    if (needsPayment) {
      setStep('pricing');
    } else {
      setIsLoading(true);
      try {
        await createMemberMutation.mutateAsync(data);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePayWithMP = async () => {
    if (!pricingData?.subscription || !pricingData?.pricing) return;
    
    setStep('paying');
    setIsLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const formData = form.getValues();
      
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
          prorated_amount_ars: pricingData.pricing.proratedAmountARS,
          subscription_id: pricingData.subscription.id,
          billing_period: pricingData.subscription.billingPeriod,
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Error creando preferencia de pago');
      }

      window.location.href = result.init_point;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setStep('pricing');
    } finally {
      setIsLoading(false);
    }
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
      </form>
    </Form>
  );

  const pricingPanel = pricingData && pricingData.pricing && pricingData.subscription && (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep('form')}
          className="h-auto p-0"
          data-testid="button-back-to-form"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Costo del nuevo miembro</CardTitle>
          </div>
          <CardDescription>
            Pago prorrateado hasta el final del período actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Miembro a invitar:</span>
            <span className="font-medium">{pricingData.invitation.email}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rol:</span>
            <Badge variant="secondary">{pricingData.invitation.roleName}</Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Plan actual:</span>
            </div>
            <Badge variant="outline">{pricingData.organization?.planName}</Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Período de facturación:</span>
            </div>
            <span>{pricingData.subscription.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Días restantes del ciclo:</span>
            <span>{pricingData.pricing.daysRemaining} de {pricingData.pricing.totalDays} días</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Precio del asiento completo:</span>
            <span>ARS {formatCurrency(pricingData.pricing.seatPriceARS)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Porcentaje prorrateado:</span>
            <span>{pricingData.pricing.percentageRemaining}%</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold">Total a pagar ahora:</span>
            </div>
            <span className="text-xl font-bold text-primary">
              ARS {formatCurrency(pricingData.pricing.proratedAmountARS)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            ≈ USD {formatCurrency(pricingData.pricing.proratedAmountUSD)}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            El próximo cobro incluirá automáticamente el costo completo de este asiento.
          </p>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handlePayWithMP}
          disabled={isLoading}
          data-testid="button-pay-mercadopago"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirigiendo a MercadoPago...
            </>
          ) : (
            <>
              <SiMercadopago className="h-5 w-5" />
              Pagar con MercadoPago
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const payingPanel = (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirigiendo al pago...</p>
      <p className="text-xs text-muted-foreground">
        Serás redirigido a MercadoPago para completar el pago de forma segura.
      </p>
    </div>
  );

  const getCurrentPanel = () => {
    if (isEditing) return formPanel;
    
    switch (step) {
      case 'pricing':
        return pricingPanel;
      case 'paying':
        return payingPanel;
      default:
        return formPanel;
    }
  };
  
  const headerContent = (
    <FormModalHeader
      title={
        isEditing 
          ? 'Editar Miembro' 
          : step === 'pricing' || step === 'paying'
            ? 'Confirmar invitación'
            : (isReinvite ? 'Reinvitar Miembro' : 'Invitar Miembro')
      }
      description={
        isEditing 
          ? 'Actualiza el rol y permisos del miembro en tu organización.' 
          : step === 'pricing'
            ? 'Revisa el costo prorrateado y confirma el pago para enviar la invitación.'
            : step === 'paying'
              ? 'Completando el pago...'
              : isReinvite 
                ? 'Selecciona el rol para reinvitar a este miembro anterior.'
                : 'Ingresa el email del nuevo miembro. Si no tiene cuenta, recibirá una invitación por correo.'
      }
      icon={step === 'pricing' ? CreditCard : (isEditing ? Users : UserPlus)}
    />
  );

  const showFooter = step === 'form';

  const footerContent = showFooter ? (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={
        isCalculating 
          ? 'Calculando...' 
          : isEditing 
            ? 'Actualizar' 
            : (isReinvite ? 'Reinvitar' : 'Continuar')
      }
      onRightClick={form.handleSubmit(handleFormSubmit)}
      isSubmitting={isLoading || isCalculating}
    />
  ) : null;

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
      editPanel={getCurrentPanel()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}
