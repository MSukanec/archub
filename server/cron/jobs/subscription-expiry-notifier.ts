import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createClient } from '@supabase/supabase-js';
import SubscriptionExpiryEmail from '../../../src/emails/SubscriptionExpiryEmail.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type NotificationType = '7_days_before' | '3_days_before' | '1_day_before' | 'expired';

interface NotificationResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
  details: Array<{
    subscriptionId: string;
    organizationId: string;
    type: NotificationType;
    status: 'sent' | 'skipped' | 'error';
    recipients?: string[];
    reason?: string;
  }>;
}

function createServiceSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getDaysRemaining(expiresAt: Date): number {
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNotificationType(daysRemaining: number): NotificationType | null {
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining === 1) return '1_day_before';
  if (daysRemaining <= 3) return '3_days_before';
  if (daysRemaining <= 7) return '7_days_before';
  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatExpiresAtKey(expiresAt: Date): string {
  return expiresAt.toISOString().split('T')[0];
}

export async function runSubscriptionExpiryNotifier(): Promise<NotificationResult> {
  const result: NotificationResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  if (!RESEND_API_KEY) {
    console.error('[SubscriptionNotifier] RESEND_API_KEY not configured');
    return result;
  }

  const supabase = createServiceSupabaseClient();
  const resend = new Resend(RESEND_API_KEY);

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: subscriptions, error: subError } = await supabase
      .from('organization_subscriptions')
      .select(`
        id,
        organization_id,
        plan_id,
        status,
        expires_at,
        organizations!inner (
          id,
          name,
          organization_members!inner (
            user_id,
            role,
            is_active,
            users!inner (
              id,
              email,
              first_name,
              last_name
            )
          )
        ),
        plans!inner (
          id,
          name,
          slug
        )
      `)
      .eq('status', 'active')
      .lte('expires_at', sevenDaysFromNow.toISOString())
      .gte('expires_at', now.toISOString())
      .order('expires_at', { ascending: true });

    if (subError) {
      console.error('[SubscriptionNotifier] Error fetching subscriptions:', subError);
      return result;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[SubscriptionNotifier] No subscriptions expiring within 7 days');
      return result;
    }

    console.log(`[SubscriptionNotifier] Found ${subscriptions.length} subscriptions to check`);

    for (const subscription of subscriptions) {
      result.processed++;

      const expiresAt = new Date(subscription.expires_at);
      const daysRemaining = getDaysRemaining(expiresAt);
      const notificationType = getNotificationType(daysRemaining);

      if (!notificationType) {
        result.skipped++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          type: '7_days_before',
          status: 'skipped',
          reason: 'Not within notification window',
        });
        continue;
      }

      const expiresAtKey = formatExpiresAtKey(expiresAt);
      const notificationKey = `${notificationType}_${expiresAtKey}`;

      const { data: existingNotifications, error: checkError } = await supabase
        .from('subscription_notifications_log')
        .select('id, notification_type')
        .eq('subscription_id', subscription.id)
        .eq('notification_type', notificationType);

      if (checkError) {
        console.error('[SubscriptionNotifier] Error checking existing notification:', checkError);
        result.errors++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          type: notificationType,
          status: 'error',
          reason: `Check error: ${checkError.message}`,
        });
        continue;
      }

      if (existingNotifications && existingNotifications.length > 0) {
        result.skipped++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          type: notificationType,
          status: 'skipped',
          reason: 'Already notified for this period',
        });
        continue;
      }

      const org = subscription.organizations as any;
      const members = org?.organization_members || [];
      
      const adminMembers = members.filter(
        (m: any) => m.is_active && (m.role === 'owner' || m.role === 'admin') && m.users?.email
      );

      if (adminMembers.length === 0) {
        const anyActiveMember = members.find((m: any) => m.is_active && m.users?.email);
        if (anyActiveMember) {
          adminMembers.push(anyActiveMember);
        }
      }

      if (adminMembers.length === 0) {
        result.skipped++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          type: notificationType,
          status: 'skipped',
          reason: 'No active members with email found',
        });
        continue;
      }

      const planData = subscription.plans as any;
      const recipientEmails: string[] = [];
      let emailSentSuccessfully = false;

      for (const member of adminMembers) {
        const adminUser = member.users;
        const userName = adminUser.first_name 
          ? `${adminUser.first_name}${adminUser.last_name ? ' ' + adminUser.last_name : ''}`
          : 'Usuario';

        try {
          const emailHtml = await render(
            SubscriptionExpiryEmail({
              userName,
              organizationName: org.name || 'Tu Organización',
              planName: planData?.name || 'Pro',
              expiresAt: formatDate(expiresAt),
              daysRemaining: Math.max(0, daysRemaining),
              renewUrl: 'https://seencel.com/settings/pricing-plan',
            }) as any
          );

          const subjectPrefix = daysRemaining <= 1 
            ? '⚠️ URGENTE: ' 
            : daysRemaining <= 3 
              ? '⚠️ ' 
              : '';

          const emailResult = await resend.emails.send({
            from: 'Seencel <sistema@seencel.com>',
            to: adminUser.email,
            subject: `${subjectPrefix}Tu suscripción ${planData?.name || 'Pro'} vence ${daysRemaining <= 0 ? 'hoy' : `en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''}`}`,
            html: emailHtml,
          });

          if (emailResult.error) {
            console.error(`[SubscriptionNotifier] Email send error to ${adminUser.email}:`, emailResult.error);
          } else {
            recipientEmails.push(adminUser.email);
            emailSentSuccessfully = true;
            console.log(`[SubscriptionNotifier] Sent ${notificationType} notification to ${adminUser.email} for org ${org.name}`);
          }

        } catch (emailError: any) {
          console.error(`[SubscriptionNotifier] Error sending email to ${adminUser.email}:`, emailError);
        }
      }

      if (emailSentSuccessfully) {
        const { error: logError } = await supabase
          .from('subscription_notifications_log')
          .insert({
            subscription_id: subscription.id,
            notification_type: notificationType,
            sent_at: new Date().toISOString(),
          });

        if (logError) {
          console.error('[SubscriptionNotifier] Error logging notification:', logError);
        }

        result.sent++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          type: notificationType,
          status: 'sent',
          recipients: recipientEmails,
        });
      } else {
        result.errors++;
        result.details.push({
          subscriptionId: subscription.id,
          organizationId: subscription.organization_id,
          type: notificationType,
          status: 'error',
          reason: 'Failed to send to any recipient',
        });
      }
    }

    console.log(`[SubscriptionNotifier] Completed: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`);
    return result;

  } catch (error: any) {
    console.error('[SubscriptionNotifier] Fatal error:', error);
    return result;
  }
}
