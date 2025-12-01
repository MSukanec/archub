import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { getMPPreapproval, searchMPPreapprovalByExternalRef } from "./subscriptions-api.js";
import { insertPayment } from "../shared/payments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { getPlanIdBySlug } from "../shared/helpers.js";

export type HandleSubscriptionReturnResult =
  | { success: true; activated: boolean; message: string }
  | { success: false; error: string };

export async function handleSubscriptionReturn(req: Request): Promise<HandleSubscriptionReturnResult> {
  const supabase = createServiceSupabaseClient();
  
  let preapprovalId = req.query.preapproval_id as string;
  
  // If no preapproval_id in query, try to find most recent pending preference
  if (!preapprovalId) {
    console.log("[MP subscription-return] No preapproval_id in query, searching for pending preferences...");
    
    // Get most recent preference that doesn't have an active subscription yet
    const { data: recentPrefs, error: prefsError } = await supabase
      .from("mp_subscription_preferences")
      .select("id, organization_id, plan_slug, billing_period, preapproval_id")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (prefsError || !recentPrefs?.length) {
      console.log("[MP subscription-return] No pending preferences found");
      return { success: true, activated: false, message: "No pending preferences found" };
    }
    
    // Try each preference to find one that's authorized
    for (const pref of recentPrefs) {
      // First check if already has active subscription
      const { data: existingSub } = await supabase
        .from("organization_subscriptions")
        .select("id")
        .eq("organization_id", pref.organization_id)
        .eq("status", "active")
        .maybeSingle();
      
      if (existingSub) {
        console.log("[MP subscription-return] Organization already has active subscription:", pref.organization_id);
        continue;
      }
      
      // Try to find the preapproval
      if (pref.preapproval_id) {
        preapprovalId = pref.preapproval_id;
        console.log("[MP subscription-return] Found preapproval_id in preference:", preapprovalId);
        break;
      } else {
        // Search by external_reference
        const searchResult = await searchMPPreapprovalByExternalRef(pref.id);
        if (searchResult.success && searchResult.preapprovalId) {
          preapprovalId = searchResult.preapprovalId;
          console.log("[MP subscription-return] Found preapproval by external_reference:", preapprovalId);
          break;
        }
      }
    }
    
    if (!preapprovalId) {
      console.log("[MP subscription-return] Could not find any authorized preapproval");
      return { success: true, activated: false, message: "No authorized preapproval found" };
    }
  }
  
  console.log("[MP subscription-return] Processing preapproval:", preapprovalId);
  
  const preapprovalResult = await getMPPreapproval(preapprovalId);
  
  if (!preapprovalResult.success) {
    console.error("[MP subscription-return] Failed to get preapproval:", preapprovalResult.error);
    return { success: false, error: preapprovalResult.error || "Failed to get preapproval" };
  }
  
  const preapproval = preapprovalResult.preapproval;
  const preapprovalStatus = preapproval.status;
  let externalRef = preapproval.external_reference || "";
  
  console.log("[MP subscription-return] Preapproval status:", preapprovalStatus, "external_reference:", externalRef);
  
  if (preapprovalStatus !== "authorized") {
    console.log("[MP subscription-return] Preapproval not yet authorized, status:", preapprovalStatus);
    return { success: true, activated: false, message: `Preapproval status: ${preapprovalStatus}` };
  }
  
  // If external_reference is empty or not in expected format, try to find preference by preapproval_id
  let prefData: any = null;
  
  if (externalRef.startsWith("mps_")) {
    const { data, error } = await supabase
      .from("mp_subscription_preferences")
      .select("*")
      .eq("id", externalRef)
      .maybeSingle();
    
    if (data && !error) {
      prefData = data;
    }
  }
  
  // Fallback: search by preapproval_id in the preferences table
  if (!prefData) {
    console.log("[MP subscription-return] Searching preference by preapproval_id...");
    const { data, error } = await supabase
      .from("mp_subscription_preferences")
      .select("*")
      .eq("preapproval_id", preapprovalId)
      .maybeSingle();
    
    if (data && !error) {
      prefData = data;
      externalRef = data.id;
    }
  }
  
  // Second fallback: find recent preference without active subscription
  if (!prefData) {
    console.log("[MP subscription-return] Searching for recent preference without active subscription...");
    const { data: recentPrefs } = await supabase
      .from("mp_subscription_preferences")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    
    for (const pref of recentPrefs || []) {
      const { data: existingSub } = await supabase
        .from("organization_subscriptions")
        .select("id")
        .eq("organization_id", pref.organization_id)
        .eq("status", "active")
        .maybeSingle();
      
      if (!existingSub) {
        prefData = pref;
        externalRef = pref.id;
        console.log("[MP subscription-return] Found eligible preference:", externalRef);
        break;
      }
    }
  }
  
  if (!prefData) {
    console.error("[MP subscription-return] No preference found for preapproval:", preapprovalId);
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
