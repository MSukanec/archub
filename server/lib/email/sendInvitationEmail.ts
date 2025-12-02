import { Resend } from 'resend';
import { render } from '@react-email/render';
import InvitationEmail from '../../../src/emails/InvitationEmail';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export interface SendInvitationEmailParams {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  roleName: string;
  invitationId: string;
}

export interface SendInvitationEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<SendInvitationEmailResult> {
  try {
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    const { inviteeEmail, organizationName, inviterName, roleName, invitationId } = params;

    if (!inviteeEmail || !organizationName || !invitationId) {
      return {
        success: false,
        error: 'Missing required fields: inviteeEmail, organizationName, invitationId'
      };
    }

    const resend = new Resend(RESEND_API_KEY);
    
    const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
    const invitationLink = `${baseUrl}/register?invitation=${invitationId}`;

    const emailHtml = await render(
      InvitationEmail({
        inviteeEmail,
        organizationName,
        inviterName: inviterName || 'Un administrador',
        roleName: roleName || 'Miembro',
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
      return {
        success: false,
        error: result.error.message
      };
    }

    console.log('✅ Invitation email sent to:', inviteeEmail);
    return {
      success: true,
      emailId: result.data?.id
    };
  } catch (error: any) {
    console.error('❌ Invitation email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invitation email'
    };
  }
}
