import { Request, Response } from 'express';
import { db } from '../../db.js';
import { eq, inArray, isNotNull, and } from 'drizzle-orm';
import { 
  payments, 
  payment_events, 
  mp_subscription_preferences, 
  organization_subscriptions,
  organizations,
  projects,
  organization_members,
  course_lesson_progress,
  plans
} from '../../../shared/schema.js';

interface ResetTestDataBody {
  organizationId: string;
  userId?: string;
}

export async function resetTestData(req: Request, res: Response) {
  try {
    const { organizationId, userId } = req.body as ResetTestDataBody;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    // Validate Free plan exists first
    const freePlan = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, 'free'))
      .limit(1);

    if (!freePlan[0]?.id) {
      return res.status(500).json({ error: 'Free plan not found in database' });
    }

    const freePlanId = freePlan[0].id;
    const deletedRecords: Record<string, number> = {};

    // 1. Get all provider_payment_ids for this organization first
    const orgPayments = await db
      .select({ id: payments.id, provider_payment_id: payments.provider_payment_id })
      .from(payments)
      .where(eq(payments.organization_id, organizationId));
    
    const providerPaymentIds = orgPayments
      .map(p => p.provider_payment_id)
      .filter((id): id is string => id !== null);

    // 2. Delete payment_events for those payments (by provider_payment_id)
    if (providerPaymentIds.length > 0) {
      const deletedEvents = await db
        .delete(payment_events)
        .where(inArray(payment_events.provider_payment_id, providerPaymentIds))
        .returning({ id: payment_events.id });
      deletedRecords.payment_events = deletedEvents.length;
    } else {
      deletedRecords.payment_events = 0;
    }

    // 3. Delete payments for this organization
    const deletedPayments = await db
      .delete(payments)
      .where(eq(payments.organization_id, organizationId))
      .returning({ id: payments.id });
    deletedRecords.payments = deletedPayments.length;

    // 4. Delete mp_subscription_preferences for this organization
    const deletedMpPrefs = await db
      .delete(mp_subscription_preferences)
      .where(eq(mp_subscription_preferences.organization_id, organizationId))
      .returning({ id: mp_subscription_preferences.id });
    deletedRecords.mp_subscription_preferences = deletedMpPrefs.length;

    // 5. Delete organization_subscriptions for this organization
    const deletedSubs = await db
      .delete(organization_subscriptions)
      .where(eq(organization_subscriptions.organization_id, organizationId))
      .returning({ id: organization_subscriptions.id });
    deletedRecords.organization_subscriptions = deletedSubs.length;

    // 6. Delete course_lesson_progress for the user (only if valid userId provided)
    if (userId && userId.trim() !== '') {
      const deletedProgress = await db
        .delete(course_lesson_progress)
        .where(eq(course_lesson_progress.user_id, userId))
        .returning({ id: course_lesson_progress.id });
      deletedRecords.course_lesson_progress = deletedProgress.length;
    }

    // 7. Reset organization: plan_id to Free
    await db
      .update(organizations)
      .set({ plan_id: freePlanId })
      .where(eq(organizations.id, organizationId));
    deletedRecords.organization_reset = 1;

    // 9. Reset is_over_limit on projects
    const updatedProjects = await db
      .update(projects)
      .set({ is_over_limit: false })
      .where(eq(projects.organization_id, organizationId))
      .returning({ id: projects.id });
    deletedRecords.projects_reset = updatedProjects.length;

    // 10. Reset is_over_limit on organization_members
    const updatedMembers = await db
      .update(organization_members)
      .set({ is_over_limit: false })
      .where(eq(organization_members.organization_id, organizationId))
      .returning({ id: organization_members.id });
    deletedRecords.members_reset = updatedMembers.length;

    return res.json({
      success: true,
      message: 'Test data reset successfully',
      deletedRecords
    });

  } catch (error) {
    console.error('Error resetting test data:', error);
    return res.status(500).json({ 
      error: 'Failed to reset test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
