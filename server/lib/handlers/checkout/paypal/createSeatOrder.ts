import type { Request } from "express";
import { nanoid } from "nanoid";
import { getAuthenticatedClient } from "../shared/auth.js";
import { verifyAdminRoleForOrganization } from "../shared/permissions.js";
import { buildURLContext } from "../shared/urls.js";
import { getAdminClient } from "../../../../routes/_base.js";
import { createPayPalOrder } from "./api.js";

export interface CreateSeatOrderParams {
  userId: string;
  authId: string;
  organizationId: string;
  inviteeEmail: string;
  roleId: string;
  proratedAmountUSD: number;
  subscriptionId: string;
  billingPeriod: 'monthly' | 'annual';
}

export type CreateSeatOrderResult =
  | { success: true; orderId: string; approvalUrl: string; preferenceId: string }
  | { success: false; error: string; status?: number };

export async function createSeatOrder(req: Request): Promise<CreateSeatOrderResult> {
  const { 
    organization_id,
    invitee_email,
    role_id,
    prorated_amount_usd,
    subscription_id,
    billing_period,
  } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (!organization_id || !invitee_email || !role_id) {
    return { 
      success: false, 
      error: "Faltan parámetros: organization_id, invitee_email, role_id", 
      status: 400 
    };
  }

  if (billing_period && billing_period !== 'monthly' && billing_period !== 'annual') {
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
    console.error('[PayPal create-seat-order] Auth error:', userError);
    return { success: false, error: "Autenticación fallida", status: 401 };
  }

  const authId = user.id;

  try {
    const adminCheck = await verifyAdminRoleForOrganization(supabase, authId, organization_id);
    
    if (!adminCheck.success) {
      return { 
        success: false, 
        error: adminCheck.error, 
        status: 403 
      };
    }

    const adminClient = getAdminClient();

    const { data: dbUser, error: dbUserError } = await adminClient
      .from("users")
      .select("id, email, full_name")
      .eq("auth_id", authId)
      .single();

    if (dbUserError || !dbUser) {
      console.error('[PayPal create-seat-order] User not found:', dbUserError);
      return { success: false, error: "Usuario no encontrado", status: 404 };
    }

    const userId = dbUser.id;

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      console.error('[PayPal create-seat-order] Organization not found:', orgError);
      return { success: false, error: "Organización no encontrada", status: 404 };
    }

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", role_id)
      .single();

    if (roleError || !role) {
      console.error('[PayPal create-seat-order] Role not found:', roleError);
      return { success: false, error: "Rol no encontrado", status: 404 };
    }

    const { data: subscription, error: subError } = await supabase
      .from("organization_subscriptions")
      .select("id, billing_period, expires_at")
      .eq("organization_id", organization_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('[PayPal create-seat-order] Subscription error:', subError);
    }

    const effectiveSubscriptionId = subscription_id || subscription?.id;
    const effectiveBillingPeriod = billing_period || subscription?.billing_period || 'monthly';

    let proratedAmount = parseFloat(prorated_amount_usd) || 0;
    if (proratedAmount < 1) {
      proratedAmount = 1;
      console.log('[PayPal create-seat-order] Adjusted amount to minimum $1 USD');
    }

    const shortId = `pps_${nanoid(12)}`;

    const { error: insertError } = await adminClient
      .from("paypal_seat_preferences")
      .insert({
        id: shortId,
        user_id: userId,
        organization_id,
        invitee_email: invitee_email.toLowerCase(),
        role_id,
        subscription_id: effectiveSubscriptionId || null,
        prorated_amount_usd: String(proratedAmount),
        billing_period: effectiveBillingPeriod,
        status: 'pending',
      });

    if (insertError) {
      console.error("[PayPal create-seat-order] Error saving preference to DB:", insertError);
    } else {
      console.log("[PayPal create-seat-order] Preference saved with short ID:", shortId);
    }

    const { returnBase } = buildURLContext(req);
    const uniqueInvoiceId = `seat_${organization_id}_${Date.now()}`;
    const custom_id = `${userId}|${organization_id}|${role_id}|${shortId}`;

    const return_url = `${returnBase}/api/checkout/paypal/seat-capture?preference_id=${shortId}`;
    const cancel_url = `${returnBase}/organization/members?payment=cancelled`;

    const productTitle = `Nuevo miembro - ${org.name}`;
    const productDescription = `Agregar ${invitee_email} como ${role.name}`;

    const orderBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: proratedAmount.toFixed(2),
          },
          description: productDescription,
          invoice_id: uniqueInvoiceId,
          custom_id: custom_id,
        },
      ],
      application_context: {
        brand_name: "Seencel",
        user_action: "PAY_NOW",
        return_url,
        cancel_url,
      },
    };

    console.log('[PayPal create-seat-order] Creating order:', {
      organization: org.name,
      invitee_email,
      role: role.name,
      amount: proratedAmount,
      billing_period: effectiveBillingPeriod,
      shortId,
    });

    const result = await createPayPalOrder(orderBody);

    if (!result.success) {
      console.error("[PayPal create-seat-order] Error creating order:", result);
      return { success: false, error: result.error, status: result.status };
    }

    const { error: updateError } = await adminClient
      .from("paypal_seat_preferences")
      .update({ order_id: result.orderId })
      .eq("id", shortId);
    
    if (updateError) {
      console.warn('[PayPal create-seat-order] Failed to update preference with order_id:', updateError);
    }

    console.log('[PayPal create-seat-order] Order created successfully:', {
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      invitee_email,
      amount: proratedAmount,
      shortId,
    });

    return { 
      success: true, 
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
      preferenceId: shortId,
    };
  } catch (error: any) {
    console.error("[PayPal create-seat-order] Unexpected error:", error);
    return { 
      success: false, 
      error: error.message || "Error inesperado", 
      status: 500 
    };
  }
}
