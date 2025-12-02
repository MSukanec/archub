import { Request, Response } from "express";
import { supabaseAdmin } from "../../../supabase/admin.js";
import { getMPPayment } from "./api.js";
import { sendInvitationEmail } from "../../../email/sendInvitationEmail.js";
import { updateSubscriptionForNewSeat } from "./updateSeatSubscription.js";

export async function handleSeatReturn(req: Request, res: Response) {
  console.log('[MP seat-return] Handler called with query:', req.query);
  
  const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
  
  try {
    const { payment_id, status, preference_id, external_reference } = req.query;
    
    const shortId = preference_id || external_reference;

    console.log('[MP seat-return] Received:', { payment_id, status, shortId });

    if (!shortId) {
      console.log('[MP seat-return] Missing preference_id/external_reference');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_id`);
    }

    const { data: prefData, error: prefError } = await supabaseAdmin
      .from('mp_subscription_preferences')
      .select('*')
      .eq('id', String(shortId))
      .maybeSingle();

    if (prefError || !prefData) {
      console.error('[MP seat-return] Preference not found:', shortId, prefError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=preference_not_found`);
    }

    console.log('[MP seat-return] Found preference data:', {
      id: prefData.id,
      userId: prefData.user_id,
      organizationId: prefData.organization_id,
      inviteeEmail: prefData.invitee_email,
      roleId: prefData.role_id,
      productType: prefData.product_type,
    });

    if (prefData.product_type !== 'seat') {
      console.error('[MP seat-return] Wrong product type:', prefData.product_type);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=wrong_type`);
    }

    const organizationId = prefData.organization_id;
    const inviteeEmail = prefData.invitee_email;
    const roleId = prefData.role_id;
    const subscriptionId = prefData.subscription_id;
    const billingPeriod = (prefData.billing_period || 'monthly') as 'monthly' | 'annual';

    if (!organizationId || !inviteeEmail || !roleId) {
      console.error('[MP seat-return] Missing required data in preference');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_data`);
    }

    let paymentApproved = status === 'approved';
    let paymentAmount = parseFloat(prefData.amount_ars) || 0;
    let gatewayPaymentId = String(payment_id || '');

    if (payment_id) {
      const payment = await getMPPayment(String(payment_id));
      
      if (payment && payment.status === 'approved') {
        paymentApproved = true;
        paymentAmount = payment.transaction_amount || paymentAmount;
        gatewayPaymentId = String(payment_id);
      } else if (payment) {
        console.log('[MP seat-return] Payment status from MP:', payment.status);
        paymentApproved = false;
      }
    }

    if (!paymentApproved) {
      console.log('[MP seat-return] Payment not approved');
      return res.redirect(`${baseUrl}/organization/members?payment=failed`);
    }

    if (gatewayPaymentId) {
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('gateway', 'mercadopago')
        .eq('gateway_payment_id', gatewayPaymentId)
        .maybeSingle();

      if (existingPayment) {
        console.log('[MP seat-return] Payment already processed:', existingPayment.id);
        return res.redirect(`${baseUrl}/organization/members?payment=success`);
      }
    }

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', prefData.user_id)
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

    if (gatewayPaymentId) {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: dbUser.id,
          organization_id: organizationId,
          product_type: 'seat',
          product_id: roleId,
          gateway: 'mercadopago',
          gateway_payment_id: gatewayPaymentId,
          amount: paymentAmount,
          currency: 'ARS',
          status: 'completed',
          metadata: {
            invitee_email: inviteeEmail,
            role_id: roleId,
            role_name: role.name,
            organization_name: org.name,
            preference_id: shortId,
          },
        });

      if (paymentError) {
        console.error('[MP seat-return] Payment insert failed:', paymentError);
      }
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

    const { data: existingInvitation } = await supabaseAdmin
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
