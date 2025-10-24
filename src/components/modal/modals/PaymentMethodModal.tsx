import { useState, useEffect } from 'react';
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import FormModalBody from "@/components/modal/form/FormModalBody";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { ShoppingCart, Copy, CheckCircle, CreditCard, Building2, Loader2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import mercadoPagoLogo from '/MercadoPago_logo.png';
import paypalLogo from '/Paypal_2014_logo.png';
import { useCoursePrice } from '@/hooks/useCoursePrice';

interface PaymentMethodModalProps {
  courseSlug: string;
  currency: 'ARS' | 'USD';
}

type PaymentMethod = 'mercadopago' | 'paypal' | 'transfer';

interface AppliedCoupon {
  coupon_id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  discount: number;
  final_price: number;
}

export default function PaymentMethodModal({
  courseSlug,
  currency
}: PaymentMethodModalProps) {
  const { closeModal } = useGlobalModalStore();
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  
  const { price: priceData, loading: priceLoading } = useCoursePrice(courseSlug, currency, 'mercadopago');
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresá un código de cupón',
        variant: 'destructive'
      });
      return;
    }

    if (!priceData) {
      toast({
        title: 'Error',
        description: 'Esperá a que se cargue el precio del curso',
        variant: 'destructive'
      });
      return;
    }

    try {
      setValidatingCoupon(true);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseSlug)
        .single();

      if (courseError || !courseData) {
        throw new Error('No se pudo obtener la información del curso');
      }

      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.trim(),
        p_course_id: courseData.id,
        p_price: priceData.amount,
        p_currency: priceData.currency_code
      });

      if (error) {
        console.error('Error validando cupón:', error);
        throw new Error('Error al validar el cupón');
      }

      if (!data || !data.ok) {
        // Map error reasons to user-friendly messages
        const errorMessages: Record<string, string> = {
          'NOT_FOUND_OR_INACTIVE': 'Cupón inválido o inactivo.',
          'EXPIRED': 'El cupón está vencido.',
          'NOT_STARTED': 'El cupón aún no está disponible.',
          'USER_LIMIT_REACHED': 'Ya alcanzaste el límite de uso de este cupón.',
          'GLOBAL_LIMIT_REACHED': 'Se alcanzó el límite de usos para este cupón.',
          'NOT_APPLICABLE': 'Este cupón no aplica a este curso.',
          'MINIMUM_NOT_MET': 'No alcanzás el mínimo de compra para usar este cupón.',
          'CURRENCY_MISMATCH': 'El cupón no aplica a esta moneda.',
          'UNAUTHENTICATED': 'Tenés que iniciar sesión para usar un cupón.'
        };

        const errorMessage = errorMessages[data.reason || ''] || 'No pudimos aplicar el cupón. Probá de nuevo.';
        
        toast({
          title: 'Cupón no válido',
          description: errorMessage,
          variant: 'destructive'
        });
        return;
      }

      // Coupon is valid
      setAppliedCoupon({
        coupon_id: data.coupon_id,
        code: couponCode.trim().toUpperCase(),
        type: data.type,
        amount: data.amount,
        discount: data.discount,
        final_price: data.final_price
      });

      toast({
        title: 'Cupón aplicado',
        description: `¡Descuento de ${data.type === 'percent' ? data.amount + '%' : '$' + data.amount} aplicado!`,
      });

      setCouponCode('');
    } catch (error: any) {
      console.error('Error al validar cupón:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo validar el cupón',
        variant: 'destructive'
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: 'Cupón removido',
      description: 'El descuento fue quitado'
    });
  };

  const handleMercadoPagoPayment = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        throw new Error('Supabase no está disponible');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Debes iniciar sesión para comprar un curso');
      }

      // Call our new backend endpoint instead of Edge Function
      const response = await fetch('/api/checkout/mp/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          courseSlug,
          code: appliedCoupon?.code || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error al crear preferencia de pago:', data);
        const errorMessage = data?.error || data?.message || `Error ${response.status}: No se pudo crear la preferencia`;
        throw new Error(errorMessage);
      }

      const paymentUrl = data.init_point || data.sandbox_init_point;
      
      if (!paymentUrl) {
        console.error('Respuesta sin init_point:', data);
        throw new Error('No pudimos obtener el link de pago');
      }

      // Redirect to MP
      window.location.href = paymentUrl;
    } catch (error: any) {
      toast({
        title: 'Error al procesar el pago',
        description: error.message || 'No se pudo iniciar el pago',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handlePayPalPayment = () => {
    toast({
      title: 'Próximamente disponible',
      description: 'El pago con PayPal estará disponible pronto',
    });
  };

  const handleTransferPayment = () => {
    setShowBankInfo(true);
  };

  const handleCopyBankInfo = async () => {
    const bankInfo = `Banco Galicia - Caja de Ahorro en Pesos

Número de cuenta: 4026691-4 063-1
CBU: 00700634 30004026691416
Alias: MATIAS.SUKANEC
Titular: DNI 32322767

Enviá el comprobante a: pagos@archub.com.ar`;

    try {
      await navigator.clipboard.writeText(bankInfo);
      toast({
        title: 'Datos copiados',
        description: 'La información bancaria se copió al portapapeles',
      });
    } catch (error) {
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar la información',
        variant: 'destructive'
      });
    }
  };

  const handleContinue = () => {
    if (!selectedMethod) return;

    switch (selectedMethod) {
      case 'mercadopago':
        handleMercadoPagoPayment();
        break;
      case 'paypal':
        handlePayPalPayment();
        break;
      case 'transfer':
        handleTransferPayment();
        break;
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  const finalPrice = appliedCoupon ? appliedCoupon.final_price : priceData?.amount || 0;
  const hasDiscount = appliedCoupon && appliedCoupon.discount > 0;

  const headerContent = (
    <FormModalHeader 
      title="Elegí cómo pagar"
      description="Seleccioná tu método de pago preferido para continuar con la compra del curso"
      icon={ShoppingCart}
    />
  );

  const editPanel = (
    <div className="space-y-6">
      {!showBankInfo ? (
        <>
          <div className="space-y-4">
            <div 
              className="rounded-lg p-4" 
              style={{ 
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)'
              }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                💳 Suscripción Anual - Acceso por 365 días corridos
              </p>
              <p className="text-xs mt-1" style={{ color: 'color-mix(in srgb, var(--accent) 80%, transparent)' }}>
                Disfrutá del curso completo durante un año desde la fecha de compra
              </p>
            </div>

            {/* Coupon Section */}
            {!appliedCoupon ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-accent" />
                  Código de descuento
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresá tu código"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !validatingCoupon) {
                        handleValidateCoupon();
                      }
                    }}
                    disabled={validatingCoupon}
                    className="flex-1"
                    data-testid="input-coupon-code"
                  />
                  <Button
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    variant="secondary"
                    data-testid="button-apply-coupon"
                  >
                    {validatingCoupon ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validando
                      </>
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="rounded-lg p-3 flex items-center justify-between"
                style={{ 
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--accent) 5%, transparent)'
                }}
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    {appliedCoupon.code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({appliedCoupon.type === 'percent' ? `${appliedCoupon.amount}% OFF` : `$${appliedCoupon.amount} OFF`})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-7 px-2"
                  data-testid="button-remove-coupon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <RadioGroup
              value={selectedMethod || ''}
              onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
              data-testid="payment-method-radio-group"
            >
              <div
                className={cn(
                  "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  selectedMethod === 'mercadopago' 
                    ? "border-accent bg-accent/5" 
                    : "border-border hover:border-accent/50"
                )}
                onClick={() => setSelectedMethod('mercadopago')}
                data-testid="payment-option-mercadopago"
              >
                <RadioGroupItem value="mercadopago" id="mercadopago" className="mt-0.5" />
                <div className="flex-1 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="mercadopago" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-5 w-5 text-accent" />
                      <span className="font-medium">Mercado Pago (ARS)</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tarjeta de crédito/débito. Redirección segura.
                    </p>
                  </div>
                  <img 
                    src={mercadoPagoLogo} 
                    alt="Mercado Pago" 
                    className="h-14 object-contain"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  selectedMethod === 'paypal' 
                    ? "border-accent bg-accent/5" 
                    : "border-border hover:border-accent/50"
                )}
                onClick={() => setSelectedMethod('paypal')}
                data-testid="payment-option-paypal"
              >
                <RadioGroupItem value="paypal" id="paypal" className="mt-0.5" />
                <div className="flex-1 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-5 w-5 text-accent" />
                      <span className="font-medium">PayPal (USD)</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago internacional en dólares. (Próximamente)
                    </p>
                  </div>
                  <img 
                    src={paypalLogo} 
                    alt="PayPal" 
                    className="h-14 object-contain"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  selectedMethod === 'transfer' 
                    ? "border-accent bg-accent/5" 
                    : "border-border hover:border-accent/50"
                )}
                onClick={() => setSelectedMethod('transfer')}
                data-testid="payment-option-transfer"
              >
                <RadioGroupItem value="transfer" id="transfer" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-5 w-5 text-accent" />
                    <span className="font-medium">Transferencia bancaria</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Realizá la transferencia y envianos el comprobante.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border border-muted bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Total a pagar</p>
                {priceLoading ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Cargando precio...</span>
                  </div>
                ) : priceData ? (
                  <>
                    {hasDiscount && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Precio original</span>
                          <span className="text-muted-foreground line-through">
                            {priceData.currency_code === 'ARS' ? '$' : 'USD'} {priceData.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--accent)' }}>Cupón ({appliedCoupon.code})</span>
                          <span style={{ color: 'var(--accent)' }}>
                            −{priceData.currency_code === 'ARS' ? '$' : 'USD'} {appliedCoupon.discount.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-px bg-border my-2" />
                      </div>
                    )}
                    <p className="text-2xl font-bold mt-1">
                      {priceData.currency_code === 'ARS' ? '$' : 'USD'} {finalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suscripción Anual - Acceso por 365 días corridos
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Precio no disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Datos para transferencia bancaria</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Realizá la transferencia a la siguiente cuenta
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Banco</p>
              <p className="text-base font-semibold mt-1">Banco Galicia - Caja de Ahorro en Pesos</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de cuenta</p>
                <p className="text-base font-mono mt-1">4026691-4 063-1</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CBU</p>
                <p className="text-base font-mono mt-1">00700634 30004026691416</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alias</p>
                <p className="text-base font-mono mt-1">MATIAS.SUKANEC</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Titular</p>
                <p className="text-base mt-1">DNI 32322767</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleCopyBankInfo}
                className="w-full"
                data-testid="button-copy-bank-info"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar datos
              </Button>
            </div>
          </div>

          <div 
            className="rounded-lg p-4" 
            style={{ 
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)'
            }}
          >
            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              Enviá el comprobante a:{' '}
              <a 
                href="mailto:pagos@archub.com.ar" 
                className="font-medium underline hover:no-underline"
                data-testid="link-payment-email"
              >
                pagos@archub.com.ar
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={handleCancel}
      submitText={loading ? 'Procesando...' : showBankInfo ? 'Cerrar' : 'Continuar'}
      onSubmit={showBankInfo ? handleCancel : handleContinue}
      submitDisabled={!showBankInfo && !selectedMethod}
      showLoadingSpinner={loading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
    />
  );
}
