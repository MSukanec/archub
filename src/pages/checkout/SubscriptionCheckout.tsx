import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { getUserByAuthId } from "@/lib/supabase-helpers";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/features/users/hooks";
import { useCountries } from "@/hooks/use-countries";
import { PhoneField } from "@/components/shared/fields/PhoneField";
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Loader2,
  Calendar,
  User,
  Receipt,
  Crown,
  Check,
  ExternalLink,
  Tag,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/utils/apiBase";
import { toE164, fromE164 } from "@/utils/phone";
import { useFlowBlocking } from "@/hooks/use-flow-blocking";
import { FlowBlockedBanner } from "@/components/shared/FlowBlockedBanner";
import mercadoPagoLogo from "/MercadoPago_logo.png";
import paypalLogo from "/Paypal_2014_logo.png";

interface ProrationData {
  hasActiveSubscription: boolean;
  currentPlan: { id: string; name: string; slug: string } | null;
  credit: {
    daysRemaining: number;
    totalDays: number;
    percentageRemaining: number;
    creditAmount: number;
    creditCurrency: string;
  } | null;
  targetPlan: {
    id: string;
    name: string;
    slug: string;
    priceUSD: number;
    priceARS: number;
  };
  finalPrice: { usd: number; ars: number };
  savings: { usd: number; ars: number };
}

interface ValidatedCoupon {
  valid: boolean;
  coupon_id: string;
  code: string;
  type: 'percentage' | 'fixed';
  amount: number;
  discount_usd: number;
  discount_ars: number;
  final_price_usd: number;
  final_price_ars: number;
  is_full_discount: boolean;
}

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

type PaymentMethod = "mercadopago" | "paypal";

interface PlanData {
  id: string;
  name: string;
  slug: string;
  features: any;
  monthly_amount: string;
  annual_amount: string;
}

