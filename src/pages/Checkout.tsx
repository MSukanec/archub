import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { ArrowLeft, CreditCard, Building2, ShoppingCart, Tag, X, Loader2, CheckCircle, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useCoursePrice } from '@/hooks/useCoursePrice';
import { cn } from '@/lib/utils';
import mercadoPagoLogo from '/MercadoPago_logo.png';
import paypalLogo from '/Paypal_2014_logo.png';

type PaymentMethod = 'mercadopago' | 'paypal' | 'transfer';

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  subtitle: string | null;
}

interface AppliedCoupon {
  coupon_id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  discount: number;
  final_price: number;
}

interface BuyerInfo {
  fullName: string;
  email: string;
  country: string;
}

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Perú' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'BR', name: 'Brasil' },
  { code: 'OTHER', name: 'Otro' },
];

export default function Checkout() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const courseSlug = params.courseSlug as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Payment method state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  // Dynamic pricing based on selected method
  const currentProvider = selectedMethod === 'paypal' ? 'paypal' : 'mercadopago';
  const currentCurrency = selectedMethod === 'paypal' ? 'USD' : 'ARS';
  const { price: priceData, loading: priceLoading } = useCoursePrice(courseSlug, currentCurrency, currentProvider);
  
  // Buyer info state
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    fullName: '',
    email: '',
    country: 'AR'
  });
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  // Terms acceptance
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Bank transfer state
  const [showBankInfo, setShowBankInfo] = useState(false);

  // Load course data and prefill user info
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, slug, thumbnail_url, subtitle')
          .eq('slug', courseSlug)
          .single();
        
        if (courseError || !courseData) {
          toast({
            title: 'Error',
            description: 'No se pudo cargar el curso',
            variant: 'destructive'
          });
          navigate('/learning/courses');
          return;
        }
        
        setCourse(courseData);
        
        // Prefill user info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('auth_id', user.id)
            .single();
          
          if (userData) {
            setBuyerInfo(prev => ({
              ...prev,
              fullName: userData.full_name || '',
              email: userData.email || user.email || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [courseSlug, navigate, toast]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Ingresá un código de cupón');
      return;
    }

    if (!priceData || !course) {
      setCouponError('Esperá a que se cargue el precio del curso');
      return;
    }

    try {
      setValidatingCoupon(true);
      setCouponError(null);

      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.trim(),
        p_course_id: course.id,
        p_price: priceData.amount,
        p_currency: priceData.currency_code
      });

      if (error) {
        console.error('Error validando cupón:', error);
        setCouponError('Error al validar el cupón');
        return;
      }

      if (!data || !data.ok) {
        const errorMessages: Record<string, string> = {
          'NOT_FOUND_OR_INACTIVE': 'Cupón inválido o inactivo',
          'EXPIRED': 'El cupón está vencido',
          'NOT_STARTED': 'El cupón aún no está disponible',
          'USER_LIMIT_REACHED': 'Ya alcanzaste el límite de uso de este cupón',
          'GLOBAL_LIMIT_REACHED': 'Se alcanzó el límite de usos para este cupón',
          'NOT_APPLICABLE': 'Este cupón no aplica a este curso',
          'MINIMUM_NOT_MET': 'No alcanzás el mínimo de compra para usar este cupón',
          'CURRENCY_MISMATCH': 'El cupón no aplica a esta moneda',
          'UNAUTHENTICATED': 'Tenés que iniciar sesión para usar un cupón'
        };

        const errorMessage = errorMessages[data.reason || ''] || 'No pudimos aplicar el cupón';
        setCouponError(errorMessage);
        return;
      }

      setCouponError(null);
      setAppliedCoupon({
        coupon_id: data.coupon_id,
        code: couponCode.trim(),
        type: data.discount_type,
        amount: data.discount_amount,
        discount: data.discount_value,
        final_price: data.final_price
      });

      toast({
        title: 'Cupón aplicado',
        description: `Se aplicó un descuento de ${data.discount_type === 'percent' ? `${data.discount_amount}%` : `$${data.discount_amount}`}`,
      });
    } catch (error: any) {
      console.error('Error validando cupón:', error);
      setCouponError('Ocurrió un error al validar el cupón');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleMercadoPagoPayment = async () => {
    try {
      setProcessingPayment(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Debes iniciar sesión para comprar');
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No se pudo obtener el usuario');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) throw new Error('No se pudo obtener el ID del usuario');

      const finalPrice = appliedCoupon ? appliedCoupon.final_price : priceData!.amount;

      const createResponse = await fetch('/api/checkout/mp/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userRecord.id,
          course_slug: courseSlug,
          final_price: finalPrice,
          coupon_code: appliedCoupon?.code || null
        })
      });

      const responseData = await createResponse.json();

      if (!createResponse.ok || !responseData.init_point) {
        throw new Error(responseData.error || 'No se pudo crear la preferencia de pago');
      }

      window.location.href = responseData.init_point;
    } catch (error: any) {
      toast({
        title: 'Error al procesar el pago',
        description: error.message || 'No se pudo iniciar el pago',
        variant: 'destructive'
      });
      setProcessingPayment(false);
    }
  };

  const handlePayPalPayment = async () => {
    try {
      setProcessingPayment(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Debes iniciar sesión para comprar');
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No se pudo obtener el usuario');

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) throw new Error('No se pudo obtener el ID del usuario');

      const createOrderResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userRecord.id,
          course_slug: courseSlug
        })
      });

      const orderData = await createOrderResponse.json();

      if (!createOrderResponse.ok) {
        throw new Error(orderData?.error || 'No se pudo crear la orden de PayPal');
      }

      if (!orderData.approvalUrl) {
        throw new Error('No se recibió la URL de aprobación de PayPal');
      }

      window.location.href = orderData.approvalUrl;
    } catch (error: any) {
      toast({
        title: 'Error al procesar el pago con PayPal',
        description: error.message || 'No se pudo iniciar el pago',
        variant: 'destructive'
      });
      setProcessingPayment(false);
    }
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

  const handlePayNow = () => {
    if (!selectedMethod) {
      toast({
        title: 'Seleccioná un método de pago',
        description: 'Elegí cómo querés pagar antes de continuar',
        variant: 'destructive'
      });
      return;
    }

    if (!buyerInfo.fullName.trim() || !buyerInfo.email.trim() || !buyerInfo.country) {
      toast({
        title: 'Completá tus datos',
        description: 'Por favor completá todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Aceptá los términos',
        description: 'Debés aceptar los términos y condiciones para continuar',
        variant: 'destructive'
      });
      return;
    }

    if (couponCode.trim() && !appliedCoupon) {
      toast({
        title: 'Cupón no aplicado',
        description: 'Hacé clic en "Aplicar" para validar tu cupón o borrá el código',
        variant: 'destructive'
      });
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Curso no encontrado</p>
      </div>
    );
  }

  const displayPrice = appliedCoupon ? appliedCoupon.final_price : (priceData?.amount || 0);
  const currencySymbol = currentCurrency === 'USD' ? 'USD' : 'ARS';
  const subtotal = priceData?.amount || 0;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/learning/courses">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a Cursos
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-accent" />
                    Estás comprando
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      {course.subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">{course.subtitle}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">Suscripción Anual - Acceso por 365 días corridos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Método de pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={selectedMethod || ''}
                    onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
                  >
                    {/* Mercado Pago */}
                    <div
                      className={cn(
                        "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                        selectedMethod === 'mercadopago'
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      )}
                      onClick={() => setSelectedMethod('mercadopago')}
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

                    {/* PayPal */}
                    <div
                      className={cn(
                        "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                        selectedMethod === 'paypal'
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      )}
                      onClick={() => setSelectedMethod('paypal')}
                    >
                      <RadioGroupItem value="paypal" id="paypal" className="mt-0.5" />
                      <div className="flex-1 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                            <CreditCard className="h-5 w-5 text-accent" />
                            <span className="font-medium">PayPal (USD)</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pago internacional en dólares.
                          </p>
                        </div>
                        <img
                          src={paypalLogo}
                          alt="PayPal"
                          className="h-14 object-contain"
                        />
                      </div>
                    </div>

                    {/* Bank Transfer */}
                    <div
                      className={cn(
                        "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                        selectedMethod === 'transfer'
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      )}
                      onClick={() => setSelectedMethod('transfer')}
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

                  {/* Bank Info (Transfer) */}
                  {showBankInfo && selectedMethod === 'transfer' && (
                    <div className="rounded-lg border-2 border-accent/30 bg-accent/5 p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-accent" />
                        Datos bancarios
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Banco:</strong> Galicia - Caja de Ahorro en Pesos</p>
                        <p><strong>Número de cuenta:</strong> 4026691-4 063-1</p>
                        <p><strong>CBU:</strong> 00700634 30004026691416</p>
                        <p><strong>Alias:</strong> MATIAS.SUKANEC</p>
                        <p><strong>Titular:</strong> DNI 32322767</p>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        Una vez realizada la transferencia, enviá el comprobante a: <strong>pagos@archub.com.ar</strong>
                      </p>
                      <Button onClick={handleCopyBankInfo} variant="secondary" className="w-full">
                        Copiar información
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Buyer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Datos del comprador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={buyerInfo.fullName}
                      onChange={(e) => setBuyerInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={buyerInfo.email}
                      onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País *</Label>
                    <Select
                      value={buyerInfo.country}
                      onValueChange={(value) => setBuyerInfo(prev => ({ ...prev, country: value }))}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Seleccioná tu país" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Conditions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      Acepto los{' '}
                      <span className="text-accent underline hover:no-underline cursor-pointer">
                        Términos y Condiciones
                      </span>
                      , la{' '}
                      <span className="text-accent underline hover:no-underline cursor-pointer">
                        Política de Privacidad
                      </span>
                      {' '}y la{' '}
                      <span className="text-accent underline hover:no-underline cursor-pointer">
                        Política de Reembolsos
                      </span>
                    </Label>
                  </div>
                  
                  <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>Tus datos están protegidos. Procesamos pagos de forma segura.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Coupon */}
                    {!appliedCoupon ? (
                      <div className="space-y-2">
                        <Label htmlFor="coupon">Cupón de descuento</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !validatingCoupon) {
                                handleValidateCoupon();
                              }
                            }}
                            placeholder="CÓDIGO"
                            className={cn(
                              "flex-1",
                              couponError && "border-red-500"
                            )}
                            disabled={validatingCoupon}
                          />
                          <Button
                            onClick={handleValidateCoupon}
                            disabled={validatingCoupon || !couponCode.trim()}
                            variant="secondary"
                          >
                            {validatingCoupon ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Aplicar'
                            )}
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-sm text-red-500 flex items-center gap-1.5">
                            <X className="h-4 w-4 shrink-0" />
                            {couponError}
                          </p>
                        )}
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
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {priceLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `${currencySymbol} ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          )}
                        </span>
                      </div>
                      
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-accent">
                          <span>Descuento</span>
                          <span>-{currencySymbol} {discount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>
                          {priceLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `${currencySymbol} ${displayPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          )}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Pay Button */}
                    <Button
                      onClick={handlePayNow}
                      disabled={processingPayment || priceLoading || !selectedMethod || !acceptedTerms}
                      className="w-full"
                      size="lg"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {selectedMethod === 'transfer' ? 'Ver datos bancarios' : 'Pagar ahora'}
                        </>
                      )}
                    </Button>

                    {selectedMethod && !processingPayment && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3 shrink-0" />
                        <p>Serás redirigido a {selectedMethod === 'mercadopago' ? 'Mercado Pago' : selectedMethod === 'paypal' ? 'PayPal' : 'la información bancaria'} para completar el pago</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <RefreshCw className="h-3 w-3 shrink-0" />
                      <p>Acceso inmediato al curso después del pago confirmado</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
