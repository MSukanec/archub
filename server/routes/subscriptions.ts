import type { Express } from "express";
import type { RouteDeps } from "./_base";

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
      const { data: subscription, error: subError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .select(`
          *,
          plan:plans!plan_id(id, name, slug, features, monthly_amount, annual_amount, billing_type),
          scheduled_plan:plans!scheduled_downgrade_plan_id(id, name, slug, features, monthly_amount, annual_amount, billing_type)
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

      res.json(subscription || null);
    } catch (error) {
      console.error('Error in /api/subscriptions/current:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/subscriptions/schedule-downgrade - Schedule a plan downgrade
  app.post("/api/subscriptions/schedule-downgrade", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const { target_plan_slug } = req.body;

      if (!target_plan_slug) {
        return res.status(400).json({ error: "target_plan_slug is required" });
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

      // Verify user is admin of the organization
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
        return res.status(403).json({ error: "Only administrators can change subscription plans" });
      }

      // Get target plan
      const { data: targetPlan, error: planError } = await authenticatedSupabase
        .from('plans')
        .select('id, name, slug')
        .eq('slug', target_plan_slug)
        .eq('is_active', true)
        .maybeSingle();

      if (planError || !targetPlan) {
        return res.status(404).json({ error: "Target plan not found" });
      }

      // Get current active subscription
      const { data: currentSubscription, error: subError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching current subscription:', subError);
        return res.status(500).json({ error: 'Failed to fetch current subscription' });
      }

      if (!currentSubscription) {
        return res.status(404).json({ 
          error: "No active subscription found. This plan appears to be manually assigned. Contact support to make changes." 
        });
      }

      // Update subscription with scheduled downgrade
      const { data: updatedSubscription, error: updateError } = await authenticatedSupabase
        .from('organization_subscriptions')
        .update({
          scheduled_downgrade_plan_id: targetPlan.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error scheduling downgrade:', updateError);
        return res.status(500).json({ error: 'Failed to schedule downgrade' });
      }

      res.json({
        success: true,
        message: `Downgrade to ${targetPlan.name} scheduled for ${new Date(currentSubscription.expires_at).toLocaleDateString('es-AR')}`,
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Error in /api/subscriptions/schedule-downgrade:', error);
      res.status(500).json({ error: 'Internal server error' });
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
}
