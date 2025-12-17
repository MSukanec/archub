import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";

export interface OrganizationAuditReport {
  organization: {
    id: string;
    name: string;
    plan_id: string | null;
    plan_name: string | null;
    settings: Record<string, any>;
    created_at: string;
  };
  owner: {
    id: string;
    email: string;
    full_name: string;
  } | null;
  subscription: {
    id: string;
    status: string;
    plan_id: string;
    plan_name: string;
    billing_period: string;
    started_at: string;
    expires_at: string | null;
    provider_subscription_id: string | null;
    amount: number | null;
    currency: string | null;
  } | null;
  billing_cycle: {
    id: string;
    cycle_start: string;
    cycle_end: string;
    status: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    provider: string;
    provider_payment_id: string | null;
  }>;
  payment_events: Array<{
    id: string;
    provider_event_type: string;
    status: string;
    created_at: string;
    custom_id: string | null;
  }>;
  mp_preferences: Array<{
    id: string;
    plan_slug: string;
    billing_period: string;
    created_at: string;
    preapproval_id: string | null;
  }>;
  founder_course_enrollment: {
    enrolled: boolean;
    course_id: string | null;
    course_name: string | null;
    access_type: string | null;
    expires_at: string | null;
  };
  health_checks: {
    has_active_subscription: boolean;
    plan_matches_subscription: boolean;
    has_billing_cycle: boolean;
    has_payments: boolean;
    has_payment_events: boolean;
    is_founder: boolean;
    founder_has_course: boolean;
    all_passed: boolean;
  };
}

