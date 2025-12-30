import type { Request } from "express";
import { nanoid } from "nanoid";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { getUserData } from "../shared/user.js";
import { buildURLContext, buildSubscriptionBackUrls } from "../shared/urls.js";
import { validateMPToken, logMPMode } from "./config.js";
import { createMPPreapproval, type MPAutoRecurring } from "./subscriptions-api.js";
import { calculateProration } from "../shared/proration.js";
import { getAdminClient } from "../../../../routes/_base.js";
import { validateSubscriptionCoupon, createGiftedSubscription } from "../shared/subscription-coupons.js";

export type CreateRecurringSubscriptionResult =
  | { success: true; initPoint: string; preapprovalId: string }
  | { success: true; gifted: true; subscriptionId: string; message: string }
  | { success: false; error: string; status?: number };

export async function createRecurringSubscription(req: Request): Promise<CreateRecurringSubscriptionResult> {
  logMPMode("create-recurring-subscription");

  const { 
    plan_slug,
    organization_id,
    billing_period,
    currency = "ARS",
    is_upgrade,
    proration_amount_ars,
    proration_credit_ars,
    payer_email: clientPayerEmail,
    coupon_code,
  } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (!plan_slug || !organization_id || !billing_period) {
    return { 
      success: false, 
      error: "Falta plan_slug, organization_id o billing_period", 
      status: 400 
    };
  }

  if (billing_period !== 'monthly' && billing_period !== 'annual') {
    return {
      success: false,
      error: "billing_period debe ser 'monthly' o 'annual'",
      status: 400
    };
  }

  const authResult = getAuthenticatedClient(req);
  if (!authResult.success) {
    return { success: false, error: authResult.error, status: 401 };
  }

  const { supabase } = authResult;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('[MP create-recurring-subscription] Auth error:', userError);
    return { success: false, error: "Autenticación fallida", status: 401 };
  }

  // Look up actual user ID from auth_id in users table (same pattern as PayPal and MP courses)
  const { data: userRecord, error: userLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  
  if (userLookupError || !userRecord) {
    console.error("[MP create-recurring-subscription] User lookup failed:", userLookupError);
    return { success: false, error: "Usuario no encontrado", status: 404 };
  }

  const user_id = userRecord.id;
  const auth_id = user.id; // Keep auth_id for permission checks that need it

  try {
    // verifyAdminRoleForOrganization expects auth_id (it does internal lookup)
    const adminCheck = await verifyAdminRoleForOrganization(supabase, auth_id, organization_id);
    
    if (!adminCheck.success) {
      return { 
        success: false, 
        error: adminCheck.error, 
        status: 403 
      };
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, slug, is_active, monthly_amount, annual_amount, mp_plan_monthly_id, mp_plan_annual_id")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.error('[MP create-recurring-subscription] Plan not found:', planError);
      return { success: false, error: "Plan no encontrado o inactivo", status: 404 };
    }

    try {
      const { data: existingSubscription, error: subCheckError } = await supabase
        .from("organization_subscriptions")
        .select("id, status, expires_at, plan_id")
        .eq("organization_id", organization_id)
        .eq("plan_id", plan.id)
        .in("status", ["active", "trialing", "pending", "cancelled"])
        .order("started_at", { ascending: false })
        .maybeSingle();

      if (subCheckError) {
        console.error('[MP create-recurring-subscription] Error checking existing subscription:', subCheckError);
        return { success: false, error: "Error verificando suscripciones existentes", status: 500 };
      }

      if (existingSubscription && !is_upgrade) {
        const expiresAt = existingSubscription.expires_at ? new Date(existingSubscription.expires_at) : null;
        const isStillActive = !expiresAt || expiresAt > new Date();

        if (isStillActive) {
          return { 
            success: false, 
            error: "Ya tienes una suscripción activa a este plan", 
            status: 400 
          };
        }
      }
    } catch (error) {
      console.error('[MP create-recurring-subscription] Unexpected error checking subscriptions:', error);
      return { success: false, error: "Error inesperado verificando suscripciones", status: 500 };
    }

    // ============================================================
    // FETCH EXCHANGE RATE EARLY (needed for coupon validation in ARS)
    // ============================================================
    const { data: exchangeRate, error: exchangeError } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", "USD")
      .eq("to_currency", "ARS")
      .eq("is_active", true)
      .single();

    if (exchangeError || !exchangeRate) {
      console.error('[MP create-recurring-subscription] Exchange rate not found:', exchangeError);
      return { success: false, error: "Tasa de cambio no disponible", status: 500 };
    }

    const arsRate = Number(exchangeRate.rate);

    // ============================================================
    // COUPON VALIDATION & GIFTED SUBSCRIPTION HANDLING
    // ============================================================
    if (coupon_code) {
      console.log('[MP create-recurring-subscription] Validating coupon:', coupon_code);
      
      const priceAmountUSD = billing_period === 'monthly' ? plan.monthly_amount : plan.annual_amount;
      const priceARS = Number(priceAmountUSD) * arsRate;
      
      // Get internal user ID for per-user limit validation
      const userData = await getUserData(supabase, user_id);
      
      const couponResult = await validateSubscriptionCoupon({
        supabase,
        couponCode: coupon_code,
        planId: plan.id,
        price: priceARS,
        currency: 'ARS',
        userId: userData.id,
      });

      if (!couponResult.valid) {
        console.error('[MP create-recurring-subscription] Coupon validation failed:', couponResult.reason);
        return { 
          success: false, 
          error: couponResult.reason || "Cupón inválido", 
          status: 400 
        };
      }

      // If coupon gives 100% discount, create gifted subscription directly (no payment gateway)
      if (couponResult.isFree) {
        console.log('[MP create-recurring-subscription] 100% discount coupon - creating gifted subscription');
        
        const userData = await getUserData(supabase, user_id);
        const adminClient = getAdminClient();
        
        const giftedResult = await createGiftedSubscription({
          supabase: adminClient,
          authId: user_id,
          organizationId: organization_id,
          planId: plan.id,
          planSlug: plan_slug,
          billingPeriod: billing_period,
          couponId: couponResult.couponId!,
          couponCode: couponResult.couponCode!,
          userId: userData.id,
          currency: 'ARS',
          payerEmail: clientPayerEmail,
        });

        if (!giftedResult.success) {
          return { 
            success: false, 
            error: giftedResult.error || "Error creando suscripción regalada", 
            status: 500 
          };
        }

        return {
          success: true,
          gifted: true,
          subscriptionId: giftedResult.subscriptionId!,
          message: "Suscripción activada con cupón de 100% descuento",
        };
      }

      // Partial discount: continue with normal flow but apply discount
      // (MercadoPago doesn't support partial discounts on recurring subscriptions easily)
      // For now, log it and continue with full price (future enhancement)
      console.log('[MP create-recurring-subscription] Partial discount coupon - proceeding with discounted price:', {
        discount: couponResult.discount,
        finalPrice: couponResult.finalPrice,
      });
    }

    let currentSubscriptionId: string | null = null;
    if (is_upgrade) {
      const { data: currentSub } = await supabase
        .from("organization_subscriptions")
        .select("id")
        .eq("organization_id", organization_id)
        .in("status", ["active", "trialing"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (currentSub) {
        currentSubscriptionId = currentSub.id;
      }
    }

    const priceAmountUSD = billing_period === 'monthly' ? plan.monthly_amount : plan.annual_amount;
    let basePriceUSD = Number(priceAmountUSD);

    if (!Number.isFinite(basePriceUSD) || basePriceUSD <= 0) {
      console.error('[MP create-recurring-subscription] Invalid price:', {
        plan_slug,
        billing_period,
        monthly_amount: plan.monthly_amount,
        annual_amount: plan.annual_amount
      });
      return { success: false, error: "Precio inválido", status: 500 };
    }

    const seats = 1;
    let unitPriceUSD = basePriceUSD * seats;

    // arsRate is already fetched above for coupon validation
    let transactionAmount = unitPriceUSD * arsRate;
    const fullPriceArs = transactionAmount; // Store full price for recurring subscription

    let serverProrationCredit = 0;
    let firstPaymentAmount = transactionAmount;
    
    if (is_upgrade) {
      try {
        const adminClient = getAdminClient();
        const prorationResult = await calculateProration(adminClient, {
          organizationId: organization_id,
          targetPlanSlug: plan_slug,
          billingPeriod: billing_period as 'monthly' | 'annual',
        });

        if (prorationResult.hasActiveSubscription && prorationResult.savings.ars > 0) {
          const serverProrationPrice = prorationResult.finalPrice.ars;
          serverProrationCredit = prorationResult.savings.ars;
          
          console.log('[MP create-recurring-subscription] Server-calculated proration:', {
            full_price_ars: fullPriceArs,
            server_prorated_price: serverProrationPrice,
            server_credit: serverProrationCredit,
            client_prorated_price: proration_amount_ars,
            client_credit: proration_credit_ars,
          });

          // IMPORTANT: For MercadoPago recurring subscriptions, we must use FULL PRICE
          // because MP uses the same amount for all future payments.
          // The proration is tracked but NOT applied to the subscription amount.
          // This ensures users pay full price on renewal.
          console.log('[MP create-recurring-subscription] Using FULL PRICE for recurring subscription (proration only for reference)');
          firstPaymentAmount = serverProrationPrice; // Only used for logging/display
        } else {
          console.log('[MP create-recurring-subscription] No active subscription for proration, using full price');
        }
      } catch (prorationError) {
        console.error('[MP create-recurring-subscription] Proration calculation error:', prorationError);
      }
    }

    // CRITICAL: Always use full price for the subscription, not prorated amount
    // MercadoPago uses this amount for ALL recurring payments
    transactionAmount = fullPriceArs;
    transactionAmount = Math.round(transactionAmount * 100) / 100;

    if (transactionAmount < 1) {
      transactionAmount = 1;
    }

    const userData = await getUserData(supabase, user_id);

    // Use client-provided payer_email if available, otherwise fall back to user profile email
    const payerEmail = clientPayerEmail?.trim() || userData.email;
    
    if (!payerEmail) {
      console.error('[MP create-recurring-subscription] User email not found');
      return { success: false, error: "Email del usuario no encontrado", status: 400 };
    }
    
    console.log('[MP create-recurring-subscription] Using payer email:', payerEmail);

    const tokenValidation = validateMPToken();
    if (!tokenValidation.valid) {
      return { success: false, error: tokenValidation.error, status: 500 };
    }

    // Generate short ID for external_reference (max 64 chars, alphanumeric)
    // Using mpr_ prefix for recurring subscriptions (different from mps_ for seats)
    const shortId = `mpr_${nanoid(12)}`;

    const urlContext = buildURLContext(req);

    // Save subscription preference data to database for webhook lookup
    // Using admin client to bypass RLS
    const adminClient = getAdminClient();
    const { error: insertError } = await adminClient
      .from("mp_subscription_preferences")
      .insert({
        id: shortId,
        user_id: user_id,
        organization_id,
        plan_id: plan.id,
        plan_slug,
        billing_period,
        amount_ars: String(Math.round(transactionAmount)),
        is_upgrade: is_upgrade || false,
        previous_subscription_id: currentSubscriptionId || null,
        proration_credit: serverProrationCredit > 0 ? String(serverProrationCredit) : null,
        payer_email: payerEmail, // Save for seat billing
      });

    if (insertError) {
      console.error("[MP create-recurring-subscription] Error saving preference to DB:", insertError);
      // Continue anyway - webhook can fallback to getMPPreapproval
    } else {
      console.log("[MP create-recurring-subscription] Preference saved with short ID:", shortId);
    }
    const backUrls = buildSubscriptionBackUrls(urlContext.returnBase);

    const productTitle = is_upgrade 
      ? `Upgrade a ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`
      : `Suscripción ${plan.name} - ${billing_period === 'monthly' ? 'Mensual' : 'Anual'}`;

    // IMPORTANT: Always use auto_recurring, NOT preapproval_plan_id
    // Using preapproval_plan_id requires card_token_id (pre-tokenized card)
    // Using auto_recurring redirects user to MP checkout to enter card
    const frequency = billing_period === 'monthly' ? 1 : 12;
    const frequencyType: "months" = "months";

    // Round to integer for ARS (MP Argentina requirement)
    const roundedAmount = Math.round(transactionAmount);

    const autoRecurring: MPAutoRecurring = {
      frequency,
      frequency_type: frequencyType,
      transaction_amount: roundedAmount,
      currency_id: "ARS",
    };

    console.log('[MP create-recurring-subscription] Creating preapproval with auto_recurring:', {
      plan: plan.name,
      billing_period,
      amount_ars: roundedAmount,
      frequency,
      is_upgrade,
    });

    const preapprovalResult = await createMPPreapproval({
      reason: productTitle,
      external_reference: shortId,
      payer_email: payerEmail,
      auto_recurring: autoRecurring,
      back_url: backUrls.success,
      status: "pending",
    });

    if (!preapprovalResult.success) {
      console.error("[MP create-recurring-subscription] Error de Mercado Pago:", preapprovalResult);
      return { 
        success: false, 
        error: preapprovalResult.error || "Error al crear suscripción recurrente", 
        status: preapprovalResult.status || 500 
      };
    }

    // Update the preference with the preapproval_id for webhook lookup
    const { error: updateError } = await supabase
      .from("mp_subscription_preferences")
      .update({ preapproval_id: preapprovalResult.preapprovalId })
      .eq("id", shortId);
    
    if (updateError) {
      console.warn('[MP create-recurring-subscription] Failed to update preference with preapproval_id:', updateError);
    }

    console.log('[MP create-recurring-subscription] Preapproval created successfully:', {
      preapprovalId: preapprovalResult.preapprovalId,
      initPoint: preapprovalResult.initPoint,
      plan_slug,
      billing_period,
      transactionAmount,
      is_upgrade,
      shortId,
    });

    return { 
      success: true, 
      initPoint: preapprovalResult.initPoint, 
      preapprovalId: preapprovalResult.preapprovalId 
    };
  } catch (e: any) {
    console.error("[MP create-recurring-subscription] Error fatal:", e);
    return { success: false, error: e.message || String(e), status: 500 };
  }
}
