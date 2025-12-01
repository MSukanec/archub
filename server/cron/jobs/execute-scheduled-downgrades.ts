import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { executeScheduledPlanSwitch, suspendBonusCourseEnrollments } from '../../lib/handlers/checkout/shared/subscriptions.js';
import { applyPlanLimits } from '../../lib/handlers/checkout/shared/plan-limits.js';

interface DowngradeJobResult {
  processed: number;
  successful: number;
  failed: number;
  details: Array<{
    subscriptionId: string;
    organizationId: string;
    fromPlan: string;
    toPlan: string;
    status: 'success' | 'error';
    error?: string;
  }>;
}

function createServiceSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ScheduledDowngrades] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function runScheduledDowngradesJob(): Promise<DowngradeJobResult> {
  const result: DowngradeJobResult = {
    processed: 0,
    successful: 0,
    failed: 0,
    details: [],
  };

  const supabase = createServiceSupabaseClient();
  
  if (!supabase) {
    console.error('[ScheduledDowngrades] Could not create Supabase client');
    return result;
  }

  try {
    const now = new Date().toISOString();

    const { data: expiredSubscriptions, error: queryError } = await supabase
      .from('organization_subscriptions')
      .select(`
        id,
        organization_id,
        plan_id,
        scheduled_downgrade_plan_id,
        expires_at,
        organizations!inner (
          id,
          name
        ),
        plans!inner (
          id,
          name,
          slug
        )
      `)
      .eq('status', 'active')
      .lt('expires_at', now)
      .not('scheduled_downgrade_plan_id', 'is', null);

    if (queryError) {
      console.error('[ScheduledDowngrades] Error fetching expired subscriptions:', queryError);
      return result;
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('[ScheduledDowngrades] No expired subscriptions with scheduled downgrades found');
      return result;
    }

    console.log(`[ScheduledDowngrades] Found ${expiredSubscriptions.length} subscriptions to process`);

    for (const subscription of expiredSubscriptions) {
      result.processed++;

      const org = subscription.organizations as any;
      const currentPlan = subscription.plans as any;

      console.log(`[ScheduledDowngrades] Processing org "${org?.name}" (${subscription.organization_id})`);

      const switchResult = await executeScheduledPlanSwitch(supabase, {
        organizationId: subscription.organization_id,
        oldSubscriptionId: subscription.id,
        newPlanId: subscription.scheduled_downgrade_plan_id!,
        oldPlanId: subscription.plan_id,
      });

      const { error: logError } = await supabase
        .from('system_job_logs')
        .insert({
          organization_id: subscription.organization_id,
          subscription_id: subscription.id,
          job_type: 'execute_downgrade',
          details: {
            from_plan_id: switchResult.details.from_plan_id,
            to_plan_id: switchResult.details.to_plan_id,
            from_plan_name: switchResult.details.from_plan_name || currentPlan?.name,
            to_plan_name: switchResult.details.to_plan_name,
            new_subscription_id: switchResult.newSubscriptionId,
            organization_name: org?.name,
            original_target_plan_id: subscription.scheduled_downgrade_plan_id,
            limits_applied: switchResult.limitsApplied || null,
          },
          status: switchResult.success ? 'success' : 'error',
          error_message: switchResult.error || null,
        });

      if (logError) {
        console.error('[ScheduledDowngrades] Error logging job result:', logError);
      }

      if (switchResult.success) {
        result.successful++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          fromPlan: switchResult.details.from_plan_name || 'Unknown',
          toPlan: switchResult.details.to_plan_name || 'Unknown',
          status: 'success',
        });
        console.log(`[ScheduledDowngrades] Successfully downgraded org "${org?.name}" from ${switchResult.details.from_plan_name} to ${switchResult.details.to_plan_name}`);
      } else {
        result.failed++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          fromPlan: currentPlan?.name || 'Unknown',
          toPlan: 'Unknown',
          status: 'error',
          error: switchResult.error,
        });
        console.error(`[ScheduledDowngrades] Failed to downgrade org "${org?.name}": ${switchResult.error}`);
      }
    }

    console.log(`[ScheduledDowngrades] Completed scheduled downgrades: ${result.successful} successful, ${result.failed} failed out of ${result.processed} processed`);

    // PART 2: Process cancelled subscriptions that have expired (without scheduled downgrade)
    // These should be moved to FREE plan and have bonus course enrollments suspended
    const { data: expiredCancelledSubs, error: cancelledError } = await supabase
      .from('organization_subscriptions')
      .select(`
        id,
        organization_id,
        plan_id,
        expires_at,
        organizations!inner (
          id,
          name,
          plan_id
        ),
        plans!inner (
          id,
          name,
          slug
        )
      `)
      .eq('status', 'cancelled')
      .lt('expires_at', now)
      .is('scheduled_downgrade_plan_id', null);

    if (cancelledError) {
      console.error('[ScheduledDowngrades] Error fetching expired cancelled subscriptions:', cancelledError);
    } else if (expiredCancelledSubs && expiredCancelledSubs.length > 0) {
      console.log(`[ScheduledDowngrades] Found ${expiredCancelledSubs.length} expired cancelled subscriptions to process`);

      // Get FREE plan
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id, name')
        .eq('slug', 'free')
        .single();

      if (!freePlan) {
        console.error('[ScheduledDowngrades] FREE plan not found in database');
      } else {
        for (const sub of expiredCancelledSubs) {
          const org = sub.organizations as any;
          const currentPlan = sub.plans as any;

          // Skip if already on FREE plan
          if (currentPlan?.slug === 'free') {
            console.log(`[ScheduledDowngrades] Org "${org?.name}" already on FREE, skipping`);
            continue;
          }

          console.log(`[ScheduledDowngrades] Processing expired cancelled subscription for org "${org?.name}"`);
          result.processed++;

          try {
            // Mark old subscription as expired
            await supabase
              .from('organization_subscriptions')
              .update({
                status: 'expired',
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

            // Create FREE subscription
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 100);

            await supabase
              .from('organization_subscriptions')
              .insert({
                organization_id: sub.organization_id,
                plan_id: freePlan.id,
                payment_id: null,
                status: 'active',
                billing_period: 'annual',
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                amount: 0,
                currency: 'USD',
                scheduled_downgrade_plan_id: null,
              });

            // Update organization plan
            await supabase
              .from('organizations')
              .update({ plan_id: freePlan.id })
              .eq('id', sub.organization_id);

            // Apply plan limits (soft-lock excess resources)
            const limitsResult = await applyPlanLimits(supabase, sub.organization_id, 'Free');
            console.log(`[ScheduledDowngrades] Applied limits: ${limitsResult.projectsMarked} projects, ${limitsResult.membersMarked} members marked`);

            // Suspend bonus course enrollments
            const suspendResult = await suspendBonusCourseEnrollments(supabase, sub.organization_id);
            if (suspendResult.suspended > 0) {
              console.log(`[ScheduledDowngrades] Suspended ${suspendResult.suspended} bonus course enrollments`);
            }

            // Log the job
            await supabase
              .from('system_job_logs')
              .insert({
                organization_id: sub.organization_id,
                subscription_id: sub.id,
                job_type: 'expired_to_free',
                details: {
                  from_plan_id: sub.plan_id,
                  to_plan_id: freePlan.id,
                  from_plan_name: currentPlan?.name,
                  to_plan_name: 'Free',
                  reason: 'cancelled_subscription_expired',
                  limits_applied: {
                    projectsMarked: limitsResult.projectsMarked,
                    membersMarked: limitsResult.membersMarked,
                  },
                  enrollments_suspended: suspendResult.suspended,
                },
                status: 'success',
              });

            result.successful++;
            result.details.push({
              subscriptionId: sub.id,
              organizationId: sub.organization_id,
              fromPlan: currentPlan?.name || 'Unknown',
              toPlan: 'Free',
              status: 'success',
            });
            console.log(`[ScheduledDowngrades] Successfully moved org "${org?.name}" from ${currentPlan?.name} to Free (cancelled subscription expired)`);

          } catch (err: any) {
            result.failed++;
            result.details.push({
              subscriptionId: sub.id,
              organizationId: sub.organization_id,
              fromPlan: currentPlan?.name || 'Unknown',
              toPlan: 'Free',
              status: 'error',
              error: err.message,
            });
            console.error(`[ScheduledDowngrades] Failed to process expired cancelled subscription for org "${org?.name}":`, err);
          }
        }
      }
    } else {
      console.log('[ScheduledDowngrades] No expired cancelled subscriptions found');
    }

    console.log(`[ScheduledDowngrades] Final totals: ${result.successful} successful, ${result.failed} failed out of ${result.processed} processed`);
    return result;

  } catch (error: any) {
    console.error('[ScheduledDowngrades] Fatal error:', error);
    return result;
  }
}
