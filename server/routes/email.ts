import type { Express } from 'express';
import { Resend } from 'resend';
import type { RouteDeps } from './_base';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export function registerEmailRoutes(app: Express, deps: RouteDeps): void {
  // POST /api/email/send - Send email via Resend
  app.post('/api/email/send', async (req, res) => {
    try {
      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        return res.status(500).json({
          ok: false,
          error: 'Email service not configured'
        });
      }

      const { to, subject, html, from = 'noreply@seencel.com' } = req.body;

      if (!to || !subject || !html) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: to, subject, html'
        });
      }

      const resend = new Resend(RESEND_API_KEY);

      const result = await resend.emails.send({
        from,
        to,
        subject,
        html
      });

      if (result.error) {
        console.error('❌ Resend error:', result.error);
        return res.status(500).json({
          ok: false,
          error: result.error.message
        });
      }

      console.log('✅ Email sent successfully:', result.data);
      return res.json({
        ok: true,
        data: result.data
      });
    } catch (error: any) {
      console.error('❌ Email route error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Failed to send email'
      });
    }
  });
}
