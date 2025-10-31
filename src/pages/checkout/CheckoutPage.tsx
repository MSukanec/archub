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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  Upload,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoursePrice } from "@/hooks/useCoursePrice";
import { getApiBase } from "@/utils/apiBase";
import { toE164, fromE164 } from "@/utils/phone";
import { orderedMethods, getPaymentButtonText } from "@/utils/paymentOrder";
import { apiRequest } from "@/lib/queryClient";
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

  // Bank transfer payment states
  const [bankTransferPaymentId, setBankTransferPaymentId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

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

  // Acceptance checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCommunications, setAcceptCommunications] = useState(false);
  
  // Save to profile checkbox
  const [saveToProfile, setSaveToProfile] = useState(false);

  // Billing data (optional)
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [billingFullName, setBillingFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");

  // Course title
  const [courseTitle, setCourseTitle] = useState("Curso");

  // Load course title
  useEffect(() => {
    if (courseSlug) {
      supabase
        .from("courses")
        .select("title")
        .eq("slug", courseSlug)
        .single()
        .then(({ data }) => {
          if (data?.title) {
            setCourseTitle(data.title);
          }
        });
    }
  }, [courseSlug]);

  // Load user data
  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || "");
      setLastName(userData.user_data?.last_name || "");
      setEmail(userData.user?.email || "");
      setCountry(userData.user_data?.country || "");
      
      // Load phone number without country code for PhoneField display
      if (userData.user_data?.phone_e164) {
        setPhone(fromE164(userData.user_data.phone_e164));
      }
    }
  }, [userData]);

  // Prefill billing data from main form
  useEffect(() => {
    if (firstName && lastName && !billingFullName) {
      setBillingFullName(`${firstName} ${lastName}`.trim());
    }
  }, [firstName, lastName, billingFullName]);

  useEffect(() => {
    if (country && !billingCountry) {
      setBillingCountry(country);
    }
  }, [country, billingCountry]);

  // Load billing profile when user enables invoice
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
          console.log('[billing_profiles] Loaded existing profile');
          // Only set fields that are empty (don't overwrite if user already started filling)
          if (!isCompany && data.is_company) setIsCompany(data.is_company);
          if (!billingFullName && data.full_name) setBillingFullName(data.full_name);
          if (!companyName && data.company_name) setCompanyName(data.company_name);
          if (!taxId && data.tax_id) setTaxId(data.tax_id);
          if (!billingCountry && data.country_id) setBillingCountry(data.country_id);
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

  // Redirect si no hay courseSlug
  useEffect(() => {
    if (!courseSlug) {
      navigate("/learning/courses");
    }
  }, [courseSlug, navigate]);

  // Preselección inteligente de método de pago cuando cambia el país
  useEffect(() => {
    if (!selectedMethod && country && countries.length > 0) {
      const countryData = countries.find((c) => c.id === country);
      const isLATAM = ["ARG", "BRA", "CHL", "COL", "MEX", "PER", "URY", "PRY"].includes(
        countryData?.alpha_3 || ""
      );
      // Si es LATAM → MercadoPago, si no → PayPal
      setSelectedMethod(isLATAM ? "mercadopago" : "paypal");
    }
  }, [country, countries, selectedMethod]);

  // Limpiar cupón cuando cambia la moneda/método de pago
  // IMPORTANTE: El descuento debe recalcularse con el nuevo precio en la nueva moneda
  useEffect(() => {
    if (appliedCoupon) {
      // Remover el cupón cuando cambia el método de pago
      setAppliedCoupon(null);
      setCouponError(null);
      
      // Mostrar un mensaje informativo al usuario
      toast({
        title: "Cupón removido",
        description: "Cambiaste de método de pago. Aplicá el cupón nuevamente para recalcular el descuento.",
        variant: "default",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, currentCurrency]);

  // Atajo de teclado: Enter dispara el CTA si todo está válido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !showBankInfo) {
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
    showBankInfo,
  ]);

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

      // Save billing profile if user filled billing data
      await saveBillingProfile(userRecord.id);

      const requestBody = {
        user_id: userRecord.id,
        course_slug: courseSlug,
        currency: "ARS",
        months: priceData?.months || 12,
        ...(appliedCoupon && { code: appliedCoupon.code }),
      };

      console.log("[MP] Creando preferencia…", requestBody);

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
        // Si el cupón da 100% descuento, usar flujo de inscripción gratuita
        if (payload?.free_enrollment && appliedCoupon) {
          console.log("[MP] Cupón da acceso gratuito, usando free-enroll...");
          
          const freeEnrollResponse = await fetch(`${API_BASE}/api/checkout/free-enroll`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              courseSlug,
              code: appliedCoupon.code,
            }),
          });

          const freeEnrollData = await freeEnrollResponse.json();
          if (!freeEnrollResponse.ok) {
            console.error("Error al inscribir con cupón 100%:", freeEnrollData);
            throw new Error(freeEnrollData?.error || "No se pudo completar la inscripción");
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

      // Save billing profile if user filled billing data
      await saveBillingProfile(userRecord.id);

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

      const billing = getBillingData();
      const requestBody = {
        user_id: userRecord.id,
        course_slug: courseSlug,
        amount_usd: finalAmount,
        description,
        ...(billing && { billing }),
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

  const handleTransferPayment = async () => {
    setShowBankInfo(true);
    // Create the bank transfer payment record
    await handleCreateBankTransferPayment();
    // Scroll to top para que en mobile el usuario vea la información bancaria
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyBankInfo = async () => {
    const bankInfo = `Banco Galicia - Caja de Ahorro en Pesos

Número de cuenta: 4026691-4 063-1
CBU: 00700634 30004026691416
Alias: MATIAS.SUKANEC
Titular: DNI 32322767`;

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

  const handleCreateBankTransferPayment = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión para continuar",
          variant: "destructive",
        });
        return;
      }

      const finalPrice = appliedCoupon
        ? appliedCoupon.final_price
        : priceData?.amount || 0;

      const orderId = crypto.randomUUID();

      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/bank-transfer/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          course_slug: courseSlug,
          amount: finalPrice,
          currency: currentCurrency,
          payer_name: `${firstName} ${lastName}`.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.btp_id) {
        throw new Error(data.error || "No se pudo crear el registro de pago");
      }

      setBankTransferPaymentId(data.btp_id);
    } catch (error: any) {
      console.error("Error creating bank transfer payment:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el registro de pago",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Archivo no válido",
        description: `Solo se permiten archivos ${allowedExtensions.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB",
        variant: "destructive",
      });
      return;
    }

    setReceiptFile(file);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !bankTransferPaymentId) {
      toast({
        title: "Error",
        description: "No hay archivo o ID de pago",
        variant: "destructive",
      });
      return;
    }

    try {
      setReceiptUploading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Sesión expirada");
      }

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(receiptFile);
      const base64Data = await base64Promise;

      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/bank-transfer/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          btp_id: bankTransferPaymentId,
          file_name: receiptFile.name,
          file_data: base64Data,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.receipt_url) {
        throw new Error(data.error || "No se pudo subir el comprobante");
      }

      setReceiptUrl(data.receipt_url);
      setReceiptUploaded(true);

      toast({
        title: "¡Comprobante enviado!",
        description: "Tu comprobante fue recibido. Te notificaremos cuando sea aprobado.",
      });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Error al subir comprobante",
        description: error.message || "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setReceiptUploading(false);
    }
  };

  // Helper to build billing object only if user needs invoice
  const getBillingData = () => {
    if (!needsInvoice) {
      return undefined;
    }

    return {
      is_company: isCompany,
      full_name: billingFullName.trim() || undefined,
      company_name: companyName.trim() || undefined,
      tax_id: taxId.trim() || undefined,
      country_id: billingCountry || undefined,
      address_line1: billingAddress.trim() || undefined,
      city: billingCity.trim() || undefined,
      postcode: billingPostcode.trim() || undefined,
    };
  };

  // Helper to save billing profile before payment
  const saveBillingProfile = async (internalUserId: string) => {
    const billing = getBillingData();
    if (!billing) {
      return; // No billing data, skip
    }

    try {
      const { error } = await supabase
        .from('billing_profiles')
        .upsert({
          user_id: internalUserId,
          is_company: billing.is_company,
          full_name: billing.full_name || null,
          company_name: billing.company_name || null,
          tax_id: billing.tax_id || null,
          country_id: billing.country_id || null,
          address_line1: billing.address_line1 || null,
          city: billing.city || null,
          postcode: billing.postcode || null,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[billing_profiles] Error saving billing profile:', error);
      } else {
        console.log('[billing_profiles] Billing profile saved successfully');
      }
    } catch (e) {
      console.error('[billing_profiles] Unexpected error:', e);
    }
  };

  const handleContinue = async () => {
    // Validate first_name: 1-100 caracteres, Unicode (acentos, guiones)
    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresá tu nombre",
        variant: "destructive",
      });
      return;
    }
    if (trimmedFirstName.length > 100) {
      toast({
        title: "Nombre muy largo",
        description: "El nombre debe tener máximo 100 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Validate last_name: 0-100 caracteres (opcional)
    const trimmedLastName = lastName.trim();
    if (trimmedLastName.length > 100) {
      toast({
        title: "Apellido muy largo",
        description: "El apellido debe tener máximo 100 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Validate email: formato válido y normalizar a minúsculas
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresá tu email",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresá un email válido",
        variant: "destructive",
      });
      return;
    }
    const normalizedEmail = trimmedEmail.toLowerCase();

    // Validate country
    if (!country) {
      toast({
        title: "País requerido",
        description: "Por favor seleccioná tu país",
        variant: "destructive",
      });
      return;
    }

    // Normalize phone to E.164 if provided
    const selectedCountry = countries.find((c) => c.id === country);
    const normalizedPhone = toE164(
      phone, 
      selectedCountry?.alpha_3
    );

    if (!acceptTerms) {
      toast({
        title: "Aceptación requerida",
        description: "Debes aceptar los Términos y Condiciones y Políticas de Privacidad",
        variant: "destructive",
      });
      return;
    }

    if (!acceptCommunications) {
      toast({
        title: "Aceptación requerida",
        description: "Debes aceptar recibir comunicaciones sobre este curso",
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

    // Validate billing data only if user needs invoice
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
      if (!billingCountry) {
        toast({
          title: "País de facturación requerido",
          description: "Por favor seleccioná el país para la factura",
          variant: "destructive",
        });
        return;
      }
    }

    // Save to profile if checkbox is checked
    if (saveToProfile && userData?.user?.id) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const API_BASE = getApiBase();
          
          // Only save phone_e164 if we have a valid E.164 number
          // This prevents saving invalid numbers like "+BGR1234567" for unmapped countries
          const profileData: any = {
            user_id: userData.user.id,
            first_name: trimmedFirstName,
            last_name: trimmedLastName || null,
            country: country,
          };
          
          // Only include phone_e164 if we successfully normalized it
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
        // Continue with payment even if profile save fails
      }
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

  // Ordenar métodos de pago según el país seleccionado
  const selectedCountryData = useMemo(() => {
    return countries.find((c) => c.id === country);
  }, [countries, country]);

  const paymentMethodsOrder = useMemo(() => {
    return orderedMethods(selectedCountryData?.alpha_3);
  }, [selectedCountryData]);

  // Texto del botón según método seleccionado
  const buttonText = getPaymentButtonText(selectedMethod);

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
    <Layout headerProps={headerProps}>
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
          <div className={cn(
            "order-1 lg:order-1",
            showBankInfo ? "lg:col-span-12" : "lg:col-span-7"
          )}>
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

                      {/* Save to Profile Checkbox */}
                      {userData?.user?.id && (
                        <div className="flex items-start gap-3 pt-2">
                          <Checkbox
                            id="save-to-profile"
                            checked={saveToProfile}
                            onCheckedChange={(checked) => setSaveToProfile(checked === true)}
                            data-testid="checkbox-save-to-profile"
                          />
                          <label
                            htmlFor="save-to-profile"
                            className="text-sm leading-tight cursor-pointer text-muted-foreground"
                          >
                            Guardar estos datos en mi perfil
                          </label>
                        </div>
                      )}
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
                      {paymentMethodsOrder.map((method) => {
                        if (method === "mercadopago") {
                          return (
                            <div
                              key="mercadopago"
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
                                    Mercado Pago
                                    <Badge variant="outline" className="text-xs font-normal bg-muted/60 border-border/50">
                                      Pago en ARS
                                    </Badge>
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
                          );
                        }

                        if (method === "paypal") {
                          return (
                            <div
                              key="paypal"
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
                                    PayPal
                                    <Badge variant="outline" className="text-xs font-normal bg-muted/60 border-border/50">
                                      Pago en USD
                                    </Badge>
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
                          );
                        }

                        // transfer
                        return (
                          <div
                            key="transfer"
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
                                Transferencia Bancaria
                                <Badge variant="outline" className="text-xs font-normal bg-muted/60 border-border/50">
                                  Pago en ARS
                                </Badge>
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Transferencia o depósito directo. Aprobación manual.
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  {/* Billing Section (Optional) */}
                  <div className="bg-card border rounded-lg p-6">
                    {/* Switch to toggle invoice */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-accent" />
                        <h2 className="text-lg font-semibold">Necesito factura (opcional)</h2>
                      </div>
                      <Switch
                        id="needs-invoice"
                        checked={needsInvoice}
                        onCheckedChange={setNeedsInvoice}
                        data-testid="switch-needs-invoice"
                      />
                    </div>

                    {/* Show billing fields only when switch is ON */}
                    {needsInvoice && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-4">
                            {/* Company Toggle */}
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
                              /* Company Fields */
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
                                  <Label className="text-sm font-medium">
                                    País <span className="text-accent">*</span>
                                  </Label>
                                  <Select value={billingCountry} onValueChange={setBillingCountry}>
                                    <SelectTrigger data-testid="select-billing-country">
                                      <SelectValue placeholder="Seleccioná el país" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {countries.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
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
                              /* Individual Fields */
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Nombre completo</Label>
                                  <Input
                                    value={billingFullName}
                                    onChange={(e) => setBillingFullName(e.target.value)}
                                    placeholder="Juan Pérez"
                                    data-testid="input-billing-fullname"
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
                                    data-testid="input-tax-id-individual"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Número de identificación fiscal
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">País</Label>
                                  <Select value={billingCountry} onValueChange={setBillingCountry}>
                                    <SelectTrigger data-testid="select-billing-country-individual">
                                      <SelectValue placeholder="Seleccioná el país" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {countries.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
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
                      </div>
                    )}
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

                  {!receiptUploaded && (
                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg font-mono text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Banco</p>
                        <p className="font-medium">Banco Galicia - Caja de Ahorro en Pesos</p>
                      </div>
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
                        <p className="text-xs text-muted-foreground mb-1">Monto a pagar</p>
                        <p className="font-bold text-lg">
                          {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: currentCurrency,
                            minimumFractionDigits: 0,
                          }).format(appliedCoupon ? appliedCoupon.final_price : (priceData?.amount || 0))}
                        </p>
                      </div>
                    </div>
                  )}

                  {!receiptUploaded && (
                    <>
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
                      </div>

                      <Separator className="my-6" />
                    </>
                  )}

                  {/* Receipt Upload Section */}
                  <div className="space-y-4">
                    {!receiptUploaded && (
                      <div className="flex items-start gap-3">
                        <Receipt className="h-5 w-5 text-accent mt-1" />
                        <div>
                          <h3 className="text-base font-semibold">Subir comprobante</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Adjuntá tu comprobante de transferencia para confirmar el pago
                          </p>
                        </div>
                      </div>
                    )}

                    {!receiptFile && !receiptUploaded ? (
                      /* No file selected */
                      <div className="space-y-3">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileSelect}
                          className="cursor-pointer"
                          data-testid="input-receipt-file"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formatos aceptados: PDF, JPG, JPEG, PNG (máx. 10MB)
                        </p>
                      </div>
                    ) : receiptFile && !receiptUploaded ? (
                      /* File selected but not uploaded */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                          <FileCheck className="h-5 w-5 text-accent" />
                          <span className="text-sm font-medium flex-1">{receiptFile.name}</span>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleUploadReceipt}
                            disabled={receiptUploading}
                            className="flex-1"
                            data-testid="button-upload-receipt"
                          >
                            {receiptUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Confirmar y enviar comprobante
                              </>
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setReceiptFile(null);
                              const input = document.querySelector<HTMLInputElement>('[data-testid="input-receipt-file"]');
                              if (input) input.value = '';
                            }}
                            disabled={receiptUploading}
                            data-testid="button-change-file"
                          >
                            Cambiar archivo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* File uploaded */
                      <div className="space-y-3">
                        <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                            <span className="font-semibold text-accent">
                              PENDIENTE DE REVISIÓN
                            </span>
                          </div>
                          <p className="text-sm text-accent/80">
                            Tu comprobante ha sido enviado. Te notificaremos cuando sea aprobado.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {receiptUploaded ? (
                      <Button
                        variant="default"
                        onClick={() => navigate('/learning/courses')}
                        className="w-full"
                        data-testid="button-back-to-courses"
                      >
                        Volver a cursos
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowBankInfo(false);
                          setBankTransferPaymentId(null);
                          setReceiptFile(null);
                          setReceiptUploading(false);
                          setReceiptUploaded(false);
                          setReceiptUrl(null);
                        }}
                        className="w-full"
                        data-testid="button-back-from-bank-transfer"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Coupon & Order Summary (Mobile: shows second) */}
          {!showBankInfo && (
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
                      <p className="text-base font-semibold">{courseTitle}</p>
                      <p className="text-sm text-muted-foreground mt-1">Suscripción anual</p>
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

                    <Separator className="my-6" />

                    {/* Acceptance Checkboxes */}
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
                            href="#"
                            className="text-accent hover:underline"
                            onClick={(e) => e.preventDefault()}
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
                          Acepto recibir comunicaciones sobre este curso
                        </label>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedMethod || loading || priceLoading || !acceptTerms || !acceptCommunications}
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
                          {buttonText}
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
          )}
        </div>
      </div>
    </Layout>
  );
}
