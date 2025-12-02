import { Request, Response } from "express";
import { supabaseAdmin } from "../../../supabase/admin.js";
import { decodeExternalReference, extractMetadata } from "./encoding.js";
import { getMPPayment } from "./api.js";
import { sendInvitationEmail } from "../../../email/sendInvitationEmail.js";
import { updateSubscriptionForNewSeat } from "./updateSeatSubscription.js";

export async function handleSeatReturn(req: Request, res: Response) {
  const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
  
  try {
    const { payment_id, status, external_reference } = req.query;

    console.log('[MP seat-return] Received:', { payment_id, status, external_reference });

    if (status !== 'approved' || !payment_id) {
      console.log('[MP seat-return] Payment not approved or missing ID');
      return res.redirect(`${baseUrl}/organization/members?payment=failed`);
    }

    const payment = await getMPPayment(String(payment_id));
    
    if (!payment || payment.status !== 'approved') {
      console.log('[MP seat-return] Payment not approved:', payment?.status);
      return res.redirect(`${baseUrl}/organization/members?payment=failed`);
    }

    const decoded = decodeExternalReference(String(external_reference || payment.external_reference)) as any;
    const metadata = extractMetadata(payment);
    
    const authId = decoded.auth_id || decoded.user_id || metadata.user_id || null;
    const organizationId = decoded.organization_id || metadata.organization_id || null;
    const inviteeEmail = (payment.metadata?.invitee_email || decoded.invitee_email) as string | null;
    const roleId = (payment.metadata?.role_id || decoded.role_id) as string | null;
    const productType = decoded.product_type || metadata.product_type || null;
    const subscriptionId = (payment.metadata?.subscription_id || decoded.subscription_id) as string | null;
    const billingPeriod = (payment.metadata?.billing_period || decoded.billing_period || 'monthly') as 'monthly' | 'annual';

    console.log('[MP seat-return] Decoded data:', { 
      authId, 
      organizationId, 
      inviteeEmail, 
      roleId,
      productType 
    });

    if (productType !== 'seat' || !organizationId || !inviteeEmail || !roleId) {
      console.error('[MP seat-return] Missing required data');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_data`);
    }

    const { data: existingPayment, error: existingError } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('gateway', 'mercadopago')
      .eq('gateway_payment_id', String(payment_id))
      .maybeSingle();

    if (existingPayment) {
      console.log('[MP seat-return] Payment already processed:', existingPayment.id);
      return res.redirect(`${baseUrl}/organization/members?payment=success`);
    }

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !dbUser) {
      console.error('[MP seat-return] User lookup failed:', userError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=user_not_found`);
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('[MP seat-return] Organization lookup failed:', orgError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=org_not_found`);
    }

    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('[MP seat-return] Role lookup failed:', roleError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=role_not_found`);
    }

    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: dbUser.id,
        organization_id: organizationId,
        product_type: 'seat',
        product_id: roleId,
        gateway: 'mercadopago',
        gateway_payment_id: String(payment_id),
        amount: payment.transaction_amount,
        currency: payment.currency_id || 'ARS',
        status: 'completed',
        metadata: {
          invitee_email: inviteeEmail,
          role_id: roleId,
          role_name: role.name,
          organization_name: org.name,
        },
      });

    if (paymentError) {
      console.error('[MP seat-return] Payment insert failed:', paymentError);
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, auth_id')
      .eq('email', inviteeEmail.toLowerCase())
      .maybeSingle();

    const { data: inviterMember } = await supabaseAdmin
      .from('organization_members')
      .select('id, users!left(first_name, last_name)')
      .eq('user_id', dbUser.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle();

    const inviterUser = (inviterMember as any)?.users;
    const inviterName = inviterUser?.first_name && inviterUser?.last_name 
      ? `${inviterUser.first_name} ${inviterUser.last_name}`
      : inviterUser?.first_name || 'Un administrador';

    const { data: existingInvitation, error: invitationCheckError } = await supabaseAdmin
      .from('organization_invitations')
      .select('id, status')
      .eq('email', inviteeEmail.toLowerCase())
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingInvitation) {
      const { error: updateError } = await supabaseAdmin
        .from('organization_invitations')
        .update({
          status: 'pending',
          role_id: roleId,
          accepted_at: null,
          updated_at: new Date().toISOString(),
          user_id: existingUser?.id || null,
        })
        .eq('id', existingInvitation.id);

      if (updateError) {
        console.error('[MP seat-return] Invitation update failed:', updateError);
        return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=invitation_update_failed`);
      }

      console.log('[MP seat-return] Existing invitation reset to pending:', existingInvitation.id);

      if (existingUser) {
        await supabaseAdmin.from('notifications').insert({
          type: 'organization_invitation',
          title: `Te invitaron nuevamente a ${org.name}`,
          body: `Has sido invitado a unirte a la organización "${org.name}". Aceptá la invitación para comenzar a colaborar.`,
          data: {
            invitation_id: existingInvitation.id,
            organization_id: organizationId,
            organization_name: org.name,
            user_id: existingUser.id,
          },
          audience: 'direct',
          created_by: dbUser.id,
        });
      } else {
        await sendInvitationEmail({
          inviteeEmail: inviteeEmail.toLowerCase(),
          organizationName: org.name,
          inviterName,
          roleName: role.name,
          invitationId: existingInvitation.id,
        });
      }

      if (subscriptionId) {
        console.log('[MP seat-return] Updating subscription for reinvited seat:', { subscriptionId, billingPeriod });
        const updateResult = await updateSubscriptionForNewSeat({
          supabase: supabaseAdmin,
          subscriptionId,
          organizationId,
          billingPeriod,
        });
        
        if (!updateResult.success) {
          console.error('[MP seat-return] Failed to update subscription for reinvite (non-fatal):', updateResult.error);
        } else {
          console.log('[MP seat-return] Subscription updated for reinvite:', {
            oldAmount: updateResult.oldAmount,
            newAmount: updateResult.newAmount,
          });
        }
      }

      return res.redirect(`${baseUrl}/organization/members?payment=success&invited=${encodeURIComponent(inviteeEmail)}`);
    }

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: inviteeEmail.toLowerCase(),
        role_id: roleId,
        user_id: existingUser?.id || null,
        invited_by: inviterMember?.id || null,
        status: 'pending',
      })
      .select()
      .single();

    if (invitationError || !invitation) {
      console.error('[MP seat-return] Invitation creation failed:', invitationError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=invitation_failed`);
    }

    console.log('[MP seat-return] Invitation created:', invitation.id);

    if (existingUser) {
      await supabaseAdmin.from('notifications').insert({
        type: 'organization_invitation',
        title: `Te invitaron a ${org.name}`,
        body: `Has sido invitado a unirte a la organización "${org.name}". Aceptá la invitación para comenzar a colaborar.`,
        data: {
          invitation_id: invitation.id,
          organization_id: organizationId,
          organization_name: org.name,
          user_id: existingUser.id,
        },
        audience: 'direct',
        created_by: dbUser.id,
      });
    } else {
      await sendInvitationEmail({
        inviteeEmail: inviteeEmail.toLowerCase(),
        organizationName: org.name,
        inviterName,
        roleName: role.name,
        invitationId: invitation.id,
      });
    }

    if (subscriptionId) {
      console.log('[MP seat-return] Updating subscription for new seat:', { subscriptionId, billingPeriod });
      const updateResult = await updateSubscriptionForNewSeat({
        supabase: supabaseAdmin,
        subscriptionId,
        organizationId,
        billingPeriod,
      });
      
      if (!updateResult.success) {
        console.error('[MP seat-return] Failed to update subscription (non-fatal):', updateResult.error);
      } else {
        console.log('[MP seat-return] Subscription updated successfully:', {
          oldAmount: updateResult.oldAmount,
          newAmount: updateResult.newAmount,
          seats: updateResult.seats,
        });
      }
    }

    return res.redirect(`${baseUrl}/organization/members?payment=success&invited=${encodeURIComponent(inviteeEmail)}`);

  } catch (error: any) {
    console.error('[MP seat-return] Error:', error);
    return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=error`);
  }
}
