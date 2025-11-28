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

      const { to, subject, html, from = 'sistema@seencel.com' } = req.body;

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

  // POST /api/webhooks/test-email - Test email connection
  app.post('/api/webhooks/test-email', async (req, res) => {
    console.log('🔔 Test email webhook received!');

    try {
      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        return res.status(500).json({
          error: 'Email service not configured'
        });
      }

      const resend = new Resend(RESEND_API_KEY);

      const data = await resend.emails.send({
        from: 'Seencel System <sistema@seencel.com>',
        to: ['matusukanec@gmail.com'],
        subject: 'Prueba de conexión Express + Resend 🚀',
        html: '<p>¡Funciona! Tu backend Express en Replit puede enviar correos.</p>'
      });

      console.log('✅ Test email sent:', data);
      return res.status(200).json({ message: 'Test exitoso', data });
    } catch (error: any) {
      console.error('❌ Error sending test email:', error);
      return res.status(500).json({ error: error.message });
    }
  });
}
