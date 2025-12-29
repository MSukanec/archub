import type { Request, Response } from "express";
import { getAdminClient } from "../../../../routes/_base.js";
import { capturePayPalOrder, getPayPalOrder } from "./api.js";
import { sendInvitationEmail } from "../../../email/sendInvitationEmail.js";

export async function handleSeatCapture(req: Request, res: Response) {
  console.log('[PayPal seat-capture] Handler called with query:', req.query);
  
  const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
  const adminClient = getAdminClient();
  
  try {
    const preferenceIdRaw = req.query.preference_id;
    const token = req.query.token as string;
    
    let preferenceId: string | null = null;
    if (Array.isArray(preferenceIdRaw)) {
      const found = preferenceIdRaw.find((id) => typeof id === 'string' && id.startsWith('pps_'));
      preferenceId = typeof found === 'string' ? found : (typeof preferenceIdRaw[0] === 'string' ? preferenceIdRaw[0] : null);
    } else if (typeof preferenceIdRaw === 'string') {
      preferenceId = preferenceIdRaw;
    }
    
    console.log('[PayPal seat-capture] Received:', { preferenceId, token });

    if (!preferenceId) {
      console.log('[PayPal seat-capture] Missing preference_id');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_id`);
    }

    const { data: prefData, error: prefError } = await adminClient
      .from('paypal_seat_preferences')
      .select('*')
      .eq('id', String(preferenceId))
      .maybeSingle();

    if (prefError || !prefData) {
      console.error('[PayPal seat-capture] Preference not found:', preferenceId, prefError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=preference_not_found`);
    }

    console.log('[PayPal seat-capture] Found preference data:', {
      id: prefData.id,
      userId: prefData.user_id,
      organizationId: prefData.organization_id,
      inviteeEmail: prefData.invitee_email,
      roleId: prefData.role_id,
      status: prefData.status,
    });

    if (prefData.status === 'completed') {
      console.log('[PayPal seat-capture] Payment already processed');
      return res.redirect(`${baseUrl}/organization/members?payment=success`);
    }

    const organizationId = prefData.organization_id;
    const inviteeEmail = prefData.invitee_email;
    const roleId = prefData.role_id;
    const subscriptionId = prefData.subscription_id;
    const billingPeriod = (prefData.billing_period || 'monthly') as 'monthly' | 'annual';
    const userId = prefData.user_id;
    const orderId = prefData.order_id || token;

    if (!organizationId || !inviteeEmail || !roleId) {
      console.error('[PayPal seat-capture] Missing required data in preference');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_data`);
    }

    if (!orderId) {
      console.error('[PayPal seat-capture] No order_id to capture');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=no_order_id`);
    }

    let captureData: any = null;
    let paymentAmount = parseFloat(prefData.prorated_amount_usd) || 0;
    let gatewayPaymentId = '';

    try {
      const orderDetails = await getPayPalOrder(orderId);
      console.log('[PayPal seat-capture] Order status:', orderDetails.status);
      
      if (orderDetails.status === 'COMPLETED') {
        console.log('[PayPal seat-capture] Order already captured');
        captureData = orderDetails;
        gatewayPaymentId = orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;
      } else if (orderDetails.status === 'APPROVED') {
        console.log('[PayPal seat-capture] Capturing order:', orderId);
        captureData = await capturePayPalOrder(orderId);
        console.log('[PayPal seat-capture] Capture result:', captureData.status);
        
        if (captureData.status !== 'COMPLETED') {
          console.error('[PayPal seat-capture] Capture not completed:', captureData.status);
          return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=capture_failed`);
        }
        
        gatewayPaymentId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;
        paymentAmount = parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value) || paymentAmount;
      } else {
        console.error('[PayPal seat-capture] Order not approved:', orderDetails.status);
        return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=order_not_approved`);
      }
    } catch (captureError: any) {
      console.error('[PayPal seat-capture] Error capturing order:', captureError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=capture_error`);
    }

    if (gatewayPaymentId) {
      const { data: existingPayment } = await adminClient
        .from('payments')
        .select('id')
        .eq('gateway', 'paypal')
        .eq('gateway_payment_id', gatewayPaymentId)
        .maybeSingle();

      if (existingPayment) {
        console.log('[PayPal seat-capture] Payment already processed:', existingPayment.id);
        return res.redirect(`${baseUrl}/organization/members?payment=success`);
      }
    }

    const { data: dbUser, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !dbUser) {
      console.error('[PayPal seat-capture] User lookup failed:', userError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=user_not_found`);
    }

    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('[PayPal seat-capture] Organization lookup failed:', orgError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=org_not_found`);
    }

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('[PayPal seat-capture] Role lookup failed:', roleError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=role_not_found`);
    }

    if (gatewayPaymentId) {
      const { error: paymentError } = await adminClient
        .from('payments')
        .insert({
          user_id: dbUser.id,
          organization_id: organizationId,
          product_type: 'seat',
          product_id: roleId,
          gateway: 'paypal',
          gateway_payment_id: gatewayPaymentId,
          amount: paymentAmount,
          currency: 'USD',
          status: 'completed',
          metadata: {
            invitee_email: inviteeEmail,
            role_id: roleId,
            role_name: role.name,
            organization_name: org.name,
            preference_id: preferenceId,
          },
        });

      if (paymentError) {
        console.error('[PayPal seat-capture] Payment insert failed:', paymentError);
      } else {
        console.log('[PayPal seat-capture] Payment recorded successfully');
      }
    }

    const { error: prefUpdateError } = await adminClient
      .from('paypal_seat_preferences')
      .update({ 
        status: 'completed',
        captured_at: new Date().toISOString(),
      })
      .eq('id', preferenceId);

    if (prefUpdateError) {
      console.warn('[PayPal seat-capture] Failed to update preference status:', prefUpdateError);
    }

    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, auth_id')
      .eq('email', inviteeEmail.toLowerCase())
      .maybeSingle();

    const { data: inviterMember } = await adminClient
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

    const { data: existingInvitation } = await adminClient
      .from('organization_invitations')
      .select('id, status')
      .eq('email', inviteeEmail.toLowerCase())
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingInvitation) {
      const { error: updateError } = await adminClient
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
        console.error('[PayPal seat-capture] Invitation update failed:', updateError);
        return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=invitation_update_failed`);
      }

      console.log('[PayPal seat-capture] Existing invitation reset to pending:', existingInvitation.id);

      if (existingUser) {
        await adminClient.from('notifications').insert({
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

      return res.redirect(`${baseUrl}/organization/members?payment=success&invited=${encodeURIComponent(inviteeEmail)}`);
    }

    const { data: invitation, error: invitationError } = await adminClient
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
      console.error('[PayPal seat-capture] Invitation creation failed:', invitationError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=invitation_failed`);
    }

    console.log('[PayPal seat-capture] Invitation created:', invitation.id);

    if (existingUser) {
      await adminClient.from('notifications').insert({
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

    console.log('[PayPal seat-capture] Seat payment flow completed successfully:', {
      preferenceId,
      inviteeEmail,
      organizationId,
      paymentAmount,
    });

    return res.redirect(`${baseUrl}/organization/members?payment=success&invited=${encodeURIComponent(inviteeEmail)}`);

  } catch (error: any) {
    console.error('[PayPal seat-capture] Error:', error);
    return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=error`);
  }
}
