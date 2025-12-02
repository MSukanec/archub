import type { Request, Response } from "express";
import { createCoursePreference } from "../../lib/handlers/checkout/mp/createCoursePreference.js";
import { createSubscriptionPreference } from "../../lib/handlers/checkout/mp/createSubscriptionPreference.js";
import { createRecurringSubscription } from "../../lib/handlers/checkout/mp/createRecurringSubscription.js";
import { createUpgradePreference } from "../../lib/handlers/checkout/mp/createUpgradePreference.js";
import { updateMPSubscription } from "../../lib/handlers/checkout/mp/updateSubscription.js";
import { syncMPPlans } from "../../lib/handlers/checkout/mp/sync-plans.js";
import { processWebhook } from "../../lib/handlers/checkout/mp/processWebhook.js";
import { handleCorsPreflight } from "../../lib/handlers/checkout/shared/cors.js";

export async function createCourse(req: Request, res: Response) {
  try {
    const result = await createCoursePreference(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error,
        ...(result.reason && { reason: result.reason }),
        ...(result.freeEnrollment && { 
          freeEnrollment: result.freeEnrollment,
          couponCode: result.couponCode
        })
      });
    }
    
    return res.json({
      ok: true,
      init_point: result.initPoint,
      preference_id: result.preferenceId
    });
  } catch (error: any) {
    console.error("[MP create-course controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create course preference"
    });
  }
}

export async function createSubscription(req: Request, res: Response) {
  try {
    const result = await createSubscriptionPreference(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      init_point: result.initPoint,
      preference_id: result.preferenceId
    });
  } catch (error: any) {
    console.error("[MP create-subscription controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create subscription preference"
    });
  }
}

export async function successHandler(req: Request, res: Response) {
  try {
    const { course_slug, payment_id, status } = req.query;

    if (!course_slug) {
      return res.redirect(`/learning/courses?payment=failed&reason=missing_slug`);
    }

    const courseSlug = String(course_slug);

    return res.redirect(`/learning/courses/${courseSlug}?payment=success`);
  } catch (e: any) {
    console.error("[MP success-handler] Error:", e);
    const courseSlug = String(req.query.course_slug || "");
    return res.redirect(`/learning/courses/${courseSlug || ""}?payment=error`);
  }
}

export async function subscriptionSuccessHandler(req: Request, res: Response) {
  const { handleSubscriptionReturn } = await import("../../lib/handlers/checkout/mp/handleSubscriptionReturn.js");
  
  try {
    const result = await handleSubscriptionReturn(req);
    
    if (result.success) {
      return res.redirect(`/organization/billing?payment=success&activated=${result.activated}`);
    } else {
      console.error("[MP subscription-success-handler] Error:", result.error);
      return res.redirect(`/organization/billing?payment=pending&reason=${encodeURIComponent(result.error || 'unknown')}`);
    }
  } catch (e: any) {
    console.error("[MP subscription-success-handler] Fatal error:", e);
    return res.redirect(`/organization/billing?payment=error`);
  }
}

export async function webhook(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(res as any);
  }

  try {
    const result = await processWebhook(req as any);
    
    if (!result.success) {
      console.error("[MP webhook controller] Error:", result.error);
      return res.status(500).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.status(200).json({
      ok: true,
      processed: result.processed,
      id: result.id
    });
  } catch (error: any) {
    console.error("[MP webhook controller] Fatal error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to process webhook"
    });
  }
}

export async function createRecurring(req: Request, res: Response) {
  try {
    const result = await createRecurringSubscription(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      init_point: result.initPoint,
      preapproval_id: result.preapprovalId
    });
  } catch (error: any) {
    console.error("[MP create-recurring controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create recurring subscription"
    });
  }
}

export async function syncPlans(req: Request, res: Response) {
  try {
    const result = await syncMPPlans(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      results: result.results
    });
  } catch (error: any) {
    console.error("[MP sync-plans controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to sync plans with MercadoPago"
    });
  }
}

export async function updateSubscription(req: Request, res: Response) {
  try {
    const result = await updateMPSubscription(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      message: result.message,
      details: result.details
    });
  } catch (error: any) {
    console.error("[MP update-subscription controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to update subscription"
    });
  }
}

export async function createUpgrade(req: Request, res: Response) {
  try {
    const result = await createUpgradePreference(req as any);
    
    if (!result.success) {
      return res.status(result.status || 400).json({
        ok: false,
        error: result.error
      });
    }
    
    return res.json({
      ok: true,
      init_point: result.initPoint,
      preference_id: result.preferenceId,
      is_free_upgrade: result.isFreeUpgrade || false
    });
  } catch (error: any) {
    console.error("[MP create-upgrade controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create upgrade preference"
    });
  }
}

export async function upgradeSuccessHandler(req: Request, res: Response) {
  const { handleUpgradeReturn } = await import("../../lib/handlers/checkout/mp/handleUpgradeReturn.js");
  
  try {
    const result = await handleUpgradeReturn(req);
    
    if (result.success) {
      if (result.redirectUrl && result.redirectUrl.startsWith('http')) {
        return res.redirect(result.redirectUrl);
      }
      return res.redirect(`/organization/billing?payment=success&upgrade=true&activated=${result.activated}`);
    } else {
      console.error("[MP upgrade-success-handler] Error:", result.error);
      return res.redirect(`/organization/billing?payment=failed&reason=${encodeURIComponent(result.error || 'unknown')}`);
    }
  } catch (e: any) {
    console.error("[MP upgrade-success-handler] Fatal error:", e);
    return res.redirect(`/organization/billing?payment=error`);
  }
}

export async function createSeat(req: Request, res: Response) {
  try {
    const { createSeatPreference } = await import("../../lib/handlers/checkout/mp/createSeatPreference.js");
    const { createClient } = await import("@supabase/supabase-js");
    const { getAdminClient } = await import("../../routes/_base.js");
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, error: "No autorizado" });
    }
    
    const token = authHeader.substring(7);
    const authSupabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
    }
    
    const { 
      organization_id, 
      invitee_email, 
      role_id, 
      prorated_amount_ars,
      subscription_id,
      billing_period 
    } = req.body;
    
    if (!organization_id || !invitee_email || !role_id || !prorated_amount_ars || !subscription_id || !billing_period) {
      return res.status(400).json({ 
        ok: false, 
        error: "Faltan parámetros requeridos" 
      });
    }
    
    const adminClient = getAdminClient();
    const { data: dbUser, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();
    
    if (userError || !dbUser) {
      return res.status(401).json({ ok: false, error: "Usuario no encontrado" });
    }
    
    const result = await createSeatPreference({
      supabase: adminClient,
      userId: dbUser.id,
      authId: authUser.id,
      organizationId: organization_id,
      inviteeEmail: invitee_email,
      roleId: role_id,
      proratedAmountARS: prorated_amount_ars,
      subscriptionId: subscription_id,
      billingPeriod: billing_period,
    });
    
    if (!result.success) {
      return res.status(400).json({ ok: false, error: result.error });
    }
    
    return res.json({
      ok: true,
      init_point: result.preferenceUrl,
      preference_id: result.preferenceId,
    });
  } catch (error: any) {
    console.error("[MP create-seat controller] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create seat payment preference"
    });
  }
}

export async function seatSuccessHandler(req: Request, res: Response) {
  const { handleSeatReturn } = await import("../../lib/handlers/checkout/mp/handleSeatReturn.js");
  return handleSeatReturn(req, res);
}
