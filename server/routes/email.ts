import type { Express } from 'express';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { RouteDeps } from './_base';
import WelcomeEmail from '../../emails/WelcomeEmail';
import PurchaseEmail from '../../emails/PurchaseEmail';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export function registerEmailRoutes(app: Express, deps: RouteDeps): void {
  // POST /api/email/send - Send email via Resend
  // Supports: template="welcome"|"purchase" OR raw html
  app.post('/api/email/send', async (req, res) => {
    try {
      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        return res.status(500).json({
          ok: false,
          error: 'Email service not configured'
        });
      }

      const { 
        to, 
        subject, 
        html, 
        template,
        userName,
        courseName,
        amount,
        transactionId,
        from = 'Seencel <sistema@seencel.com>', 
        notifyAdmin = false 
      } = req.body;

      if (!to || !subject) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: to, subject'
        });
      }

      const resend = new Resend(RESEND_API_KEY);
      const adminEmail = 'matusukanec@gmail.com';

      // Determine email HTML based on template or raw html
      let emailHtml: string;
      
      if (template === 'welcome') {
        emailHtml = await render(
          WelcomeEmail({
            userName: userName || 'Arquitecto',
            userEmail: to,
          }) as any
        );
        console.log('📧 Using WelcomeEmail template');
      } else if (template === 'purchase') {
        emailHtml = await render(
          PurchaseEmail({
            userName: userName || 'Estudiante',
            courseName: courseName || 'Curso',
            amount: amount || '$0',
            transactionId: transactionId || 'N/A',
          }) as any
        );
        console.log('📧 Using PurchaseEmail template');
      } else if (html) {
        emailHtml = html;
        console.log('📧 Using raw HTML');
      } else {
        return res.status(400).json({
          ok: false,
          error: 'Either template or html must be provided'
        });
      }

      // 1️⃣ Send email to user
      const userEmailResult = await resend.emails.send({
        from,
        to,
        subject,
        html: emailHtml
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
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">📧 Nueva Notificación de Seencel</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Asunto:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Tipo:</strong> ${template || 'Custom HTML'}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            ${emailHtml}
          </div>
        `;

        adminEmailResult = await resend.emails.send({
          from,
          to: adminEmail,
          subject: `[Admin] ${subject}`,
          html: adminHtml
        });

        if (adminEmailResult.error) {
          console.error('❌ Resend error (admin email):', adminEmailResult.error);
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

  // POST /api/admin/email-preview/registration - Preview registration email
  app.post('/api/admin/email-preview/registration', async (req, res) => {
    try {
      const { userName = 'Jorge Benitest', userEmail = 'jorge@example.com', adminName = 'El Equipo de Seencel' } = req.body;
      
      const emailHtml = await render(
        WelcomeEmail({
          userName,
          userEmail,
          adminName,
        }) as any
      );

      return res.json({
        ok: true,
        type: 'registration',
        html: emailHtml,
        preview: {
          subject: `¡Bienvenido a Seencel, ${userName}!`,
          from: 'Seencel <sistema@seencel.com>',
          to: userEmail,
        }
      });
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // GET /api/admin/courses-for-preview - Get courses for email preview
  app.get('/api/admin/courses-for-preview', async (req, res) => {
    try {
      const courses = await deps.storage.getCourses?.() || [];
      return res.json({
        ok: true,
        data: courses.slice(0, 5) // Get last 5 courses
      });
    } catch (error: any) {
      console.error('❌ Error fetching courses:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  // POST /api/admin/email-preview/purchase - Preview purchase email
  app.post('/api/admin/email-preview/purchase', async (req, res) => {
    try {
      const {
        userName = 'Jorge Benitest',
        courseName = 'Curso Avanzado de Construcción',
        amount = '$99.99',
        transactionId = 'TXN-20241128-001',
        courseId = null
      } = req.body;
      
      // If courseId is provided, fetch actual course data
      let finalCourseName = courseName;
      let finalAmount = amount;
      
      if (courseId && deps.storage.getCourseById) {
        const course = await deps.storage.getCourseById(courseId);
        if (course) {
          finalCourseName = course.title || courseName;
          finalAmount = course.price ? `$${course.price}` : amount;
        }
      }
      
      const emailHtml = await render(
        PurchaseEmail({
          userName,
          courseName: finalCourseName,
          amount: finalAmount,
          transactionId,
        }) as any
      );

      return res.json({
        ok: true,
        type: 'purchase',
        html: emailHtml,
        preview: {
          subject: `Confirmación de Compra: ${finalCourseName}`,
          from: 'Seencel <sistema@seencel.com>',
          to: 'student@example.com',
        }
      });
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      return res.status(500).json({ error: error.message });
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
