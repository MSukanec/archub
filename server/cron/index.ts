import cron from 'node-cron';
import { runSubscriptionExpiryNotifier } from './jobs/subscription-expiry-notifier.js';
import { runScheduledDowngradesJob } from './jobs/execute-scheduled-downgrades.js';

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

  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled downgrades job');
    try {
      const result = await runScheduledDowngradesJob();
      console.log('[Cron] Scheduled downgrades job completed:', result);
    } catch (error) {
      console.error('[Cron] Scheduled downgrades job failed:', error);
    }
  }, {
    timezone: 'UTC'
  });

  console.log('[Cron] Scheduled jobs initialized:');
  console.log('  - Subscription Expiry Notifier: Daily at 9:00 AM UTC');
  console.log('  - Scheduled Downgrades Executor: Hourly');
}
