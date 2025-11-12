import { useState, useEffect } from "react";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import FormModalBody from "@/components/modal/form/FormModalBody";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import {
  ShoppingCart,
  Copy,
  CheckCircle,
  CreditCard,
  Building2,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import mercadoPagoLogo from "/MercadoPago_logo.png";
import paypalLogo from "/Paypal_2014_logo.png";
import { useCoursePrice } from "@/hooks/useCoursePrice";
import { getApiBase } from "@/utils/apiBase";

// Helper para hacer fetch con timeout y evitar requests colgadas
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

interface PaymentMethodModalProps {
  courseSlug: string;
  currency: "ARS" | "USD";
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

export default function PaymentMethodModal({
  courseSlug,
  currency,
}: PaymentMethodModalProps) {
  const { closeModal } = useGlobalModalStore();
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  // Provider/currency visibles según método
  const currentProvider =
    selectedMethod === "paypal" ? "paypal" : "mercadopago";
  const currentCurrency = selectedMethod === "paypal" ? "USD" : "ARS";

  const { price: priceData, loading: priceLoading } = useCoursePrice(
    courseSlug,
    currentCurrency,
    currentProvider,
  );

  const [loading, setLoading] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);

  // Cupón
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);

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
          MINIMUM_NOT_MET:
            "No alcanzás el mínimo de compra para usar este cupón",
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

  // === NUEVO: flujo Mercado Pago contra /api/mp/create-preference ===
  const handleMercadoPagoPayment = async () => {
    try {
      setLoading(true);

      // Requiere sesión para obtener user_id de tu tabla "users"
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
          description:
            "Te inscribiste correctamente al curso. Ya podés acceder al contenido.",
        });

        setTimeout(() => {
          window.location.assign(`/learning/courses/${courseSlug}`);
        }, 1500);
        return;
      }

      // Obtener user_id (tu UUID interno) desde "users" con auth_id
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser)
        throw new Error("No se pudo obtener el usuario autenticado");

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

      // Llamada al nuevo endpoint en Vercel con timeout
      const API_BASE = getApiBase();
      console.log("[MP] API_BASE:", API_BASE);
      console.log("[MP] VITE_API_BASE:", import.meta.env.VITE_API_BASE);
      
      // DIAGNÓSTICO: Para probar con endpoint fake, descomentar esta línea y comentar la de abajo:
      // const mpUrl = `${API_BASE}/api/diag/fake-mp`;
      const mpUrl = `${API_BASE}/api/mp/create-course-preference`;
      
      console.log("[MP] URL completa:", mpUrl);
      
      const res = await fetchWithTimeout(
        mpUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
        15000 // timeout de 15 segundos
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
        data: payload 
      });

      if (!res.ok || !payload?.init_point) {
        console.error("[MP] Error al crear preferencia:", payload);
        throw new Error(
          payload?.error 
            ? `No se pudo crear la preferencia: ${String(payload.error)}`
            : `create-preference falló: status=${res.status}`
        );
      }

      // Redirige al checkout de Mercado Pago
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
        months: priceData?.months || 12,
        ...(appliedCoupon && { code: appliedCoupon.code }),
        description,
      };

      console.log("[PayPal] Creando orden…", requestBody);

      const API_BASE = getApiBase();
      console.log("[PayPal] API_BASE:", API_BASE);
      console.log("[PayPal] VITE_API_BASE:", import.meta.env.VITE_API_BASE);
      
      const paypalUrl = `${API_BASE}/api/paypal/create-course-order`;
      console.log("[PayPal] URL completa:", paypalUrl);
      
      const res = await fetchWithTimeout(
        paypalUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
        15000 // timeout de 15 segundos
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
        data: payload
      });

      if (!res.ok || !payload?.ok) {
        console.error("[PayPal] Error al crear orden:", payload);
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }

      const paypal_order = payload.order;
      const approvalLink = paypal_order?.links?.find(
        (link: any) => link.rel === "approve",
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
    if (!selectedMethod) return;

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

  const handleCancel = () => {
    closeModal();
  };

  const finalPrice = appliedCoupon
    ? appliedCoupon.final_price
    : priceData?.amount || 0;
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
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor:
                  "color-mix(in srgb, var(--accent) 30%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent) 10%, transparent)",
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "var(--accent)" }}
              >
                💳 Suscripción Anual - Acceso por 365 días corridos
              </p>
              <p
                className="text-xs mt-1"
                style={{
                  color: "color-mix(in srgb, var(--accent) 80%, transparent)",
                }}
              >
                Disfrutá del curso completo durante un año desde la fecha de
                compra
              </p>
            </div>

            {/* Cupón */}
            {!appliedCoupon ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-accent" />
                  Código de descuento
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
                        couponError &&
                          "border-red-500 focus-visible:ring-red-500",
                      )}
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
                className="rounded-lg p-3 flex items-center justify-between"
                style={{
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor:
                    "color-mix(in srgb, var(--accent) 30%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--accent) 5%, transparent)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    {appliedCoupon.code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {appliedCoupon.type === "percent"
                      ? `${appliedCoupon.amount}% OFF`
                      : `$${appliedCoupon.amount} OFF`}
                    )
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
              value={selectedMethod || ""}
              onValueChange={(value) =>
                setSelectedMethod(value as PaymentMethod)
              }
              data-testid="payment-method-radio-group"
            >
              <div
                className={cn(
                  "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  selectedMethod === "mercadopago"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50",
                )}
                onClick={() => setSelectedMethod("mercadopago")}
                data-testid="payment-option-mercadopago"
              >
                <RadioGroupItem
                  value="mercadopago"
                  id="mercadopago"
                  className="mt-0.5"
                />
                <div className="flex-1 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label
                      htmlFor="mercadopago"
                      className="flex items-center gap-2 cursor-pointer"
                    >
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
                  selectedMethod === "paypal"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50",
                )}
                onClick={() => setSelectedMethod("paypal")}
                data-testid="payment-option-paypal"
              >
                <RadioGroupItem value="paypal" id="paypal" className="mt-0.5" />
                <div className="flex-1 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label
                      htmlFor="paypal"
                      className="flex items-center gap-2 cursor-pointer"
                    >
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

              <div
                className={cn(
                  "relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  selectedMethod === "transfer"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50",
                )}
                onClick={() => setSelectedMethod("transfer")}
                data-testid="payment-option-transfer"
              >
                <RadioGroupItem
                  value="transfer"
                  id="transfer"
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="transfer"
                    className="flex items-center gap-2 cursor-pointer"
                  >
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
                    <span className="text-sm text-muted-foreground">
                      Cargando precio...
                    </span>
                  </div>
                ) : priceData ? (
                  <>
                    {hasDiscount && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Precio original
                          </span>
                          <span className="text-muted-foreground line-through">
                            {priceData.currency_code === "ARS" ? "$" : "USD"}{" "}
                            {priceData.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: "var(--accent)" }}>
                            Cupón ({appliedCoupon.code})
                          </span>
                          <span style={{ color: "var(--accent)" }}>
                            −{priceData.currency_code === "ARS" ? "$" : "USD"}{" "}
                            {appliedCoupon.discount.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-px bg-border my-2" />
                      </div>
                    )}
                    <p className="text-2xl font-bold mt-1">
                      {priceData.currency_code === "ARS" ? "$" : "USD"}{" "}
                      {finalPrice.toLocaleString()}
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
              <p className="text-base font-semibold mt-1">
                Banco Galicia - Caja de Ahorro en Pesos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Número de cuenta
                </p>
                <p className="text-base font-mono mt-1">4026691-4 063-1</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CBU</p>
                <p className="text-base font-mono mt-1">
                  00700634 30004026691416
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Alias
                </p>
                <p className="text-base font-mono mt-1">MATIAS.SUKANEC</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Titular
                </p>
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
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--accent) 10%, transparent)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              Enviá el comprobante a:{" "}
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
      submitText={
        loading ? "Procesando..." : showBankInfo ? "Cerrar" : "Continuar"
      }
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