export default function SubscriptionCheckout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();

  const params = new URLSearchParams(window.location.search);
  const planSlug = params.get("plan") || "";
  const billingPeriod = params.get("billing") || "annual";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPaymentInitiated, setIsPaymentInitiated] = useState(false);

  const { isBlocked: isCheckoutBlocked, message: checkoutBlockedMessage } = useFlowBlocking('billing_checkout');

  useEffect(() => {
    const previousLevel = sidebarLevel;
    
    setSidebarLevel('general');

    return () => {
      setSidebarLevel(previousLevel);
    };
  }, [setSidebarLevel]);

  const currentProvider = selectedMethod === "paypal" ? "paypal" : "mercadopago";
  const currentCurrency = selectedMethod === "paypal" ? "USD" : "ARS";

  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [priceLoading, setPriceLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [prorationData, setProrationData] = useState<ProrationData | null>(null);
  const [prorationLoading, setProrationLoading] = useState(false);

  const { data: userData } = useCurrentUser();
  const { data: countries = [] } = useCountries();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mercadopagoEmail, setMercadopagoEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCommunications, setAcceptCommunications] = useState(false);

  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatedCoupon, setValidatedCoupon] = useState<ValidatedCoupon | null>(null);

  useEffect(() => {
    if (planSlug) {
      const loadPlanData = async () => {
        setPriceLoading(true);
        const { data, error } = await supabase
          .from("plans")
          .select("id, name, slug, features, monthly_amount, annual_amount")
          .eq("slug", planSlug)
          .single();

        if (error) {
          console.error("Error loading plan:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar el plan",
            variant: "destructive",
          });
          setPriceLoading(false);
          return;
        }

        setPlanData(data);
        setPriceLoading(false);
      };

      loadPlanData();
    }
  }, [planSlug, toast]);

  useEffect(() => {
    if (planSlug && organizationId) {
      const loadProration = async () => {
        setProrationLoading(true);
        console.log('[Proration] Starting load for org:', organizationId, 'plan:', planSlug);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            console.log('[Proration] No session token');
            setProrationLoading(false);
            return;
          }

          const API_BASE = getApiBase();
          const res = await fetch(`${API_BASE}/api/checkout/calculate-proration`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              organization_id: organizationId,
              target_plan_slug: planSlug,
              billing_period: billingPeriod,
            }),
          });

          if (res.ok) {
            const result = await res.json();
            console.log('[Proration] API Response:', result);
            if (result.ok && result.data) {
              setProrationData(result.data);
              console.log('[Proration] Loaded successfully:', {
                hasActiveSubscription: result.data.hasActiveSubscription,
                currentPlan: result.data.currentPlan?.name,
                credit: result.data.credit,
                finalPrice: result.data.finalPrice,
                savings: result.data.savings
              });
            }
          } else {
            console.error('[Proration] API Error:', res.status, res.statusText);
          }
        } catch (error) {
          console.error('[Proration] Error loading:', error);
        } finally {
          setProrationLoading(false);
        }
      };

      loadProration();
    } else {
      console.log('[Proration] Waiting for data - planSlug:', planSlug, 'organizationId:', organizationId);
    }
  }, [planSlug, organizationId, billingPeriod]);

  useEffect(() => {
    if (selectedMethod === 'mercadopago') {
      const loadExchangeRate = async () => {
        const { data, error } = await supabase
          .from("exchange_rates")
          .select("rate")
          .eq("from_currency", "USD")
          .eq("to_currency", "ARS")
          .eq("is_active", true)
          .single();

        if (error) {
          console.error("Error loading exchange rate:", error);
          setExchangeRate(1500);
          return;
        }

        setExchangeRate(parseFloat(data.rate));
      };

      loadExchangeRate();
    } else {
      setExchangeRate(1);
    }
  }, [selectedMethod]);

  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || "");
      setLastName(userData.user_data?.last_name || "");
      setEmail(userData.user?.email || "");
      setMercadopagoEmail(userData.user?.email || "");
      setCountry(userData.user_data?.country || "");
      
      if (userData.user_data?.phone_e164) {
        setPhone(fromE164(userData.user_data.phone_e164));
      }

      if (userData.organization?.id) {
        setOrganizationId(userData.organization.id);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (country && selectedMethod === null) {
      const isArgentina = country === 'Argentina' || country === 'argentina' || country === 'AR' || country === 'ARG';
      const defaultMethod: PaymentMethod = isArgentina ? 'mercadopago' : 'paypal';
      console.log('[Checkout] Auto-selecting payment method:', defaultMethod, 'for country:', country);
      setSelectedMethod(defaultMethod);
    }
  }, [country, selectedMethod]);

  useEffect(() => {
    if (!needsInvoice || !userData?.user?.id) {
      return;
    }

    const loadBillingProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('billing_profiles')
          .select('*')
          .eq('user_id', userData.user.id)
          .maybeSingle();

        if (error) {
          console.error('[billing_profiles] Error loading profile:', error);
          return;
        }

        if (data) {
          if (!isCompany && data.is_company) setIsCompany(data.is_company);
          if (!companyName && data.company_name) setCompanyName(data.company_name);
          if (!taxId && data.tax_id) setTaxId(data.tax_id);
          if (!billingAddress && data.address_line1) setBillingAddress(data.address_line1);
          if (!billingCity && data.city) setBillingCity(data.city);
          if (!billingPostcode && data.postcode) setBillingPostcode(data.postcode);
        }
      } catch (e) {
        console.error('[billing_profiles] Unexpected error:', e);
      }
    };

    loadBillingProfile();
  }, [needsInvoice, userData?.user?.id]);

  useEffect(() => {
    if (!planSlug) {
      navigate("/settings/pricing-plan");
    }
  }, [planSlug, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const isFormValid =
          selectedMethod &&
          !loading &&
          !priceLoading &&
          acceptTerms &&
          acceptCommunications &&
          firstName.trim() &&
          email.trim() &&
          country;

        if (isFormValid && !(e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          handleContinue();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedMethod,
    loading,
    priceLoading,
    acceptTerms,
    acceptCommunications,
    firstName,
    email,
    country,
  ]);

  const saveBillingProfile = async (userId: string) => {
    if (!needsInvoice) return;

    try {
      const billingData = {
        user_id: userId,
        is_company: isCompany,
        company_name: isCompany ? companyName : null,
        tax_id: taxId,
        address_line1: billingAddress || null,
        city: billingCity || null,
        postcode: billingPostcode || null,
        country: country,
      };

      const { data: existing } = await supabase
        .from('billing_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('billing_profiles')
          .update(billingData)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('billing_profiles')
          .insert(billingData);
      }
    } catch (error) {
      console.error('Error saving billing profile:', error);
    }
  };

  const getBillingData = () => {
    if (!needsInvoice) return null;

    return {
      is_company: isCompany,
      company_name: isCompany ? companyName : null,
      first_name: !isCompany ? firstName : null,
      last_name: !isCompany ? lastName : null,
      tax_id: taxId,
      address_line1: billingAddress || null,
      city: billingCity || null,
      postcode: billingPostcode || null,
      country: country,
    };
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !planData?.id) return;

    if (!selectedMethod) {
      setCouponError("Seleccioná un método de pago antes de aplicar un cupón");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setCouponError("Debes iniciar sesión para aplicar un cupón");
        return;
      }

      const currency = selectedMethod === 'paypal' ? 'USD' : 'ARS';

      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/checkout/validate-subscription-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          coupon_code: couponCode.trim(),
          plan_id: planData.id,
          billing_period: billingPeriod,
          currency,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        setCouponError(result.error || "Cupón inválido");
        setValidatedCoupon(null);
        return;
      }

      setValidatedCoupon(result.data);
      setCouponCode("");
      
      toast({
        title: "Cupón aplicado",
        description: `Descuento de ${result.data.type === 'percentage' ? `${result.data.amount}%` : `$${result.data.discount_usd} USD`} aplicado correctamente`,
      });
    } catch (error: any) {
      console.error('[Coupon] Error validating:', error);
      setCouponError("Error al validar el cupón");
      setValidatedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setValidatedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    
    toast({
      title: "Cupón removido",
      description: "El cupón ha sido removido de tu pedido",
    });
  };

  const handleMercadoPagoPayment = async () => {
    // Double-click protection: prevent if already initiated
    if (isPaymentInitiated) {
      console.warn('[MP] Payment already initiated, ignoring duplicate click');
      return;
    }
    
    try {
      setIsPaymentInitiated(true);
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Debes iniciar sesión para suscribirte");
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("No se pudo obtener el usuario autenticado");

      const userRecord = await getUserByAuthId(authUser.id);

      if (!userRecord?.id) {
        throw new Error("No se pudo obtener el ID interno del usuario");
      }

      await saveBillingProfile(userRecord.id);

      if (!organizationId) {
        throw new Error("No se encontró la organización del usuario");
      }

      const hasProration = prorationData?.hasActiveSubscription && (prorationData?.savings?.ars ?? 0) > 0;

      const API_BASE = getApiBase();

      if (hasProration) {
        const upgradeBody = {
          plan_slug: planSlug,
          organization_id: organizationId,
          billing_period: billingPeriod,
          payer_email: mercadopagoEmail || email,
        };

        console.log("[MP] Creando preferencia de upgrade híbrido (pago único + recurrente)…", upgradeBody);

        const mpUrl = `${API_BASE}/api/checkout/mp/create-upgrade-preference`;

        const res = await fetchWithTimeout(
          mpUrl,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(upgradeBody),
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

        console.log("[MP] Respuesta create-upgrade-preference:", {
          status: res.status,
          ok: res.ok,
          data: payload,
        });

        if (!res.ok) {
          console.error("[MP] Error al crear preferencia de upgrade:", payload);
          throw new Error(
            payload?.error
              ? `No se pudo crear la preferencia: ${String(payload.error)}`
              : `create-upgrade-preference falló: status=${res.status}`
          );
        }

        if (!payload?.init_point) {
          throw new Error("La preferencia no tiene init_point");
        }

        console.log("[MP] Redirigiendo a pago único de upgrade:", payload.init_point);
        window.location.assign(payload.init_point);
        return;
      }

      const requestBody = {
        user_id: userRecord.id,
        product_type: 'subscription',
        plan_slug: planSlug,
        organization_id: organizationId,
        billing_period: billingPeriod,
        currency: "ARS",
        is_upgrade: false,
        payer_email: mercadopagoEmail || email,
        ...(validatedCoupon && { coupon_code: validatedCoupon.code }),
      };

      console.log("[MP] Creando suscripción recurrente (nueva)…", requestBody);

      const mpUrl = `${API_BASE}/api/checkout/mp/create-recurring`;

      const res = await fetchWithTimeout(
        mpUrl,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
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

      if (!res.ok) {
        console.error("[MP] Error al crear preferencia:", payload);
        throw new Error(
          payload?.error
            ? `No se pudo crear la preferencia: ${String(payload.error)}`
            : `create-preference falló: status=${res.status}`
        );
      }

      if (payload?.gifted) {
        // Invalidate all subscription-related queries to refresh UI immediately
        // Use predicate to match all variants of organization and billing queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['current-user'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/current-user'] }),
          // Invalidate all organization-related queries (matches all suffixes)
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey;
              if (!Array.isArray(key)) return false;
              const first = key[0] as string;
              return first.includes('organization') || first.includes('billing') || first.includes('members');
            }
          }),
        ]);
        
        toast({
          title: "¡Suscripción activada!",
          description: "Tu cupón de 100% descuento ha sido aplicado. Tu suscripción está activa.",
        });
        navigate("/organization/billing?subscription=success");
        return;
      }

      if (!payload?.init_point) {
        throw new Error("La preferencia no tiene init_point");
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
      // Reset payment initiated on error so user can retry
      setIsPaymentInitiated(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    // Double-click protection: prevent if already initiated
    if (isPaymentInitiated) {
      console.warn('[PayPal] Payment already initiated, ignoring duplicate click');
      return;
    }
    
    setIsPaymentInitiated(true);
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Debes iniciar sesión para suscribirte");
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error("No se pudo obtener el usuario");
      }

      const userRecord = await getUserByAuthId(authUser.id);

      if (!userRecord) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      await saveBillingProfile(userRecord.id);

      if (!organizationId) {
        throw new Error("No se encontró la organización del usuario");
      }

      const baseAmount = billingPeriod === 'annual' 
        ? parseFloat(planData?.annual_amount || '0')
        : parseFloat(planData?.monthly_amount || '0');

      if (!baseAmount || baseAmount <= 0) {
        throw new Error("Precio inválido");
      }

      const isUpgrade = prorationData?.hasActiveSubscription && (prorationData?.savings?.usd ?? 0) > 0;

      const description = isUpgrade
        ? `Upgrade ${prorationData?.currentPlan?.name} → ${planData?.name || planSlug} - ${billingPeriod === 'annual' ? 'Anual' : 'Mensual'}`
        : `Suscripción ${planData?.name || planSlug} - ${billingPeriod === 'annual' ? 'Anual' : 'Mensual'}`;

      const billing = getBillingData();
      const requestBody = {
        user_id: userRecord.id,
        plan_slug: planSlug,
        organization_id: organizationId,
        billing_period: billingPeriod,
        amount_usd: baseAmount,
        description,
        is_upgrade: isUpgrade,
        proration_credit: 0,
        ...(billing && { billing }),
        ...(validatedCoupon && { coupon_code: validatedCoupon.code }),
      };

      const API_BASE = getApiBase();
      
      const paypalUrl = isUpgrade
        ? `${API_BASE}/api/checkout/paypal/create-upgrade`
        : `${API_BASE}/api/checkout/paypal/create-subscription`;
      
      console.log(`[PayPal] ${isUpgrade ? 'Creando orden de upgrade prorrateado' : 'Creando orden de suscripción'}…`, requestBody);

      const res = await fetchWithTimeout(
        paypalUrl,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
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

      if (payload?.gifted) {
        // Invalidate all subscription-related queries to refresh UI immediately
        // Use predicate to match all variants of organization and billing queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['current-user'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/current-user'] }),
          // Invalidate all organization-related queries (matches all suffixes)
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey;
              if (!Array.isArray(key)) return false;
              const first = key[0] as string;
              return first.includes('organization') || first.includes('billing') || first.includes('members');
            }
          }),
        ]);
        
        toast({
          title: "¡Suscripción activada!",
          description: "Tu cupón de 100% descuento ha sido aplicado. Tu suscripción está activa.",
        });
        navigate("/organization/billing?subscription=success");
        return;
      }

      const approvalUrl = payload.approval_url;
      if (!approvalUrl) {
        console.error("[PayPal] No approval URL in payload:", payload);
        throw new Error("No se recibió la URL de aprobación de PayPal");
      }

      console.log("[PayPal] Redirigiendo a:", approvalUrl);
      window.location.assign(approvalUrl);
    } catch (error: any) {
      toast({
        title: "Error al procesar el pago con PayPal",
        description: error.message || "No se pudo iniciar el pago",
        variant: "destructive",
      });
      // Reset payment initiated on error so user can retry
      setIsPaymentInitiated(false);
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    // Check if flow is blocked
    if (isCheckoutBlocked) {
      toast({
        title: checkoutBlockedMessage.title,
        description: checkoutBlockedMessage.description,
        variant: "destructive",
      });
      return;
    }

    // Early exit if payment already initiated
    if (isPaymentInitiated || loading) {
      console.warn('[Checkout] Payment already in progress, ignoring click');
      return;
    }
    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresá tu nombre",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedEmail) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresá tu email",
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

    if (!acceptTerms) {
      toast({
        title: "Términos y condiciones",
        description: "Debes aceptar los términos y condiciones para continuar",
        variant: "destructive",
      });
      return;
    }

    if (!acceptCommunications) {
      toast({
        title: "Aceptación requerida",
        description: "Debes aceptar recibir comunicaciones sobre tu suscripción",
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

    if (needsInvoice) {
      if (isCompany && !companyName.trim()) {
        toast({
          title: "Nombre de empresa requerido",
          description: "Por favor ingresá el nombre de la empresa",
          variant: "destructive",
        });
        return;
      }
      if (!taxId.trim()) {
        toast({
          title: "CUIT / Tax ID requerido",
          description: "Por favor ingresá tu CUIT / VAT / GST / Tax ID",
          variant: "destructive",
        });
        return;
      }
      if (isCompany && !country) {
        toast({
          title: "País requerido",
          description: "Por favor seleccioná el país",
          variant: "destructive",
        });
        return;
      }
    }

    if (userData?.user?.id) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const API_BASE = getApiBase();
          
          let normalizedPhone = null;
          if (phone && country) {
            const countryData = countries.find(c => c.id === country);
            if (countryData?.alpha_3) {
              normalizedPhone = toE164(phone, countryData.alpha_3);
            }
          }

          const profileData: any = {
            user_id: userData.user.id,
            first_name: trimmedFirstName,
            last_name: lastName?.trim() || null,
            country: country,
          };
          
          if (normalizedPhone) {
            profileData.phone_e164 = normalizedPhone;
          }
          
          await fetch(`${API_BASE}/api/user/profile`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(profileData),
          });
        }
      } catch (error) {
        console.error("Error saving profile data:", error);
      }
    }

    switch (selectedMethod) {
      case "mercadopago":
        handleMercadoPagoPayment();
        break;
      case "paypal":
        handlePayPalPayment();
        break;
    }
  };

  const calculatePrice = useMemo(() => {
    if (!planData) return { 
      amount: '0.00', 
      currency: 'USD', 
      numericAmount: 0,
      originalAmount: 0,
      hasProrationDiscount: false,
      prorationDiscountAmount: 0,
      hasCouponDiscount: false,
      couponDiscountAmount: 0,
      isFullDiscount: false
    };
    
    const basePrice = billingPeriod === 'annual' 
      ? parseFloat(planData.annual_amount) 
      : parseFloat(planData.monthly_amount);
    
    if (selectedMethod === 'mercadopago') {
      const arsAmount = basePrice * exchangeRate;
      
      const hasProration = prorationData?.hasActiveSubscription && (prorationData?.savings?.ars ?? 0) > 0;
      
      let priceAfterProration = arsAmount;
      let prorationDiscount = 0;
      
      if (hasProration && prorationData?.finalPrice?.ars !== undefined) {
        priceAfterProration = prorationData.finalPrice.ars;
        prorationDiscount = prorationData.savings.ars;
      }
      
      if (validatedCoupon) {
        const couponDiscountARS = validatedCoupon.discount_ars;
        const finalPriceARS = Math.max(0, priceAfterProration - couponDiscountARS);
        
        return {
          amount: finalPriceARS.toFixed(2),
          currency: 'ARS',
          numericAmount: finalPriceARS,
          originalAmount: arsAmount,
          hasProrationDiscount: hasProration,
          prorationDiscountAmount: prorationDiscount,
          hasCouponDiscount: true,
          couponDiscountAmount: couponDiscountARS,
          isFullDiscount: validatedCoupon.is_full_discount || finalPriceARS === 0
        };
      }
      
      return {
        amount: priceAfterProration.toFixed(2),
        currency: 'ARS',
        numericAmount: priceAfterProration,
        originalAmount: arsAmount,
        hasProrationDiscount: hasProration,
        prorationDiscountAmount: prorationDiscount,
        hasCouponDiscount: false,
        couponDiscountAmount: 0,
        isFullDiscount: false
      };
    }
    
    const hasPayPalProration = prorationData?.hasActiveSubscription && (prorationData?.savings?.usd ?? 0) > 0;
    
    let priceAfterProrationUSD = basePrice;
    let prorationDiscountUSD = 0;
    
    if (hasPayPalProration && prorationData?.finalPrice?.usd !== undefined) {
      priceAfterProrationUSD = prorationData.finalPrice.usd;
      prorationDiscountUSD = prorationData.savings.usd;
    }
    
    if (validatedCoupon) {
      const couponDiscountUSD = validatedCoupon.discount_usd;
      const finalPriceUSD = Math.max(0, priceAfterProrationUSD - couponDiscountUSD);
      
      return {
        amount: finalPriceUSD.toFixed(2),
        currency: 'USD',
        numericAmount: finalPriceUSD,
        originalAmount: basePrice,
        hasProrationDiscount: hasPayPalProration,
        prorationDiscountAmount: prorationDiscountUSD,
        hasCouponDiscount: true,
        couponDiscountAmount: couponDiscountUSD,
        isFullDiscount: validatedCoupon.is_full_discount || finalPriceUSD === 0,
        isUpgrade: hasPayPalProration
      };
    }
    
    return {
      amount: priceAfterProrationUSD.toFixed(2),
      currency: 'USD',
      numericAmount: priceAfterProrationUSD,
      originalAmount: basePrice,
      hasProrationDiscount: hasPayPalProration,
      prorationDiscountAmount: prorationDiscountUSD,
      hasCouponDiscount: false,
      couponDiscountAmount: 0,
      isFullDiscount: false,
      isUpgrade: hasPayPalProration
    };
  }, [planData, billingPeriod, selectedMethod, exchangeRate, prorationData, validatedCoupon]);

  const finalPrice = calculatePrice.numericAmount;

  if (!planSlug) {
    return null;
  }

  const headerProps = {
    icon: ShoppingCart,
    title: "Suscripción",
    pageTitle: `Suscribirse al Plan ${planData?.name || ''}`,
    actions: [
      <Button
        key="back"
        variant="ghost"
        size="sm"
        onClick={() => navigate("/settings/pricing-plan")}
        className="gap-2"
        data-testid="button-back-to-pricing"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a precios
      </Button>
    ]
  };

  const planFeatures = planData?.features?.features || [];

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-7xl mx-auto py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Suscribirse al Plan {planData?.name || planSlug}
          </h1>
          <p className="text-muted-foreground mt-2">
            Completá tu suscripción de forma segura - Facturación {billingPeriod === 'annual' ? 'Anual' : 'Mensual'}
          </p>
        </div>

        <FlowBlockedBanner flowKey="billing_checkout" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 order-1 lg:order-1">
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold">Datos Básicos</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Nombre <span className="text-accent">*</span>
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
                        Apellido <span className="text-accent">*</span>
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
                      Email <span className="text-accent">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      disabled
                      readOnly
                      placeholder="tu@email.com"
                      className="bg-muted cursor-not-allowed"
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      País <span className="text-accent">*</span>
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

                  <div className="space-y-4 pt-4 border-t mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-accent" />
                        <Label htmlFor="needs-invoice" className="text-sm font-medium cursor-pointer">
                          Necesito factura (opcional)
                        </Label>
                      </div>
                      <Switch
                        id="needs-invoice"
                        checked={needsInvoice}
                        onCheckedChange={setNeedsInvoice}
                        data-testid="switch-needs-invoice"
                      />
                    </div>

                    {needsInvoice && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="is-company" className="text-sm font-medium">
                            Factura a empresa
                          </Label>
                          <Switch
                            id="is-company"
                            checked={isCompany}
                            onCheckedChange={setIsCompany}
                            data-testid="switch-is-company"
                          />
                        </div>

                        {isCompany ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Nombre de empresa <span className="text-accent">*</span>
                              </Label>
                              <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Empresa S.A."
                                data-testid="input-company-name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                CUIT / VAT / GST / Tax ID <span className="text-accent">*</span>
                              </Label>
                              <Input
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                placeholder="20-12345678-9 o GB123456789"
                                data-testid="input-tax-id"
                              />
                              <p className="text-xs text-muted-foreground">
                                Número de identificación fiscal
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Dirección (opcional)</Label>
                              <Input
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                placeholder="Calle y número"
                                data-testid="input-billing-address"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Ciudad (opcional)</Label>
                                <Input
                                  value={billingCity}
                                  onChange={(e) => setBillingCity(e.target.value)}
                                  placeholder="Ciudad"
                                  data-testid="input-billing-city"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Código Postal (opcional)</Label>
                                <Input
                                  value={billingPostcode}
                                  onChange={(e) => setBillingPostcode(e.target.value)}
                                  placeholder="1234"
                                  data-testid="input-billing-postcode"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                CUIT / VAT / GST / Tax ID <span className="text-accent">*</span>
                              </Label>
                              <Input
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                placeholder="20-12345678-9 o GB123456789"
                                data-testid="input-tax-id-individual"
                              />
                              <p className="text-xs text-muted-foreground">
                                Número de identificación fiscal
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Dirección (opcional)</Label>
                              <Input
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                placeholder="Calle y número"
                                data-testid="input-billing-address-individual"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Ciudad (opcional)</Label>
                                <Input
                                  value={billingCity}
                                  onChange={(e) => setBillingCity(e.target.value)}
                                  placeholder="Ciudad"
                                  data-testid="input-billing-city-individual"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Código Postal (opcional)</Label>
                                <Input
                                  value={billingPostcode}
                                  onChange={(e) => setBillingPostcode(e.target.value)}
                                  placeholder="1234"
                                  data-testid="input-billing-postcode-individual"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                    <RadioGroupItem 
                      value="mercadopago" 
                      id="mercadopago" 
                      className="mt-0.5" 
                    />
                    <div className="flex-1 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="mercadopago"
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <CreditCard className="h-5 w-5 text-accent" />
                          Mercado Pago
                          <Badge variant="outline" className="text-xs font-normal bg-muted/60 border-border/50">
                            Pago en ARS
                          </Badge>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tarjeta de crédito y saldo de Mercado Pago. Pago seguro con redirección.
                        </p>
                      </div>
                      <img
                        src={mercadoPagoLogo}
                        alt="Mercado Pago"
                        className="h-10 sm:h-12 object-contain flex-shrink-0"
                      />
                    </div>
                  </div>

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
                    <RadioGroupItem 
                      value="paypal" 
                      id="paypal" 
                      className="mt-0.5" 
                    />
                    <div className="flex-1 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="paypal"
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <CreditCard className="h-5 w-5 text-accent" />
                          PayPal
                          <Badge variant="outline" className="text-xs font-normal bg-muted/60 border-border/50">
                            Pago en USD
                          </Badge>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tarjetas internacionales y cuenta PayPal. Pago seguro con redirección.
                        </p>
                      </div>
                      <img
                        src={paypalLogo}
                        alt="PayPal"
                        className="h-10 sm:h-12 object-contain flex-shrink-0"
                      />
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-2 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold">Resumen de suscripción</h2>
                </div>

                {priceLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-base font-semibold">{planData?.name || planSlug}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Facturación {billingPeriod === 'annual' ? 'Anual' : 'Mensual'}
                        </p>
                      </div>
                    </div>

                    {billingPeriod === 'annual' && !userData?.organization?.settings?.is_founder && (
                      <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-start gap-2">
                        <Crown className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-xs text-accent/90">
                          <p className="font-semibold mb-1">Beneficios de Fundador incluidos</p>
                          <p>Acceso anticipado, bonus de capacitación y más</p>
                          <button
                            type="button"
                            onClick={() => window.open('/settings/founders', '_blank')}
                            className="mt-2 text-accent hover:underline font-medium inline-flex items-center gap-1"
                          >
                            Ver Detalles
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {prorationData?.credit && prorationData.credit.daysRemaining > 0 && selectedMethod === 'mercadopago' && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              Crédito por tu plan actual
                            </p>
                          </div>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            ARS ${prorationData.savings.ars?.toLocaleString("es-AR")}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          Te quedan {prorationData.credit.daysRemaining} días de {prorationData.currentPlan?.name}. 
                          Este crédito se descuenta del precio del nuevo plan.
                        </p>
                      </div>
                    )}

                    {prorationData?.credit && prorationData.credit.daysRemaining > 0 && selectedMethod === 'paypal' && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              Crédito por tu plan actual
                            </p>
                          </div>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            USD ${prorationData.savings.usd?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          Te quedan {prorationData.credit.daysRemaining} días de {prorationData.currentPlan?.name}. 
                          Este crédito se descuenta del precio del nuevo plan.
                        </p>
                      </div>
                    )}

                    {planFeatures.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-3">Características incluidas:</p>
                          <div className="space-y-2">
                            {planFeatures.slice(0, 5).map((feature: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{feature}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">¿Tenés un cupón?</span>
                      </div>
                      
                      {validatedCoupon ? (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                  Cupón aplicado: {validatedCoupon.code}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                  {validatedCoupon.type === 'percentage' 
                                    ? `${validatedCoupon.amount}% de descuento`
                                    : `$${validatedCoupon.discount_usd} USD de descuento`
                                  }
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveCoupon}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              data-testid="button-remove-coupon"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Ingresá tu código"
                              className="flex-1"
                              disabled={couponLoading}
                              data-testid="input-coupon-code"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleValidateCoupon();
                                }
                              }}
                            />
                            <Button
                              variant="secondary"
                              onClick={handleValidateCoupon}
                              disabled={!couponCode.trim() || couponLoading || !planData?.id}
                              data-testid="button-apply-coupon"
                            >
                              {couponLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Aplicar"
                              )}
                            </Button>
                          </div>
                          {couponError && (
                            <p className="text-sm text-destructive" data-testid="text-coupon-error">
                              {couponError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {(calculatePrice.hasProrationDiscount || calculatePrice.hasCouponDiscount) && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Precio {planData?.name}</span>
                            <span className="text-muted-foreground">
                              {calculatePrice.currency} ${calculatePrice.originalAmount.toLocaleString("es-AR")}
                            </span>
                          </div>
                          
                          {calculatePrice.hasProrationDiscount && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 dark:text-green-400">Crédito de prorrateo</span>
                              <span className="text-green-600 dark:text-green-400">
                                - {calculatePrice.currency} ${calculatePrice.prorationDiscountAmount.toLocaleString("es-AR")}
                              </span>
                            </div>
                          )}
                          
                          {calculatePrice.hasCouponDiscount && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 dark:text-green-400">
                                Cupón ({validatedCoupon?.code})
                              </span>
                              <span className="text-green-600 dark:text-green-400">
                                - {calculatePrice.currency} ${calculatePrice.couponDiscountAmount.toLocaleString("es-AR")}
                              </span>
                            </div>
                          )}
                          
                          <Separator className="my-2" />
                        </>
                      )}
                      
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-semibold">Total a pagar</span>
                        <div className="text-right">
                          {calculatePrice.isFullDiscount ? (
                            <>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ¡GRATIS!
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Cupón de 100% descuento aplicado
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl font-bold">
                                {calculatePrice.currency} ${parseFloat(calculatePrice.amount).toLocaleString("es-AR")}
                              </p>
                              {selectedMethod && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedMethod === "paypal" ? "Pago en USD" : "Pago en ARS"}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                        <p>Acceso inmediato después del pago</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                        <p>Renovación automática {billingPeriod === 'annual' ? 'anual' : 'mensual'}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
                        <p>Soporte incluido durante toda la suscripción</p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="accept-terms"
                          checked={acceptTerms}
                          onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                          data-testid="checkbox-accept-terms"
                        />
                        <label
                          htmlFor="accept-terms"
                          className="text-sm leading-tight cursor-pointer"
                        >
                          Acepto{" "}
                          <a
                            href="#"
                            className="text-accent hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            Términos y Condiciones
                          </a>{" "}
                          y{" "}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            Políticas de Privacidad
                          </a>
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="accept-communications"
                          checked={acceptCommunications}
                          onCheckedChange={(checked) => setAcceptCommunications(checked === true)}
                          data-testid="checkbox-accept-communications"
                        />
                        <label
                          htmlFor="accept-communications"
                          className="text-sm leading-tight cursor-pointer"
                        >
                          Acepto recibir comunicaciones sobre mi suscripción
                        </label>
                      </div>
                    </div>

                    {selectedMethod === "mercadopago" && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mt-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            <span className="font-semibold">Importante:</span> El email debe coincidir con tu cuenta de Mercado Pago para completar el pago.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="mercadopago-email" className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Email de Mercado Pago
                          </Label>
                          <Input
                            id="mercadopago-email"
                            type="email"
                            value={mercadopagoEmail}
                            onChange={(e) => setMercadopagoEmail(e.target.value)}
                            placeholder="tu-email@ejemplo.com"
                            className="bg-white dark:bg-background border-amber-300 dark:border-amber-700 focus:border-amber-500 focus:ring-amber-500"
                            data-testid="input-mercadopago-email"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleContinue}
                      disabled={
                        selectedMethod === null || 
                        loading || 
                        isPaymentInitiated ||
                        priceLoading || 
                        !acceptTerms || 
                        !acceptCommunications
                      }
                      className="w-full h-12 text-base font-medium mt-6"
                      data-testid="button-continue-payment"
                    >
                      {loading || isPaymentInitiated ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : !selectedMethod ? (
                        "Seleccioná un método de pago"
                      ) : (
                        <>
                          Suscribirme
                          <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

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
