import type { Request, Response } from "express";
import { createCoursePreference } from "../../lib/handlers/checkout/mp/createCoursePreference.js";
import { createSubscriptionPreference } from "../../lib/handlers/checkout/mp/createSubscriptionPreference.js";
import { createRecurringSubscription } from "../../lib/handlers/checkout/mp/createRecurringSubscription.js";
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
