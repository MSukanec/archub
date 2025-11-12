import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Layout } from "@/components/layout/desktop/Layout";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCountries } from "@/hooks/use-countries";
import { PhoneField } from "@/components/ui-custom/fields/PhoneField";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/utils/apiBase";
import { toE164, fromE164 } from "@/utils/phone";
import mercadoPagoLogo from "/MercadoPago_logo.png";
import paypalLogo from "/Paypal_2014_logo.png";

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
  const { setSidebarContext, setSidebarLevel, sidebarLevel, currentSidebarContext } = useNavigationStore();

  const params = new URLSearchParams(window.location.search);
  const planSlug = params.get("plan") || "";
  const billingPeriod = params.get("billing") || "annual";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previousContext = currentSidebarContext;
    const previousLevel = sidebarLevel;
    
    setSidebarContext('general');
    setSidebarLevel('general');

    return () => {
      setSidebarContext(previousContext);
      setSidebarLevel(previousLevel);
    };
  }, [setSidebarContext, setSidebarLevel]);

  const currentProvider = selectedMethod === "paypal" ? "paypal" : "mercadopago";
  const currentCurrency = selectedMethod === "paypal" ? "USD" : "ARS";

  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [priceLoading, setPriceLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const { data: userData } = useCurrentUser();
  const { data: countries = [] } = useCountries();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
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
      navigate("/pricing");
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

  const handleMercadoPagoPayment = async () => {
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
      if (!authUser) throw new Error("No se pudo obtener el usuario autenticado");

      const { data: userRecord, error: eUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUser.id)
        .single();

      if (eUser || !userRecord?.id) {
        throw new Error("No se pudo obtener el ID interno del usuario");
      }

      await saveBillingProfile(userRecord.id);

      if (!organizationId) {
        throw new Error("No se encontró la organización del usuario");
      }

      const requestBody = {
        product_type: 'subscription',
        plan_slug: planSlug,
        organization_id: organizationId,
        billing_period: billingPeriod,
        currency: "ARS",
      };

      console.log("[MP] Creando preferencia de suscripción…", requestBody);

      const API_BASE = getApiBase();
      const mpUrl = `${API_BASE}/api/mp/create-preference`;

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
        throw new Error("Debes iniciar sesión para suscribirte");
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

      const currentAmount = baseAmount;

      const description = `Suscripción ${planData?.name || planSlug} - ${billingPeriod === 'annual' ? 'Anual' : 'Mensual'}`;

      const billing = getBillingData();
      const requestBody = {
        product_type: 'subscription',
        plan_slug: planSlug,
        organization_id: organizationId,
        billing_period: billingPeriod,
        amount_usd: currentAmount,
        description,
        ...(billing && { billing }),
      };

      console.log("[PayPal] Creando orden de suscripción…", requestBody);

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

  const handleContinue = async () => {
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
    if (!planData) return { amount: '0.00', currency: 'USD', numericAmount: 0 };
    
    const basePrice = billingPeriod === 'annual' 
      ? parseFloat(planData.annual_amount) 
      : parseFloat(planData.monthly_amount);
    
    if (selectedMethod === 'mercadopago') {
      const arsAmount = basePrice * exchangeRate;
      return {
        amount: arsAmount.toFixed(2),
        currency: 'ARS',
        numericAmount: arsAmount
      };
    }
    
    return {
      amount: basePrice.toFixed(2),
      currency: 'USD',
      numericAmount: basePrice
    };
  }, [planData, billingPeriod, selectedMethod, exchangeRate]);

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
        onClick={() => navigate("/pricing")}
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

                    {billingPeriod === 'annual' && (
                      <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-start gap-2">
                        <Crown className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-accent/90">
                          <p className="font-semibold mb-1">Beneficios de Fundador incluidos</p>
                          <p>Badge exclusivo, acceso anticipado y descuentos permanentes</p>
                        </div>
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

                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-semibold">Total</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {calculatePrice.currency} ${parseFloat(calculatePrice.amount).toLocaleString("es-AR")}
                        </p>
                        {selectedMethod && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedMethod === "paypal" ? "Pago en USD" : "Pago en ARS"}
                          </p>
                        )}
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

                    <Button
                      onClick={handleContinue}
                      disabled={
                        selectedMethod === null || 
                        loading || 
                        priceLoading || 
                        !acceptTerms || 
                        !acceptCommunications
                      }
                      className="w-full h-12 text-base font-medium mt-6"
                      data-testid="button-continue-payment"
                    >
                      {loading ? (
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