export async function getOrganizationsList(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const search = req.query.search as string | undefined;
    
    let query = supabaseAdmin
      .from("organizations")
      .select(`
        id,
        name,
        plan_id,
        created_at,
        created_by,
        plans!organizations_plan_id_fkey(name)
      `)
      .order("name", { ascending: true })
      .limit(50);
    
    if (search && search.length >= 2) {
      query = query.ilike("name", `%${search}%`);
    }
    
    const { data: organizations, error } = await query;
    
    if (error) {
      console.error('[Admin Audit] Error fetching organizations:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const result = (organizations || []).map(org => ({
      id: org.id,
      name: org.name,
      plan_name: (org.plans as any)?.name || 'Sin plan',
      created_at: org.created_at,
    }));
    
    return res.json(result);
  } catch (error: any) {
    console.error('[Admin Audit] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getOrganizationAudit(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const organizationId = req.params.id;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }
    
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select(`
        id,
        name,
        plan_id,
        settings,
        created_at,
        created_by,
        owner_id,
        plans!organizations_plan_id_fkey(id, name, slug)
      `)
      .eq("id", organizationId)
      .single();
    
    if (orgError || !org) {
      console.error('[Admin Audit] Organization not found:', orgError);
      return res.status(404).json({ error: "Organization not found" });
    }
    
    let owner = null;
    if (org.owner_id) {
      const { data: ownerData } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name")
        .eq("id", org.owner_id)
        .single();
      
      if (ownerData) {
        owner = {
          id: ownerData.id,
          email: ownerData.email,
          full_name: ownerData.full_name,
        };
      }
    }
    
    const { data: subscription } = await supabaseAdmin
      .from("organization_subscriptions")
      .select(`
        id,
        status,
        plan_id,
        billing_period,
        started_at,
        expires_at,
        provider_subscription_id,
        amount,
        currency,
        plans!organization_subscriptions_plan_id_fkey(name)
      `)
      .eq("organization_id", organizationId)
      .in("status", ["active", "trialing"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let billingCycle = null;
    if (subscription) {
      const { data: cycle } = await supabaseAdmin
        .from("organization_billing_cycles")
        .select("id, cycle_start, cycle_end, status")
        .eq("subscription_id", subscription.id)
        .order("cycle_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      billingCycle = cycle;
    }
    
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("id, amount, currency, status, created_at, provider, provider_payment_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    const paymentProviderIds = (payments || [])
      .map(p => p.provider_payment_id)
      .filter(Boolean);
    
    let paymentEvents: any[] = [];
    if (paymentProviderIds.length > 0) {
      const { data: events } = await supabaseAdmin
        .from("payment_events")
        .select("id, provider_event_type, status, created_at, custom_id")
        .in("provider_payment_id", paymentProviderIds)
        .order("created_at", { ascending: false })
        .limit(20);
      paymentEvents = events || [];
    }
    
    const { data: mpPreferences } = await supabaseAdmin
      .from("mp_subscription_preferences")
      .select("id, plan_slug, billing_period, created_at, preapproval_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    let founderCourseEnrollment = {
      enrolled: false,
      course_id: null as string | null,
      course_name: null as string | null,
      access_type: null as string | null,
      expires_at: null as string | null,
    };
    
    if (owner) {
      const { data: founderCourse } = await supabaseAdmin
        .from("courses")
        .select("id, title")
        .eq("is_founder_bonus", true)
        .limit(1)
        .maybeSingle();
      
      if (founderCourse) {
        const { data: enrollment } = await supabaseAdmin
          .from("user_course_purchases")
          .select("id, access_type, expires_at")
          .eq("user_id", owner.id)
          .eq("course_id", founderCourse.id)
          .maybeSingle();
        
        founderCourseEnrollment = {
          enrolled: !!enrollment,
          course_id: founderCourse.id,
          course_name: founderCourse.title,
          access_type: enrollment?.access_type || null,
          expires_at: enrollment?.expires_at || null,
        };
      }
    }
    
    const settings = org.settings || {};
    const isFounder = settings.is_founder === true;
    const planFromOrg = (org.plans as any)?.slug || '';
    const planFromSub = subscription ? (subscription.plans as any)?.name : null;
    const hasActiveSubscription = !!subscription && subscription.status === 'active';
    const planMatches = !subscription || org.plan_id === subscription.plan_id;
    
    const healthChecks = {
      has_active_subscription: hasActiveSubscription,
      plan_matches_subscription: planMatches,
      has_billing_cycle: !!billingCycle,
      has_payments: (payments?.length || 0) > 0,
      has_payment_events: paymentEvents.length > 0,
      is_founder: isFounder,
      founder_has_course: !isFounder || founderCourseEnrollment.enrolled,
      all_passed: false,
    };
    
    healthChecks.all_passed = 
      healthChecks.plan_matches_subscription &&
      healthChecks.founder_has_course &&
      (planFromOrg === 'free' || healthChecks.has_active_subscription);
    
    const report: OrganizationAuditReport = {
      organization: {
        id: org.id,
        name: org.name,
        plan_id: org.plan_id,
        plan_name: (org.plans as any)?.name || null,
        settings: settings,
        created_at: org.created_at,
      },
      owner,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        plan_name: (subscription.plans as any)?.name || '',
        billing_period: subscription.billing_period,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        provider_subscription_id: subscription.provider_subscription_id,
        amount: subscription.amount,
        currency: subscription.currency,
      } : null,
      billing_cycle: billingCycle,
      payments: payments || [],
      payment_events: paymentEvents,
      mp_preferences: mpPreferences || [],
      founder_course_enrollment: founderCourseEnrollment,
      health_checks: healthChecks,
    };
    
    return res.json(report);
  } catch (error: any) {
    console.error('[Admin Audit] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function repairFounderStatus(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const organizationId = req.params.id;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }
    
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id, settings, owner_id")
      .eq("id", organizationId)
      .single();
    
    if (orgError || !org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    if (!org.owner_id) {
      return res.status(400).json({ error: "No se encontró owner para esta organización" });
    }
    
    const currentSettings = org.settings || {};
    const newSettings = {
      ...currentSettings,
      is_founder: true,
      founder_since: new Date().toISOString(),
    };
    
    const { error: updateError } = await supabaseAdmin
      .from("organizations")
      .update({ settings: newSettings })
      .eq("id", organizationId);
    
    if (updateError) {
      console.error('[Admin Audit] Error updating founder status:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    console.log(`[Admin Audit] Founder status repaired for org ${organizationId}`);
    return res.json({ success: true, settings: newSettings });
  } catch (error: any) {
    console.error('[Admin Audit] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function syncOrganizationPlan(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const organizationId = req.params.id;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }
    
    const { data: subscription } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("id, plan_id, status")
      .eq("organization_id", organizationId)
      .in("status", ["active", "trialing"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!subscription) {
      const { data: freePlan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("slug", "free")
        .single();
      
      if (freePlan) {
        await supabaseAdmin
          .from("organizations")
          .update({ plan_id: freePlan.id })
          .eq("id", organizationId);
        
        return res.json({ success: true, synced_to: "free", message: "Sincronizado a Free (sin suscripción activa)" });
      }
      return res.status(400).json({ error: "No hay suscripción activa" });
    }
    
    const { error: updateError } = await supabaseAdmin
      .from("organizations")
      .update({ plan_id: subscription.plan_id })
      .eq("id", organizationId);
    
    if (updateError) {
      console.error('[Admin Audit] Error syncing plan:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    console.log(`[Admin Audit] Plan synced for org ${organizationId} to plan ${subscription.plan_id}`);
    return res.json({ success: true, synced_to: subscription.plan_id });
  } catch (error: any) {
    console.error('[Admin Audit] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function enrollOwnerInFounderCourse(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    
    const organizationId = req.params.id;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }
    
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, owner_id")
      .eq("id", organizationId)
      .single();
    
    if (!org?.owner_id) {
      return res.status(404).json({ error: "Owner not found" });
    }
    
    const ownerId = org.owner_id;
    
    const { data: founderCourse } = await supabaseAdmin
      .from("courses")
      .select("id, title")
      .eq("is_founder_bonus", true)
      .limit(1)
      .maybeSingle();
    
    if (!founderCourse) {
      return res.status(404).json({ error: "Founder course not found" });
    }
    
    const { data: existingEnrollment } = await supabaseAdmin
      .from("user_course_purchases")
      .select("id")
      .eq("user_id", ownerId)
      .eq("course_id", founderCourse.id)
      .maybeSingle();
    
    if (existingEnrollment) {
      return res.json({ success: true, already_enrolled: true });
    }
    
    const { error: insertError } = await supabaseAdmin
      .from("user_course_purchases")
      .insert({
        user_id: ownerId,
        course_id: founderCourse.id,
        access_type: 'founder_bonus',
        payment_id: null,
        expires_at: null,
      });
    
    if (insertError) {
      console.error('[Admin Audit] Error enrolling owner:', insertError);
      return res.status(500).json({ error: insertError.message });
    }
    
    console.log(`[Admin Audit] Owner ${ownerId} enrolled in founder course for org ${organizationId}`);
    return res.json({ success: true, enrolled: true, course: founderCourse.title });
  } catch (error: any) {
    console.error('[Admin Audit] Error:', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
