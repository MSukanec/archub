import { Request, Response } from 'express';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createHmac, timingSafeEqual } from 'crypto';
import { getAdminClient } from '../../../routes/_base.js';
import { extractToken, createAuthenticatedClient } from '../../auth/helpers.js';
import PortalAccessEmail from '../../../../src/emails/PortalAccessEmail.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.VITE_APP_URL || 'https://seencel.com';
const PORTAL_TOKEN_SECRET = process.env.PORTAL_TOKEN_SECRET || process.env.SESSION_SECRET || 'default-dev-secret-change-in-production';

interface PortalAccessToken {
  projectId: string;
  projectClientId: string;
  contactId: string;
  exp: number;
}

function signPayload(payload: string): string {
  return createHmac('sha256', PORTAL_TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
}

function generatePortalToken(data: Omit<PortalAccessToken, 'exp'>): string {
  const payload: PortalAccessToken = {
    ...data,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function parsePortalToken(token: string): PortalAccessToken | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) {
      console.error('[PortalToken] Invalid token format - missing parts');
      return null;
    }
    
    const expectedSignature = signPayload(payloadBase64);
    if (!safeCompare(signature, expectedSignature)) {
      console.error('[PortalToken] Invalid signature');
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) {
      console.error('[PortalToken] Token expired');
      return null;
    }
    return payload;
  } catch (error) {
    console.error('[PortalToken] Parse error:', error);
    return null;
  }
}

export async function handleSendPortalAccess(req: Request, res: Response) {
  try {
    const { projectClientId } = req.params;
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!projectClientId) {
      return res.status(400).json({ error: 'projectClientId is required' });
    }
    
    const supabase = getAdminClient();
    const authenticatedClient = createAuthenticatedClient(token);
    
    const { data: { user }, error: authError } = await authenticatedClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
      
    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const { data: projectClient, error: clientError } = await supabase
      .from('project_clients')
      .select(`
        id,
        project_id,
        contact_id,
        organization_id,
        contact:contacts!left (
          id,
          first_name,
          last_name,
          full_name,
          email
        ),
        project:projects!left (
          id,
          name,
          organization_id,
          organization:organizations!left (
            id,
            name
          )
        )
      `)
      .eq('id', projectClientId)
      .eq('is_deleted', false)
      .single();
      
    if (clientError || !projectClient) {
      console.error('Error fetching project client:', clientError);
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const contact = projectClient.contact as any;
    const project = projectClient.project as any;
    const organization = project?.organization as any;
    
    if (!contact?.email) {
      return res.status(400).json({ 
        error: 'El cliente no tiene email registrado',
        code: 'NO_EMAIL'
      });
    }
    
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', project.organization_id)
      .eq('user_id', dbUser.id)
      .eq('is_active', true)
      .maybeSingle();
      
    if (!membership) {
      return res.status(403).json({ error: 'Not authorized to send portal access' });
    }
    
    const portalToken = generatePortalToken({
      projectId: project.id,
      projectClientId: projectClient.id,
      contactId: contact.id,
    });
    
    const accessLink = `${BASE_URL}/portal/auth/callback?token=${portalToken}`;
    
    const clientName = contact.full_name || 
      `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
      'Cliente';
    
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }
    
    const resend = new Resend(RESEND_API_KEY);
    
    const emailHtml = await render(
      PortalAccessEmail({
        clientName,
        projectName: project.name,
        organizationName: organization?.name || 'Tu constructora',
        accessLink,
        expiresIn: '24 horas',
      }) as any
    );
    
    const result = await resend.emails.send({
      from: 'Seencel <sistema@seencel.com>',
      to: contact.email,
      subject: `Acceso a tu portal de proyecto: ${project.name}`,
      html: emailHtml,
    });
    
    if (result.error) {
      console.error('❌ Resend error (portal access):', result.error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: result.error.message 
      });
    }
    
    console.log('✅ Portal access email sent to:', contact.email);
    
    return res.status(200).json({
      success: true,
      emailId: result.data?.id,
      sentTo: contact.email,
    });
    
  } catch (error: any) {
    console.error('❌ Send portal access error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to send portal access' 
    });
  }
}
