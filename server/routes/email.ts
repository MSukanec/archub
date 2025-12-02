import type { Express } from 'express';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import crypto from 'crypto';
import type { RouteDeps } from './_base';
import WelcomeEmail from '../../src/emails/WelcomeEmail';
import PurchaseEmail from '../../src/emails/PurchaseEmail';
import ContactEmail from '../../src/emails/ContactEmail';
import AdminBankTransferAlert from '../../src/emails/AdminBankTransferAlert';
import InvitationEmail from '../../src/emails/InvitationEmail';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const usedNonces = new Map<string, number>();
const NONCE_EXPIRY_MS = 15 * 60 * 1000;
const TOKEN_MIN_AGE_MS = 3000;
const TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

function cleanupExpiredNonces() {
  const now = Date.now();
  const entries = Array.from(usedNonces.entries());
  for (const [nonce, timestamp] of entries) {
    if (now - timestamp > NONCE_EXPIRY_MS) {
      usedNonces.delete(nonce);
    }
  }
}

setInterval(cleanupExpiredNonces, 60000);

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function normalizeIP(ip: string | string[] | undefined): string {
  if (!ip) return 'unknown';
  const ipString = Array.isArray(ip) ? ip[0] : ip;
  const normalized = ipString.split(',')[0].trim();
  return normalized || 'unknown';
}

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function signToken(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

function createContactToken(ip: string): { token: string; expiresIn: number } {
  if (!RESEND_API_KEY) {
    throw new Error('Token signing key not configured');
  }
  
  const issuedAt = Date.now();
  const nonce = generateNonce();
  const ipHash = hashIP(ip);
  
  const payload = JSON.stringify({ issuedAt, nonce, ipHash });
  const payloadBase64 = Buffer.from(payload).toString('base64');
  const signature = signToken(payload, RESEND_API_KEY);
  
  return {
    token: `${payloadBase64}|${signature}`,
    expiresIn: 900
  };
}

function verifyContactToken(token: string, clientIP: string): { valid: boolean; error?: string; nonce?: string } {
  if (!RESEND_API_KEY) {
    return { valid: false, error: 'Token verification not configured' };
  }
  
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token de seguridad requerido' };
  }
  
  const parts = token.split('|');
  if (parts.length !== 2) {
    return { valid: false, error: 'Token de seguridad inválido' };
  }
  
  const [payloadBase64, providedSignature] = parts;
  
  let payload: string;
  let parsed: { issuedAt: number; nonce: string; ipHash: string };
  
  try {
    payload = Buffer.from(payloadBase64, 'base64').toString('utf8');
    parsed = JSON.parse(payload);
  } catch {
    return { valid: false, error: 'Token de seguridad malformado' };
  }
  
  const expectedSignature = signToken(payload, RESEND_API_KEY);
  if (providedSignature !== expectedSignature) {
    return { valid: false, error: 'Token de seguridad inválido' };
  }
  
  const now = Date.now();
  const tokenAge = now - parsed.issuedAt;
  
  if (tokenAge < TOKEN_MIN_AGE_MS) {
    return { valid: false, error: 'Por favor, espera unos segundos antes de enviar' };
  }
  
  if (tokenAge > TOKEN_MAX_AGE_MS) {
    return { valid: false, error: 'Token expirado. Por favor, recarga la página' };
  }
  
  const clientIPHash = hashIP(clientIP);
  if (parsed.ipHash !== clientIPHash) {
    return { valid: false, error: 'Token de seguridad inválido para esta sesión' };
  }
  
  if (usedNonces.has(parsed.nonce)) {
    return { valid: false, error: 'Este formulario ya fue enviado. Por favor, recarga la página' };
  }
  
  return { valid: true, nonce: parsed.nonce };
}

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
      const adminEmail = 'contacto@seencel.com';

      // Determine email HTML based on template or raw html
      let emailHtml: string;
      
      if (template === 'welcome') {
        emailHtml = await render(
          WelcomeEmail({
            userName: userName || 'Arquitecto',
            userEmail: to,
          }) as any
        );
      } else if (template === 'purchase') {
        emailHtml = await render(
          PurchaseEmail({
            userName: userName || 'Estudiante',
            courseName: courseName || 'Curso',
            amount: amount || '$0',
            transactionId: transactionId || 'N/A',
          }) as any
        );
      } else if (html) {
        emailHtml = html;
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

  // POST /api/admin/email-preview/purchase - Preview purchase email
  app.post('/api/admin/email-preview/purchase', async (req, res) => {
    try {
      const {
        userName = 'Jorge Benitest',
        courseName = 'Curso Avanzado de Construcción',
        amount = '$99.99',
        transactionId = 'TXN-20241128-001',
      } = req.body;
      
      const emailHtml = await render(
        PurchaseEmail({
          userName,
          courseName,
          amount,
          transactionId,
        }) as any
      );

      return res.json({
        ok: true,
        type: 'purchase',
        html: emailHtml,
        preview: {
          subject: `Confirmación de Compra: ${courseName}`,
          from: 'Seencel <sistema@seencel.com>',
          to: 'student@example.com',
        }
      });
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/email-preview/bank-transfer-admin - Preview admin bank transfer alert
  app.post('/api/admin/email-preview/bank-transfer-admin', async (req, res) => {
    try {
      const {
        userName = 'Juan Pérez',
        userEmail = 'juan.perez@example.com',
        courseName = 'Curso de Gestión de Proyectos',
        amount = '85000',
        currency = 'ARS',
        transferId = 'btp-abc123',
      } = req.body;
      
      const emailHtml = await render(
        AdminBankTransferAlert({
          userName,
          userEmail,
          courseName,
          amount,
          currency,
          transferId,
        }) as any
      );

      return res.json({
        ok: true,
        type: 'bank-transfer-admin',
        html: emailHtml,
        preview: {
          subject: `🏦 Nueva Transferencia Pendiente - ${userName}`,
          from: 'Seencel <sistema@seencel.com>',
          to: 'contacto@seencel.com',
        }
      });
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/email-preview/invitation - Preview organization invitation email
  app.post('/api/admin/email-preview/invitation', async (req, res) => {
    try {
      const {
        inviteeEmail = 'invitado@example.com',
        organizationName = 'Constructora ABC',
        inviterName = 'Juan Pérez',
        roleName = 'Miembro',
        adminName = 'El Equipo de Seencel',
      } = req.body;

      const invitationLink = `https://seencel.com/register?invitation=preview-token`;
      
      const emailHtml = await render(
        InvitationEmail({
          inviteeEmail,
          organizationName,
          inviterName,
          roleName,
          invitationLink,
          adminName,
        }) as any
      );

      return res.json({
        ok: true,
        type: 'invitation',
        html: emailHtml,
        preview: {
          subject: `Te invitaron a unirte a ${organizationName} en Seencel`,
          from: 'Seencel <sistema@seencel.com>',
          to: inviteeEmail,
        }
      });
    } catch (error: any) {
      console.error('❌ Preview error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/email/send-invitation - Send organization invitation email
  app.post('/api/email/send-invitation', async (req, res) => {
    try {
      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        return res.status(500).json({
          ok: false,
          error: 'Email service not configured'
        });
      }

      const { 
        inviteeEmail,
        organizationName,
        inviterName,
        roleName = 'Miembro',
        invitationId,
      } = req.body;

      if (!inviteeEmail || !organizationName || !invitationId) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required fields: inviteeEmail, organizationName, invitationId'
        });
      }

      const resend = new Resend(RESEND_API_KEY);
      
      const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
      const invitationLink = `${baseUrl}/register?invitation=${invitationId}`;

      const emailHtml = await render(
        InvitationEmail({
          inviteeEmail,
          organizationName,
          inviterName: inviterName || 'Un administrador',
          roleName,
          invitationLink,
          adminName: 'El Equipo de Seencel',
        }) as any
      );

      const result = await resend.emails.send({
        from: 'Seencel <sistema@seencel.com>',
        to: inviteeEmail,
        subject: `Te invitaron a unirte a ${organizationName} en Seencel`,
        html: emailHtml
      });

      if (result.error) {
        console.error('❌ Resend error (invitation email):', result.error);
        return res.status(500).json({
          ok: false,
          error: result.error.message
        });
      }

      console.log('✅ Invitation email sent to:', inviteeEmail);
      return res.json({
        ok: true,
        emailId: result.data?.id
      });
    } catch (error: any) {
      console.error('❌ Invitation email error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Failed to send invitation email'
      });
    }
  });

  // POST /api/email/admin-bank-transfer-alert - Send admin notification for bank transfer
  // This endpoint is called from Supabase Edge Function when a new bank transfer is created
  // It ONLY sends to admin, never to the user
  app.post('/api/email/admin-bank-transfer-alert', async (req, res) => {
    try {
      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        return res.status(500).json({
          ok: false,
          error: 'Email service not configured'
        });
      }

      const { 
        userName,
        userEmail,
        courseName,
        amount,
        currency = 'ARS',
        transferId,
      } = req.body;

      if (!transferId) {
        return res.status(400).json({
          ok: false,
          error: 'Missing required field: transferId'
        });
      }

      const resend = new Resend(RESEND_API_KEY);
      const adminEmail = 'contacto@seencel.com';

      const emailHtml = await render(
        AdminBankTransferAlert({
          userName: userName || 'Cliente',
          userEmail: userEmail || 'N/A',
          courseName: courseName || 'Curso',
          amount: amount || '0',
          currency,
          transferId,
        }) as any
      );

      const result = await resend.emails.send({
        from: 'Seencel <sistema@seencel.com>',
        to: adminEmail,
        subject: `🏦 Nueva Transferencia Pendiente - ${userName || 'Cliente'}`,
        html: emailHtml
      });

      if (result.error) {
        console.error('❌ Resend error (admin bank transfer alert):', result.error);
        return res.status(500).json({
          ok: false,
          error: result.error.message
        });
      }

      return res.json({
        ok: true,
        emailId: result.data?.id
      });
    } catch (error: any) {
      console.error('❌ Admin bank transfer alert error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Failed to send admin notification'
      });
    }
  });

  // Simple in-memory rate limiting for contact form
  const contactRateLimit = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const RATE_LIMIT_MAX = 3; // Max 3 submissions per minute per IP

  // GET /api/contact/token - Generate signed submission token
  app.get('/api/contact/token', (req, res) => {
    try {
      const clientIP = normalizeIP(req.ip || req.headers['x-forwarded-for']);
      const tokenData = createContactToken(clientIP);
      
      return res.json(tokenData);
    } catch (error: any) {
      console.error('❌ Token generation error:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error al generar token de seguridad'
      });
    }
  });

  // POST /api/contact - Public contact form endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const { firstName, lastName, email, company, phone, country, message, formStartTime, submittedAt, honeypot, contactToken } = req.body;

      // Anti-spam: Honeypot must be present and empty
      if (typeof honeypot !== 'string' || honeypot.length > 0) {
        console.warn('⚠️ Honeypot validation failed - likely bot');
        return res.status(400).json({
          ok: false,
          error: 'Validación de seguridad fallida'
        });
      }

      // Rate limiting by IP (normalize to handle proxy forwarding consistently)
      const clientIP = normalizeIP(req.ip || req.headers['x-forwarded-for']);
      const ipKey = clientIP;

      // Verify signed submission token (but don't consume yet - wait for validation to pass)
      const tokenResult = verifyContactToken(contactToken, ipKey);
      if (!tokenResult.valid) {
        console.warn('⚠️ Token validation failed:', tokenResult.error);
        return res.status(400).json({
          ok: false,
          error: tokenResult.error
        });
      }

      const now = Date.now();
      
      if (!contactRateLimit.has(ipKey)) {
        contactRateLimit.set(ipKey, []);
      }
      
      const timestamps = contactRateLimit.get(ipKey)!;
      const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
      
      if (recentTimestamps.length >= RATE_LIMIT_MAX) {
        console.warn('⚠️ Rate limit exceeded for IP:', ipKey);
        return res.status(429).json({
          ok: false,
          error: 'Demasiados intentos. Por favor, espera un momento.'
        });
      }
      
      recentTimestamps.push(now);
      contactRateLimit.set(ipKey, recentTimestamps);

      // Anti-spam: Time-based validation - timestamps optional but checked if present
      // This is a soft defense layer - rate limiting and honeypot are the primary protections
      if (typeof formStartTime === 'number' && typeof submittedAt === 'number') {
        const clientTimeTaken = submittedAt - formStartTime;
        // Reject if form was submitted too quickly (less than 3 seconds)
        if (clientTimeTaken < 3000) {
          console.warn('⚠️ Potential bot detected - form submitted too quickly');
          return res.status(400).json({
            ok: false,
            error: 'Por favor, espera unos segundos antes de enviar'
          });
        }
        
        // Only check timestamp sanity with generous tolerance for clock skew
        const serverNow = Date.now();
        const maxClockSkew = 5 * 60 * 1000; // 5 minutes tolerance for clock differences
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours max
        
        // Only reject extremely suspicious timestamps (not minor clock skew)
        if (serverNow - formStartTime > maxAge || formStartTime > serverNow + maxClockSkew) {
          console.warn('⚠️ Invalid timestamps detected - form age or future timestamp');
          return res.status(400).json({
            ok: false,
            error: 'Por favor, recarga la página e intenta de nuevo'
          });
        }
      }

      // Validation with clear field requirements
      if (!firstName || typeof firstName !== 'string' || firstName.length < 2 || firstName.length > 100) {
        return res.status(400).json({ ok: false, error: 'Nombre inválido (2-100 caracteres)' });
      }
      if (!lastName || typeof lastName !== 'string' || lastName.length < 2 || lastName.length > 100) {
        return res.status(400).json({ ok: false, error: 'Apellido inválido (2-100 caracteres)' });
      }
      if (!phone || typeof phone !== 'string' || phone.length < 6 || phone.length > 30) {
        return res.status(400).json({ ok: false, error: 'Teléfono inválido' });
      }
      
      // Country validation with allowed ISO codes (matching frontend)
      const allowedCountryCodes = [
        'AR', 'MX', 'CO', 'CL', 'PE', 'EC', 'UY', 'PY', 'BO', 'VE', 'BR', 'ES', 'US', 'OTHER'
      ];
      if (!country || typeof country !== 'string' || !allowedCountryCodes.includes(country)) {
        return res.status(400).json({ ok: false, error: 'País inválido' });
      }
      
      if (!message || typeof message !== 'string' || message.length < 10 || message.length > 2000) {
        return res.status(400).json({ ok: false, error: 'Mensaje inválido (10-2000 caracteres)' });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
        return res.status(400).json({
          ok: false,
          error: 'Email inválido'
        });
      }

      // CRITICAL: Mark nonce as used AFTER all validation passes but BEFORE any async operations
      // This prevents replay attacks while allowing users to fix validation errors and retry
      if (tokenResult.nonce) {
        usedNonces.set(tokenResult.nonce, Date.now());
      }

      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not configured');
        return res.status(500).json({
          ok: false,
          error: 'Email service not configured'
        });
      }

      const resend = new Resend(RESEND_API_KEY);

      // Render the contact email template
      const emailHtml = await render(
        ContactEmail({
          firstName,
          lastName,
          email,
          company: company || '',
          phone,
          country,
          message,
        }) as any
      );

      // Send email to contact@seencel.com
      const result = await resend.emails.send({
        from: 'Seencel Formulario <sistema@seencel.com>',
        to: ['contacto@seencel.com'],
        replyTo: email,
        subject: `Nuevo contacto: ${firstName} ${lastName}${company ? ` - ${company}` : ''}`,
        html: emailHtml,
      });

      if (result.error) {
        console.error('❌ Resend error:', result.error);
        return res.status(500).json({
          ok: false,
          error: 'Error al enviar el mensaje'
        });
      }

      return res.json({ ok: true, message: 'Mensaje enviado exitosamente' });
    } catch (error: any) {
      console.error('❌ Contact form error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Error al procesar el formulario'
      });
    }
  });

  // POST /api/webhooks/test-email - Test email connection
  app.post('/api/webhooks/test-email', async (req, res) => {
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
        to: ['contacto@seencel.com'],
        subject: 'Prueba de conexión Express + Resend 🚀',
        html: '<p>¡Funciona! Tu backend Express en Replit puede enviar correos.</p>'
      });

      return res.status(200).json({ message: 'Test exitoso', data });
    } catch (error: any) {
      console.error('❌ Error sending test email:', error);
      return res.status(500).json({ error: error.message });
    }
  });
}
