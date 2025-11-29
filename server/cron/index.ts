import cron from 'node-cron';
import { runSubscriptionExpiryNotifier } from './jobs/subscription-expiry-notifier.js';

export function initializeCronJobs(): void {
  console.log('[Cron] Initializing scheduled jobs...');

  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running subscription expiry notifier job at 9:00 AM UTC');
    try {
      const result = await runSubscriptionExpiryNotifier();
      console.log('[Cron] Subscription expiry notifier completed:', result);
    } catch (error) {
      console.error('[Cron] Subscription expiry notifier failed:', error);
    }
  }, {
    timezone: 'UTC'
  });

  console.log('[Cron] Scheduled jobs initialized:');
  console.log('  - Subscription Expiry Notifier: Daily at 9:00 AM UTC');
}
