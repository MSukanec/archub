import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { z } from "zod";
import { getOrganizationLimitStatus, updateResourceOverLimitStatus, applyPlanLimits } from "../lib/handlers/checkout/shared/plan-limits.js";

/**
 * Plan hierarchy for validation
 * Lower numbers = lower tier plans
 */
const PLAN_HIERARCHY = {
  free: 1,
  pro: 2,
  teams: 3,
  enterprise: 4
} as const;

/**
 * Zod schema for schedule-downgrade request body
 */
const scheduleDowngradeSchema = z.object({
  targetPlanSlug: z.string().min(1, "targetPlanSlug is required")
});

/**
 * Error codes for consistent error responses
 */
const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BUSINESS_LOGIC_ERROR: "BUSINESS_LOGIC_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

/**
 * Create consistent error response
 */
function createErrorResponse(code: string, message: string) {
  return { error: { code, message } };
}

/**
 * Log error without leaking sensitive information
 */
function logError(context: string, error: any) {
  console.error(`[${context}]`, {
    message: error?.message || "Unknown error",
    code: error?.code,
    timestamp: new Date().toISOString()
  });
}

/**
 * Register subscription-related endpoints
 */
export function registerSubscriptionRoutes(app: Express, deps: RouteDeps): void {
  const { supabase, createAuthenticatedClient, extractToken } = deps;

  // GET /api/subscriptions/current - Get current organization subscription
  app.get("/api/subscriptions/current", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user's database ID
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's active organization from preferences
      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (!userPrefs?.last_organization_id) {
        return res.status(404).json({ error: "No active organization" });
      }

      const organizationId = userPrefs.last_organization_id;

      // Get current active subscription
      // Note: scheduled_downgrade_plan_id may not exist yet in database
      const { data: subscription, error: subError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .select(`
          *,
          plan:plans!plan_id(id, name, slug, features, monthly_amount, annual_amount, billing_type)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        return res.status(500).json({ error: 'Failed to fetch subscription' });
      }

      // If subscription exists and has scheduled_downgrade_plan_id, fetch the scheduled plan
      if (subscription && subscription.scheduled_downgrade_plan_id) {
        const { data: scheduledPlan } = await authenticatedSupabase
          .from('plans')
          .select('id, name, slug, features, monthly_amount, annual_amount, billing_type')
          .eq('id', subscription.scheduled_downgrade_plan_id)
          .maybeSingle();
        
        if (scheduledPlan) {
          subscription.scheduled_plan = scheduledPlan;
        }
      }

      res.json(subscription || null);
    } catch (error) {
      console.error('Error in /api/subscriptions/current:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/subscriptions/schedule-downgrade - Schedule a plan downgrade
  app.post("/api/subscriptions/schedule-downgrade", async (req, res) => {
    const context = "POST /api/subscriptions/schedule-downgrade";
    
    try {
      // 1. Validate authorization token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json(createErrorResponse(
          ErrorCodes.UNAUTHORIZED,
          "No se proporcionó token de autorización"
        ));
      }

      // 2. Validate request body with Zod
      const parseResult = scheduleDowngradeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          parseResult.error.errors[0]?.message || "Datos de entrada inválidos"
        ));
      }

      const { targetPlanSlug } = parseResult.data;
      const authenticatedSupabase = createAuthenticatedClient(token);

      // 3. Transactional fetch: Get authenticated user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        logError(context, userError);
        return res.status(401).json(createErrorResponse(
          ErrorCodes.UNAUTHORIZED,
          "No autorizado"
        ));
      }

      // 4. Get user's database record with role info
      const { data: dbUser, error: dbUserError } = await authenticatedSupabase
        .from('users')
        .select('id, role_id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (dbUserError || !dbUser) {
        logError(context, dbUserError);
        return res.status(404).json(createErrorResponse(
          ErrorCodes.NOT_FOUND,
          "Usuario no encontrado"
        ));
      }

      // 5. Get user's active organization from preferences
      const { data: userPrefs, error: prefsError } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (prefsError || !userPrefs?.last_organization_id) {
        logError(context, prefsError);
        return res.status(404).json(createErrorResponse(
          ErrorCodes.NOT_FOUND,
          "No hay organización activa"
        ));
      }

      const organizationId = userPrefs.last_organization_id;

      // 6. Verify user has admin permissions via organization membership
      const { data: membership, error: membershipError } = await authenticatedSupabase
        .from('organization_members')
        .select('id, role_id, role:roles!inner(id, name)')
        .eq('user_id', dbUser.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();

      if (membershipError || !membership) {
        logError(context, membershipError);
        return res.status(403).json(createErrorResponse(
          ErrorCodes.FORBIDDEN,
          "No tienes permisos para esta organización"
        ));
      }

      // Check for admin role using role name (since we don't have a permission flag)
      const role = Array.isArray(membership.role) ? membership.role[0] : membership.role;
      if (role?.name !== 'Administrador') {
        return res.status(403).json(createErrorResponse(
          ErrorCodes.FORBIDDEN,
          "Solo los administradores pueden cambiar planes de suscripción"
        ));
      }

      // 7. Get target plan with validation
      const { data: targetPlan, error: planError } = await authenticatedSupabase
        .from('plans')
        .select('id, name, slug')
        .eq('slug', targetPlanSlug.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (planError || !targetPlan) {
        logError(context, planError);
        return res.status(404).json(createErrorResponse(
          ErrorCodes.NOT_FOUND,
          "Plan objetivo no encontrado o inactivo"
        ));
      }

      // 8. Get current active subscription with plan details
      const { data: currentSubscription, error: subError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .select(`
          *,
          plan:plans!plan_id(id, name, slug)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        logError(context, subError);
        return res.status(500).json(createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          "Error al obtener suscripción actual"
        ));
      }

      // 9. Validate subscription exists and is active
      if (!currentSubscription) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.BUSINESS_LOGIC_ERROR,
          "Este plan solo puede gestionarse por soporte."
        ));
      }

      // 10. Validate subscription status is 'active'
      if (currentSubscription.status !== 'active') {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.BUSINESS_LOGIC_ERROR,
          "La suscripción actual no está activa"
        ));
      }

      // 11. Check if subscription is expired
      const now = new Date();
      const expiresAt = new Date(currentSubscription.expires_at);
      if (expiresAt <= now) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.BUSINESS_LOGIC_ERROR,
          "La suscripción actual ha expirado"
        ));
      }

      // 12. Validate that target plan is different from current plan
      if (targetPlan.id === currentSubscription.plan_id) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.BUSINESS_LOGIC_ERROR,
          "El plan objetivo es el mismo que el plan actual"
        ));
      }

      // 13. Validate plan hierarchy - target must be lower tier
      const currentPlanSlug = currentSubscription.plan.slug.toLowerCase();
      const targetPlanSlugLower = targetPlan.slug.toLowerCase();
      
      const currentTier = PLAN_HIERARCHY[currentPlanSlug as keyof typeof PLAN_HIERARCHY];
      const targetTier = PLAN_HIERARCHY[targetPlanSlugLower as keyof typeof PLAN_HIERARCHY];

      if (!currentTier || !targetTier) {
        logError(context, { message: "Unknown plan slug", currentPlanSlug, targetPlanSlugLower });
        return res.status(400).json(createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Plan no reconocido en la jerarquía"
        ));
      }

      if (targetTier >= currentTier) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.BUSINESS_LOGIC_ERROR,
          "Solo puedes programar un downgrade a un plan de menor nivel. Para upgrades, realiza un nuevo pago."
        ));
      }

      // 14. Check if a downgrade is already scheduled (optional: clear it, or reject)
      // According to requirement 8, we should clear previous schedule when re-scheduling
      if (currentSubscription.scheduled_downgrade_plan_id) {
        // Log that we're replacing an existing schedule
        logError(context, { 
          message: "Replacing existing scheduled downgrade",
          oldPlanId: currentSubscription.scheduled_downgrade_plan_id,
          newPlanId: targetPlan.id
        });
      }

      // 15. Update subscription with scheduled downgrade (this clears any previous schedule)
      const { data: updatedSubscription, error: updateError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .update({
          scheduled_downgrade_plan_id: targetPlan.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)
        .eq('status', 'active')
        .select()
        .maybeSingle();

      if (updateError || !updatedSubscription) {
        logError(context, updateError);
        return res.status(500).json(createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          "Error al programar el downgrade"
        ));
      }

      // 16. Return success response
      res.json({
        success: true,
        message: `Downgrade a ${targetPlan.name} programado para ${expiresAt.toLocaleDateString('es-AR')}`,
        subscription: updatedSubscription
      });
    } catch (error) {
      logError(context, error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Error interno del servidor"
      ));
    }
  });

  // DELETE /api/subscriptions/cancel-scheduled-downgrade - Cancel a scheduled downgrade
  app.delete("/api/subscriptions/cancel-scheduled-downgrade", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get current user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user's database ID
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's active organization from preferences
      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (!userPrefs?.last_organization_id) {
        return res.status(404).json({ error: "No active organization" });
      }

      const organizationId = userPrefs.last_organization_id;

      // Verify user is admin
      const { data: membership } = await authenticatedSupabase
        .from('organization_members')
        .select(`
          *,
          role:roles(name)
        `)
        .eq('user_id', dbUser.id)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership || membership.role.name !== 'Administrador') {
        return res.status(403).json({ error: "Only administrators can manage subscriptions" });
      }

      // Get current active subscription
      const { data: currentSubscription } = await authenticatedSupabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!currentSubscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Clear scheduled downgrade
      const { error: updateError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .update({
          scheduled_downgrade_plan_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id);

      if (updateError) {
        console.error('Error canceling scheduled downgrade:', updateError);
        return res.status(500).json({ error: 'Failed to cancel scheduled downgrade' });
      }

      res.json({
        success: true,
        message: 'Scheduled downgrade cancelled successfully'
      });
    } catch (error) {
      console.error('Error in /api/subscriptions/cancel-scheduled-downgrade:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/subscriptions/:id/cancel - Cancel a subscription
  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    const context = "POST /api/subscriptions/:id/cancel";
    
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ ok: false, error: 'Missing subscription ID' });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get authenticated user
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        console.error('[Cancel Subscription] Invalid token:', authError);
        return res.status(401).json({ ok: false, error: 'Invalid token' });
      }

      // Get user's database ID
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }

      // Get subscription to check organization
      const { data: subscription, error: subError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .select('id, organization_id, status')
        .eq('id', id)
        .maybeSingle();

      if (subError || !subscription) {
        console.error('[Cancel Subscription] Subscription not found:', subError);
        return res.status(404).json({ ok: false, error: 'Subscription not found' });
      }

      // Verify user is admin of the organization
      const { data: membership, error: memberError } = await authenticatedSupabase
        .from('organization_members')
        .select('id, role_id, role:roles!inner(name)')
        .eq('organization_id', subscription.organization_id)
        .eq('user_id', dbUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError || !membership) {
        console.error('[Cancel Subscription] User not member of organization:', memberError);
        return res.status(403).json({ ok: false, error: 'You don\'t have permissions to cancel this subscription' });
      }

      // Verify user is admin
      const role = Array.isArray(membership.role) ? membership.role[0] : membership.role;
      const roleName = role?.name?.toLowerCase();
      if (roleName !== 'admin' && roleName !== 'owner' && roleName !== 'administrador') {
        console.error('[Cancel Subscription] User is not admin:', { roleName });
        return res.status(403).json({ ok: false, error: 'Only administrators can cancel the subscription' });
      }

      // Check if already cancelled
      if (subscription.status === 'cancelled') {
        return res.status(400).json({ ok: false, error: 'Subscription is already cancelled' });
      }

      // Update subscription status to cancelled
      const { error: updateError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('[Cancel Subscription] Error updating subscription:', updateError);
        return res.status(500).json({ ok: false, error: 'Failed to cancel subscription' });
      }

      return res.status(200).json({
        ok: true,
        message: 'Subscription cancelled successfully. Access will remain until expiration date.'
      });

    } catch (error: any) {
      console.error('[Cancel Subscription] Error:', error);
      return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
    }
  });

  // GET /api/subscriptions/limit-status - Get organization's plan limit status
  app.get("/api/subscriptions/limit-status", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "No authorization token provided"));
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"));
      }

      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"));
      }

      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (!userPrefs?.last_organization_id) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "No active organization"));
      }

      const organizationId = userPrefs.last_organization_id;

      const { data: membership } = await authenticatedSupabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', dbUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "You don't have access to this organization"));
      }

      const status = await getOrganizationLimitStatus(authenticatedSupabase, organizationId);

      if (!status.success) {
        return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, status.error || "Failed to get limit status"));
      }

      return res.status(200).json({
        ok: true,
        data: status
      });

    } catch (error: any) {
      logError('Limit Status', error);
      return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
    }
  });

  // POST /api/subscriptions/reapply-limits - Reapply plan limits to organization
  app.post("/api/subscriptions/reapply-limits", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "No authorization token provided"));
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"));
      }

      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"));
      }

      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (!userPrefs?.last_organization_id) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "No active organization"));
      }

      const organizationId = userPrefs.last_organization_id;

      const { data: membership } = await authenticatedSupabase
        .from('organization_members')
        .select('id, role_id, role:roles!inner(name)')
        .eq('organization_id', organizationId)
        .eq('user_id', dbUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "You don't have access to this organization"));
      }

      const role = Array.isArray(membership.role) ? membership.role[0] : membership.role;
      const roleName = role?.name?.toLowerCase();
      if (roleName !== 'admin' && roleName !== 'owner' && roleName !== 'administrador') {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "Only administrators can reapply plan limits"));
      }

      const { data: org } = await authenticatedSupabase
        .from('organizations')
        .select('id, plan_id, plans!left(name)')
        .eq('id', organizationId)
        .single();

      const planName = (org as any)?.plans?.name || 'Free';

      const result = await applyPlanLimits(authenticatedSupabase, organizationId, planName);

      if (!result.success) {
        return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, result.error || "Failed to apply limits"));
      }

      return res.status(200).json({
        ok: true,
        data: {
          projectsMarked: result.projectsMarked,
          membersMarked: result.membersMarked,
          details: result.details
        }
      });

    } catch (error: any) {
      logError('Reapply Limits', error);
      return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
    }
  });

  // POST /api/subscriptions/update-resource-limit - Update a specific resource's over-limit status
  app.post("/api/subscriptions/update-resource-limit", async (req, res) => {
    try {
      const updateSchema = z.object({
        resourceType: z.enum(['project', 'member']),
        resourceId: z.string().uuid(),
        isOverLimit: z.boolean()
      });

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, parsed.error.message));
      }

      const { resourceType, resourceId, isOverLimit } = parsed.data;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "No authorization token provided"));
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"));
      }

      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"));
      }

      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (!userPrefs?.last_organization_id) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "No active organization"));
      }

      const organizationId = userPrefs.last_organization_id;

      const { data: membership } = await authenticatedSupabase
        .from('organization_members')
        .select('id, role_id, role:roles!inner(name)')
        .eq('organization_id', organizationId)
        .eq('user_id', dbUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "You don't have access to this organization"));
      }

      const role = Array.isArray(membership.role) ? membership.role[0] : membership.role;
      const roleName = role?.name?.toLowerCase();
      if (roleName !== 'admin' && roleName !== 'owner' && roleName !== 'administrador') {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "Only administrators can modify resource limits"));
      }

      if (resourceType === 'project') {
        const { data: project } = await authenticatedSupabase
          .from('projects')
          .select('id, organization_id')
          .eq('id', resourceId)
          .maybeSingle();

        if (!project || project.organization_id !== organizationId) {
          return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "Project does not belong to your organization"));
        }
      } else {
        const { data: member } = await authenticatedSupabase
          .from('organization_members')
          .select('id, organization_id')
          .eq('id', resourceId)
          .maybeSingle();

        if (!member || member.organization_id !== organizationId) {
          return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "Member does not belong to your organization"));
        }
      }

      const result = await updateResourceOverLimitStatus(authenticatedSupabase, resourceType, resourceId, isOverLimit);

      if (!result.success) {
        return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, result.error || "Failed to update resource"));
      }

      return res.status(200).json({
        ok: true,
        message: `Resource ${isOverLimit ? 'marked as over limit' : 'restored to active'}`
      });

    } catch (error: any) {
      logError('Update Resource Limit', error);
      return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
    }
  });

  // POST /api/subscriptions/swap-resources - Swap which resources are active vs over-limit
  app.post("/api/subscriptions/swap-resources", async (req, res) => {
    try {
      const swapSchema = z.object({
        resourceType: z.enum(['project', 'member']),
        activateId: z.string().uuid(),
        deactivateId: z.string().uuid()
      });

      const parsed = swapSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, parsed.error.message));
      }

      const { resourceType, activateId, deactivateId } = parsed.data;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "No authorization token provided"));
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"));
      }

      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!dbUser) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"));
      }

      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', dbUser.id)
        .maybeSingle();

      if (!userPrefs?.last_organization_id) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "No active organization"));
      }

      const organizationId = userPrefs.last_organization_id;

      const { data: membership } = await authenticatedSupabase
        .from('organization_members')
        .select('id, role_id, role:roles!inner(name)')
        .eq('organization_id', organizationId)
        .eq('user_id', dbUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "You don't have access to this organization"));
      }

      const role = Array.isArray(membership.role) ? membership.role[0] : membership.role;
      const roleName = role?.name?.toLowerCase();
      if (roleName !== 'admin' && roleName !== 'owner' && roleName !== 'administrador') {
        return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "Only administrators can swap resources"));
      }

      const table = resourceType === 'project' ? 'projects' : 'organization_members';

      const { data: resources } = await authenticatedSupabase
        .from(table)
        .select('id, organization_id, is_over_limit')
        .in('id', [activateId, deactivateId]);

      if (!resources || resources.length !== 2) {
        return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, "One or both resources not found"));
      }

      for (const resource of resources) {
        if (resource.organization_id !== organizationId) {
          return res.status(403).json(createErrorResponse(ErrorCodes.FORBIDDEN, "Resources must belong to your organization"));
        }
      }

      const activateResource = resources.find(r => r.id === activateId);
      const deactivateResource = resources.find(r => r.id === deactivateId);

      if (!activateResource?.is_over_limit) {
        return res.status(400).json(createErrorResponse(ErrorCodes.BUSINESS_LOGIC_ERROR, "Resource to activate is not currently over limit"));
      }

      if (deactivateResource?.is_over_limit) {
        return res.status(400).json(createErrorResponse(ErrorCodes.BUSINESS_LOGIC_ERROR, "Resource to deactivate is already over limit"));
      }

      const activateResult = await updateResourceOverLimitStatus(authenticatedSupabase, resourceType, activateId, false);
      if (!activateResult.success) {
        return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, activateResult.error || "Failed to activate resource"));
      }

      const deactivateResult = await updateResourceOverLimitStatus(authenticatedSupabase, resourceType, deactivateId, true);
      if (!deactivateResult.success) {
        await updateResourceOverLimitStatus(authenticatedSupabase, resourceType, activateId, true);
        return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, deactivateResult.error || "Failed to deactivate resource"));
      }

      return res.status(200).json({
        ok: true,
        message: `Successfully swapped ${resourceType}s`
      });

    } catch (error: any) {
      logError('Swap Resources', error);
      return res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
    }
  });
}
