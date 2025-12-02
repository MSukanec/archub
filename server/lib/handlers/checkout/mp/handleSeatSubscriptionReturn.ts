import { Request, Response } from "express";
import { supabaseAdmin } from "../../../supabase/admin.js";
import { getMPPreapproval } from "./subscriptions-api.js";
import { sendInvitationEmail } from "../../../email/sendInvitationEmail.js";

/**
 * Handles the return from MP after a user authorizes a new seat subscription.
 * This is used when a gifted org (no existing MP subscription) adds their first paid seat.
 * 
 * Different from handleSeatReturn.ts which handles ONE-TIME payments for seats.
 * This handles RECURRING SUBSCRIPTION creation for seats.
 */
export async function handleSeatSubscriptionReturn(req: Request, res: Response) {
  console.log('[MP seat-subscription-return] Handler called with query:', req.query);
  
  const baseUrl = process.env.VITE_APP_URL || 'https://seencel.com';
  
  try {
    const { preapproval_id, status, preference_id, external_reference } = req.query;
    
    const shortId = preference_id || external_reference;
    const mpPreapprovalId = preapproval_id;

    console.log('[MP seat-subscription-return] Received:', { preapproval_id, status, shortId });

    if (!shortId) {
      console.log('[MP seat-subscription-return] Missing preference_id/external_reference');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_id`);
    }

    const { data: prefData, error: prefError } = await supabaseAdmin
      .from('mp_subscription_preferences')
      .select('*')
      .eq('id', String(shortId))
      .maybeSingle();

    if (prefError || !prefData) {
      console.error('[MP seat-subscription-return] Preference not found:', shortId, prefError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=preference_not_found`);
    }

    console.log('[MP seat-subscription-return] Found preference data:', {
      id: prefData.id,
      userId: prefData.user_id,
      organizationId: prefData.organization_id,
      inviteeEmail: prefData.invitee_email,
      roleId: prefData.role_id,
      productType: prefData.product_type,
      subscriptionId: prefData.subscription_id,
    });

    if (prefData.product_type !== 'seat_subscription') {
      console.error('[MP seat-subscription-return] Wrong product type:', prefData.product_type);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=wrong_type`);
    }

    const organizationId = prefData.organization_id;
    const inviteeEmail = prefData.invitee_email;
    const roleId = prefData.role_id;
    const subscriptionId = prefData.subscription_id;
    const billingPeriod = (prefData.billing_period || 'monthly') as 'monthly' | 'annual';

    if (!organizationId || !inviteeEmail || !roleId || !subscriptionId) {
      console.error('[MP seat-subscription-return] Missing required data in preference');
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=missing_data`);
    }

    let preapprovalAuthorized = false;
    let finalPreapprovalId = mpPreapprovalId || prefData.preapproval_id;

    if (finalPreapprovalId) {
      const preapproval = await getMPPreapproval(String(finalPreapprovalId));
      
      if (preapproval.success && preapproval.preapproval.status === 'authorized') {
        preapprovalAuthorized = true;
        console.log('[MP seat-subscription-return] Preapproval is authorized');
      } else if (preapproval.success) {
        console.log('[MP seat-subscription-return] Preapproval status:', preapproval.preapproval.status);
        if (preapproval.preapproval.status === 'pending') {
          preapprovalAuthorized = true;
          console.log('[MP seat-subscription-return] Accepting pending status as authorized');
        }
      }
    }

    if (!preapprovalAuthorized) {
      console.log('[MP seat-subscription-return] Preapproval not authorized');
      return res.redirect(`${baseUrl}/organization/members?payment=failed`);
    }

    const { data: existingSub } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('id, provider_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (existingSub?.provider_subscription_id) {
      console.log('[MP seat-subscription-return] Subscription already has provider_subscription_id:', existingSub.provider_subscription_id);
      return res.redirect(`${baseUrl}/organization/members?payment=success`);
    }

    const { error: updateSubError } = await supabaseAdmin
      .from('organization_subscriptions')
      .update({
        provider_subscription_id: String(finalPreapprovalId),
        amount: prefData.amount_ars,
        currency: 'ARS',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateSubError) {
      console.error('[MP seat-subscription-return] Failed to update subscription with preapproval_id:', updateSubError);
    } else {
      console.log('[MP seat-subscription-return] Subscription updated with preapproval_id:', finalPreapprovalId);
    }

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', prefData.user_id)
      .single();

    if (userError || !dbUser) {
      console.error('[MP seat-subscription-return] User lookup failed:', userError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=user_not_found`);
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('[MP seat-subscription-return] Organization lookup failed:', orgError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=org_not_found`);
    }

    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('[MP seat-subscription-return] Role lookup failed:', roleError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=role_not_found`);
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
        console.error('[MP seat-subscription-return] Invitation update failed:', updateError);
        return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=invitation_update_failed`);
      }

      console.log('[MP seat-subscription-return] Existing invitation reset to pending:', existingInvitation.id);

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
      console.error('[MP seat-subscription-return] Invitation creation failed:', invitationError);
      return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=invitation_failed`);
    }

    console.log('[MP seat-subscription-return] Invitation created:', invitation.id);

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

    console.log('[MP seat-subscription-return] Complete - New seat subscription created and invitation sent');
    return res.redirect(`${baseUrl}/organization/members?payment=success&invited=${encodeURIComponent(inviteeEmail)}`);

  } catch (error: any) {
    console.error('[MP seat-subscription-return] Error:', error);
    return res.redirect(`${baseUrl}/organization/members?payment=failed&reason=error`);
  }
}
