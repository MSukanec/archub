import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout/desktop/Layout";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCountries } from "@/hooks/use-countries";
import { PhoneField } from "@/components/ui-custom/fields/PhoneField";
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Building2,
  Tag,
  X,
  CheckCircle,
  Loader2,
  Copy,
  Calendar,
  User,
  Receipt,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoursePrice } from "@/hooks/useCoursePrice";
import { getApiBase } from "@/utils/apiBase";
import mercadoPagoLogo from "/MercadoPago_logo.png";
import paypalLogo from "/Paypal_2014_logo.png";

// Helper para hacer fetch con timeout
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

type PaymentMethod = "mercadopago" | "paypal" | "transfer";

interface AppliedCoupon {
  coupon_id: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  discount: number;
  final_price: number;
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setSidebarContext, setSidebarLevel, sidebarLevel, currentSidebarContext } = useNavigationStore();

  // Get query params (courseSlug)
  const params = new URLSearchParams(window.location.search);
  const courseSlug = params.get("course") || "";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);

  // Set navigation context for sidebar and restore on unmount
  useEffect(() => {
    const previousContext = currentSidebarContext;
    const previousLevel = sidebarLevel;
    
    setSidebarContext('learning');
    setSidebarLevel('learning');

    return () => {
      // Restore previous sidebar context and level when leaving checkout
      setSidebarContext(previousContext);
      setSidebarLevel(previousLevel);
    };
  }, [setSidebarContext, setSidebarLevel]);

  // Provider/currency según método seleccionado
  const currentProvider = selectedMethod === "paypal" ? "paypal" : "mercadopago";
  const currentCurrency = selectedMethod === "paypal" ? "USD" : "ARS";

  const { price: priceData, loading: priceLoading } = useCoursePrice(
    courseSlug,
    currentCurrency,
    currentProvider
  );

  // Cupón
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // User data and countries
  const { data: userData } = useCurrentUser();
  const { data: countries = [] } = useCountries();

  // Basic data form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  // Load user data
  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || "");
      setLastName(userData.user_data?.last_name || "");
      setEmail(userData.user?.email || "");
      setCountry(userData.user_data?.country || "");
    }
  }, [userData]);

  // Redirect si no hay courseSlug
  useEffect(() => {
    if (!courseSlug) {
      navigate("/learning/courses");
    }
  }, [courseSlug, navigate]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Ingresá un código de cupón");
      return;
    }

    if (!priceData) {
      setCouponError("Esperá a que se cargue el precio del curso");
      return;
    }

    try {
      setValidatingCoupon(true);
      setCouponError(null);

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", courseSlug)
        .single();

      if (courseError || !courseData) {
        setCouponError("No se pudo obtener la información del curso");
        return;
      }

      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: couponCode.trim(),
        p_course_id: courseData.id,
        p_price: priceData.amount,
        p_currency: priceData.currency_code,
      });

      if (error) {
        console.error("Error validando cupón:", error);
        setCouponError("Error al validar el cupón");
        return;
      }

      if (!data || !data.ok) {
        const errorMessages: Record<string, string> = {
          NOT_FOUND_OR_INACTIVE: "Cupón inválido o inactivo",
          EXPIRED: "El cupón está vencido",
          NOT_STARTED: "El cupón aún no está disponible",
          USER_LIMIT_REACHED: "Ya alcanzaste el límite de uso de este cupón",
          GLOBAL_LIMIT_REACHED: "Se alcanzó el límite de usos para este cupón",
          NOT_APPLICABLE: "Este cupón no aplica a este curso",
          MINIMUM_NOT_MET: "No alcanzás el mínimo de compra para usar este cupón",
          CURRENCY_MISMATCH: "El cupón no aplica a esta moneda",
          UNAUTHENTICATED: "Tenés que iniciar sesión para usar un cupón",
        };

        const errorMessage =
          errorMessages[data.reason || ""] ||
          "No pudimos aplicar el cupón. Probá de nuevo";
        setCouponError(errorMessage);
        return;
      }

      setCouponError(null);
      setAppliedCoupon({
        coupon_id: data.coupon_id,
        code: couponCode.trim().toUpperCase(),
        type: data.type,
        amount: data.amount,
        discount: data.discount,
        final_price: data.final_price,
      });

      toast({
        title: "✓ Cupón aplicado",
        description: `¡Descuento de ${data.type === "percent" ? data.amount + "%" : "$" + data.amount} aplicado!`,
      });

      setCouponCode("");
    } catch (error: any) {
      console.error("Error al validar cupón:", error);
      setCouponError(error.message || "No se pudo validar el cupón");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Cupón removido",
      description: "El descuento fue quitado",
    });
  };

  const handleMercadoPagoPayment = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Debes iniciar sesión para comprar un curso");
      }

      // Si el cupón deja el precio en 0 → inscripción directa
      const currentFinalPrice = appliedCoupon
        ? appliedCoupon.final_price
        : priceData?.amount || 0;
      if (currentFinalPrice === 0) {
        const API_BASE = getApiBase();
        const response = await fetch(`${API_BASE}/api/checkout/free-enroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            courseSlug,
            code: appliedCoupon?.code,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("Error al inscribir con cupón 100%:", data);
          throw new Error(data?.error || "No se pudo completar la inscripción");
        }

        toast({
          title: "¡Inscripción exitosa!",
          description: "Te inscribiste correctamente al curso. Ya podés acceder al contenido.",
        });

        setTimeout(() => {
          window.location.assign(`/learning/courses/${courseSlug}`);
        }, 1500);
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("No se pudo obtener el usuario autenticado");

      const { data: userRecord, error: eUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

      if (eUser || !userRecord?.id) {
        throw new Error("No se pudo obtener el ID interno del usuario");
      }

      const requestBody = {
        user_id: userRecord.id,
        course_slug: courseSlug,
        currency: "ARS",
        months: priceData?.months || 12,
      };

      console.log("[MP] Creando preferencia…", requestBody);

      const API_BASE = getApiBase();
      const mpUrl = `${API_BASE}/api/mp/create-preference`;

      const res = await fetchWithTimeout(
        mpUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
        15000
      );

      const text = await res.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: text };
      }

      console.log("[MP] Respuesta create-preference:", {
        status: res.status,
        ok: res.ok,
        data: payload,
      });

      if (!res.ok || !payload?.init_point) {
        console.error("[MP] Error al crear preferencia:", payload);
        throw new Error(
          payload?.error
            ? `No se pudo crear la preferencia: ${String(payload.error)}`
            : `create-preference falló: status=${res.status}`
        );
      }

      console.log("[MP] Redirigiendo a:", payload.init_point);
      window.location.assign(payload.init_point);
    } catch (error: any) {
      console.error("[MP] Error fatal:", error);
      toast({
        title: "Error al procesar el pago",
        description: error.message || "No se pudo iniciar el pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Debes iniciar sesión para comprar un curso");
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error("No se pudo obtener el usuario");
      }

      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

      if (!userRecord) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      const finalAmount = appliedCoupon
        ? appliedCoupon.final_price
        : priceData?.amount
          ? Number(priceData.amount)
          : undefined;
      if (!finalAmount || finalAmount <= 0) {
        throw new Error("Precio inválido");
      }

      const courseTitle = (priceData as any)?.courses?.title || courseSlug;
      const description = `${courseTitle} - Suscripción Anual`;

      const requestBody = {
        user_id: userRecord.id,
        course_slug: courseSlug,
        amount_usd: finalAmount,
        description,
      };

      console.log("[PayPal] Creando orden…", requestBody);

      const API_BASE = getApiBase();
      const paypalUrl = `${API_BASE}/api/paypal/create-order`;

      const res = await fetchWithTimeout(
        paypalUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
        15000
      );

      const text = await res.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { ok: false, error: text };
      }

      console.log("[PayPal] Respuesta create-order:", {
        status: res.status,
        ok: res.ok,
        data: payload,
      });

      if (!res.ok || !payload?.ok) {
        console.error("[PayPal] Error al crear orden:", payload);
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }

      const paypal_order = payload.order;
      const approvalLink = paypal_order?.links?.find(
        (link: any) => link.rel === "approve"
      );
      if (!approvalLink?.href) {
        console.error("[PayPal] Order sin approval link:", paypal_order);
        throw new Error("No se recibió la URL de aprobación de PayPal");
      }

      console.log("[PayPal] Redirigiendo a:", approvalLink.href);
      window.location.assign(approvalLink.href);
    } catch (error: any) {
      toast({
        title: "Error al procesar el pago con PayPal",
        description: error.message || "No se pudo iniciar el pago",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleTransferPayment = () => {
    setShowBankInfo(true);
    // Scroll to top para que en mobile el usuario vea la información bancaria
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyBankInfo = async () => {
    const bankInfo = `Banco Galicia - Caja de Ahorro en Pesos

Número de cuenta: 4026691-4 063-1
CBU: 00700634 30004026691416
Alias: MATIAS.SUKANEC
Titular: DNI 32322767

Enviá el comprobante a: +54 9 11 3227-3000`;

    try {
      await navigator.clipboard.writeText(bankInfo);
      toast({
        title: "Datos copiados",
        description: "La información bancaria se copió al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar la información",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    // Validate basic data fields (all required except phone)
    if (!firstName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresá tu nombre",
        variant: "destructive",
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        title: "Apellido requerido",
        description: "Por favor ingresá tu apellido",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresá tu email",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresá un email válido",
        variant: "destructive",
      });
      return;
    }

    if (!country) {
      toast({
        title: "País requerido",
        description: "Por favor seleccioná tu país",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMethod) {
      toast({
        title: "Seleccioná un método de pago",
        description: "Por favor elegí cómo querés pagar antes de continuar",
        variant: "destructive",
      });
      return;
    }

    if (couponCode.trim() && !appliedCoupon) {
      toast({
        title: "Cupón no aplicado",
        description:
          'Hacé clic en "Aplicar" para validar tu cupón o borrá el código para continuar sin descuento',
        variant: "destructive",
      });
      return;
    }

    switch (selectedMethod) {
      case "mercadopago":
        handleMercadoPagoPayment();
        break;
      case "paypal":
        handlePayPalPayment();
        break;
      case "transfer":
        handleTransferPayment();
        break;
    }
  };

  const finalPrice = appliedCoupon ? appliedCoupon.final_price : priceData?.amount || 0;
  const hasDiscount = appliedCoupon && appliedCoupon.discount > 0;
  const courseTitle = (priceData as any)?.courses?.title || "Curso";

  if (!courseSlug) {
    return null;
  }

  const headerProps = {
    icon: ShoppingCart,
    title: "Checkout",
    pageTitle: "Completá tu compra de forma segura",
    actions: [
      <Button
        key="back"
        variant="ghost"
        size="sm"
        onClick={() => navigate("/learning/courses")}
        className="gap-2"
        data-testid="button-back-to-course"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </Button>
    ]
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="max-w-7xl mx-auto py-6 lg:py-8">
        {/* Title Section - Full Width */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Elegí cómo pagar
          </h1>
          <p className="text-muted-foreground mt-2">
            Seleccioná tu método de pago preferido y completá la compra de forma segura
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Payment Methods (Mobile: shows first) */}
          <div className="lg:col-span-7 order-1 lg:order-1">
            <div className="space-y-6">
              {!showBankInfo ? (
                <div className="space-y-6">
                  {/* Basic Data */}
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-accent" />
                      <h2 className="text-lg font-semibold">Datos Básicos</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Nombre <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Tu nombre"
                            data-testid="input-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Apellido <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Tu apellido"
                            data-testid="input-last-name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          data-testid="input-email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          País <span className="text-destructive">*</span>
                        </Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder="Seleccioná tu país" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Teléfono
                        </Label>
                        <PhoneField
                          value={phone}
                          onChange={setPhone}
                          placeholder="Número de teléfono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-accent" />
                      <h2 className="text-lg font-semibold">Métodos de pago</h2>
                    </div>
                    <RadioGroup
                      value={selectedMethod || ""}
                      onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
                      className="space-y-3"
                      data-testid="payment-method-radio-group"
                    >
                      {/* Mercado Pago */}
                      <div
                        className={cn(
                          "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-accent/50",
                          selectedMethod === "mercadopago"
                            ? "border-accent bg-accent/5 shadow-sm"
                            : "border-border"
                        )}
                        onClick={() => setSelectedMethod("mercadopago")}
                        data-testid="payment-option-mercadopago"
                      >
                        <RadioGroupItem value="mercadopago" id="mercadopago" className="mt-0.5" />
                        <div className="flex-1 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor="mercadopago"
                              className="flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <CreditCard className="h-5 w-5 text-accent" />
                              Mercado Pago (ARS)
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tarjeta de crédito o débito. Pago seguro con redirección.
                            </p>
                          </div>
                          <img
                            src={mercadoPagoLogo}
                            alt="Mercado Pago"
                            className="h-10 sm:h-12 object-contain flex-shrink-0"
                          />
                        </div>
                      </div>

                      {/* PayPal */}
                      <div
                        className={cn(
                          "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-accent/50",
                          selectedMethod === "paypal"
                            ? "border-accent bg-accent/5 shadow-sm"
                            : "border-border"
                        )}
                        onClick={() => setSelectedMethod("paypal")}
                        data-testid="payment-option-paypal"
                      >
                        <RadioGroupItem value="paypal" id="paypal" className="mt-0.5" />
                        <div className="flex-1 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor="paypal"
                              className="flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <CreditCard className="h-5 w-5 text-accent" />
                              PayPal (USD)
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pago internacional seguro. Acepta tarjetas y saldo PayPal.
                            </p>
                          </div>
                          <img
                            src={paypalLogo}
                            alt="PayPal"
                            className="h-10 sm:h-12 object-contain flex-shrink-0"
                          />
                        </div>
                      </div>

                      {/* Transferencia */}
                      <div
                        className={cn(
                          "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-accent/50",
                          selectedMethod === "transfer"
                            ? "border-accent bg-accent/5 shadow-sm"
                            : "border-border"
                        )}
                        onClick={() => setSelectedMethod("transfer")}
                        data-testid="payment-option-transfer"
                      >
                        <RadioGroupItem value="transfer" id="transfer" className="mt-0.5" />
                        <div className="flex-1">
                          <Label
                            htmlFor="transfer"
                            className="flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <Building2 className="h-5 w-5 text-accent" />
                            Transferencia Bancaria (ARS)
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Transferencia o depósito directo. Aprobación manual.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                /* Bank Transfer Info */
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-6">
                    <Building2 className="h-6 w-6 text-accent mt-1" />
                    <div>
                      <h2 className="text-lg font-semibold">Datos para Transferencia</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Realizá la transferencia a la siguiente cuenta
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg font-mono text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Banco</p>
                      <p className="font-medium">Banco Galicia - Caja de Ahorro en Pesos</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Número de cuenta</p>
                      <p className="font-medium">4026691-4 063-1</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CBU</p>
                      <p className="font-medium">00700634 30004026691416</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Alias</p>
                      <p className="font-medium">MATIAS.SUKANEC</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Titular</p>
                      <p className="font-medium">DNI 32322767</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Enviá el comprobante a</p>
                      <a
                        href="https://wa.me/5491132273000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium flex items-center gap-2 text-accent hover:underline"
                        data-testid="link-whatsapp"
                      >
                        <MessageCircle className="h-4 w-4" />
                        +54 9 11 3227-3000
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="default"
                      onClick={handleCopyBankInfo}
                      className="flex-1"
                      data-testid="button-copy-bank-info"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar datos
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setShowBankInfo(false)}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Coupon & Order Summary (Mobile: shows second) */}
          <div className="lg:col-span-5 order-2 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Coupon Section */}
              {!appliedCoupon ? (
                <div className="bg-card border rounded-lg p-6">
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-accent" />
                    Código de descuento (opcional)
                  </Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ingresá tu código"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !validatingCoupon) {
                            handleValidateCoupon();
                          }
                        }}
                        disabled={validatingCoupon}
                        className={cn(
                          "flex-1",
                          couponError && "border-red-500 focus-visible:ring-red-500"
                        )}
                        data-testid="input-coupon-code"
                      />
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        variant="default"
                        data-testid="button-apply-coupon"
                      >
                        {validatingCoupon ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validando
                          </>
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    </div>
                    {couponError && (
                      <p
                        className="text-sm text-red-500 flex items-center gap-1.5"
                        data-testid="coupon-error-message"
                      >
                        <X className="h-4 w-4 shrink-0" />
                        {couponError}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-lg p-4 flex items-center justify-between border"
                  style={{
                    borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--accent) 5%, transparent)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" style={{ color: "var(--accent)" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appliedCoupon.type === "percent"
                          ? `${appliedCoupon.amount}% de descuento`
                          : `$${appliedCoupon.amount} de descuento`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="h-8 px-3"
                    data-testid="button-remove-coupon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold">Resumen de compra</h2>
                </div>

                {priceLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Course Info */}
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Curso</p>
                      <p className="text-base font-semibold mt-1">{courseTitle}</p>
                    </div>

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio</span>
                        <span className="font-medium">
                          {currentCurrency} ${priceData?.amount?.toLocaleString("es-AR") || "0"}
                        </span>
                      </div>

                      {hasDiscount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Descuento</span>
                          <span className="font-medium text-accent">
                            - {currentCurrency} ${appliedCoupon.discount.toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-semibold">Total</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {currentCurrency} ${finalPrice.toLocaleString("es-AR")}
                        </p>
                        {selectedMethod && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedMethod === "paypal" ? "Pago en USD" : "Pago en ARS"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                        <p>Acceso inmediato al curso después del pago</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                        <p>Suscripción válida por 365 días desde la compra</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                        <p>Soporte incluido durante todo el período</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedMethod || loading || priceLoading}
                      className="w-full h-12 text-base font-medium mt-6"
                      data-testid="button-continue-payment"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          Continuar al pago
                          <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Security Badge */}
              <div className="mt-4 text-center text-xs text-muted-foreground">
                <p className="flex items-center justify-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Pago seguro y encriptado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
