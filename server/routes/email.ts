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

      const { to, subject, html, from = 'sistema@seencel.com', notifyAdmin = false } = req.body;

      if (!to || !subject || !html) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: to, subject, html'
        });
      }

      const resend = new Resend(RESEND_API_KEY);
      const adminEmail = 'matusukanec@gmail.com';

      // 1️⃣ Send email to user
      const userEmailResult = await resend.emails.send({
        from,
        to,
        subject,
        html
      });

      if (userEmailResult.error) {
        console.error('❌ Resend error (user email):', userEmailResult.error);
        return res.status(500).json({
          ok: false,
          error: userEmailResult.error.message
        });
      }

      console.log('✅ User email sent successfully:', userEmailResult.data);

      // 2️⃣ Send admin notification if requested
      let adminEmailResult = null;
      if (notifyAdmin && adminEmail !== to) {
        const adminHtml = `
          <h2>📧 Nueva Notificación de Seencel</h2>
          <p><strong>Usuario:</strong> ${to}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <hr />
          <p>${html}</p>
        `;

        adminEmailResult = await resend.emails.send({
          from,
          to: adminEmail,
          subject: `[Admin Alert] ${subject}`,
          html: adminHtml
        });

        if (adminEmailResult.error) {
          console.error('❌ Resend error (admin email):', adminEmailResult.error);
          // Don't fail the request, just log the error
        } else {
          console.log('✅ Admin notification sent:', adminEmailResult.data);
        }
      }

      return res.json({
        ok: true,
        userEmail: userEmailResult.data,
        adminEmail: adminEmailResult?.data || null
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
