import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { getMPPreapproval } from "./subscriptions-api.js";
import { insertPayment } from "../shared/payments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { getPlanIdBySlug } from "../shared/helpers.js";

export type HandleSubscriptionReturnResult =
  | { success: true; activated: boolean; message: string }
  | { success: false; error: string };

export async function handleSubscriptionReturn(req: Request): Promise<HandleSubscriptionReturnResult> {
  const supabase = createServiceSupabaseClient();
  
  const preapprovalId = req.query.preapproval_id as string;
  
  if (!preapprovalId) {
    console.log("[MP subscription-return] No preapproval_id, checking by collection_id...");
    return { success: true, activated: false, message: "No preapproval_id provided, waiting for webhook" };
  }
  
  console.log("[MP subscription-return] Processing preapproval:", preapprovalId);
  
  const preapprovalResult = await getMPPreapproval(preapprovalId);
  
  if (!preapprovalResult.success) {
    console.error("[MP subscription-return] Failed to get preapproval:", preapprovalResult.error);
    return { success: false, error: preapprovalResult.error || "Failed to get preapproval" };
  }
  
  const preapproval = preapprovalResult.preapproval;
  const preapprovalStatus = preapproval.status;
  const externalRef = preapproval.external_reference || "";
  
  console.log("[MP subscription-return] Preapproval status:", preapprovalStatus, "external_reference:", externalRef);
  
  if (preapprovalStatus !== "authorized") {
    console.log("[MP subscription-return] Preapproval not yet authorized, status:", preapprovalStatus);
    return { success: true, activated: false, message: `Preapproval status: ${preapprovalStatus}` };
  }
  
  if (!externalRef.startsWith("mps_")) {
    console.warn("[MP subscription-return] Unexpected external_reference format:", externalRef);
    return { success: false, error: "Invalid external_reference format" };
  }
  
  const { data: prefData, error: prefError } = await supabase
    .from("mp_subscription_preferences")
    .select("*")
    .eq("id", externalRef)
    .maybeSingle();
  
  if (prefError || !prefData) {
    console.error("[MP subscription-return] Preference not found:", prefError);
    return { success: false, error: "Subscription preference not found" };
  }
  
  const { user_id, organization_id, plan_slug, billing_period } = prefData;
  
  if (!organization_id || !plan_slug || !billing_period) {
    console.error("[MP subscription-return] Missing data in preference:", prefData);
    return { success: false, error: "Incomplete subscription data" };
  }
  
  let publicUserId: string | null = null;
  if (user_id) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user_id)
      .maybeSingle();
    publicUserId = userProfile?.id || null;
  }
  
  const planId = await getPlanIdBySlug(supabase, plan_slug);
  
  if (!planId) {
    console.error("[MP subscription-return] Plan not found:", plan_slug);
    return { success: false, error: "Plan not found" };
  }
  
  const { data: existingSub } = await supabase
    .from("organization_subscriptions")
    .select("id, provider_subscription_id")
    .eq("organization_id", organization_id)
    .eq("plan_id", planId)
    .eq("status", "active")
    .maybeSingle();
  
  if (existingSub) {
    console.log("[MP subscription-return] Subscription already exists:", existingSub.id);
    return { success: true, activated: true, message: "Subscription already active" };
  }
  
  const amount = preapproval.auto_recurring?.transaction_amount || 0;
  const currency = preapproval.auto_recurring?.currency_id || "ARS";
  
  const paymentResult = await insertPayment(supabase, "mercadopago", {
    providerPaymentId: `preapproval_${preapprovalId}`,
    userId: publicUserId,
    amount: amount || null,
    currency: currency,
    status: "completed",
    productType: 'subscription',
    organizationId: organization_id,
    productId: planId,
  });
  
  if (paymentResult.inserted && paymentResult.paymentId) {
    await upgradeOrganizationPlan(supabase, {
      organizationId: organization_id,
      planId: planId,
      billingPeriod: billing_period as 'monthly' | 'annual',
      paymentId: paymentResult.paymentId,
      amount: amount,
      currency: currency,
      userId: publicUserId,
      providerSubscriptionId: preapprovalId,
    });
    
    console.log("[MP subscription-return] ✅ Subscription activated for org:", organization_id);
    return { success: true, activated: true, message: "Subscription activated successfully" };
  } else if (!paymentResult.inserted) {
    console.log("[MP subscription-return] Payment already exists, subscription should be active");
    return { success: true, activated: true, message: "Payment already processed" };
  }
  
  return { success: false, error: "Failed to insert payment" };
}
