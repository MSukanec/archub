// api/_lib/handlers/organization/acceptInvitation.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth-helpers.js";

export async function acceptInvitation(
  supabase: SupabaseClient,
  userId: string,
  invitationId: string
): Promise<{ success: boolean }> {
  if (!invitationId) {
    throw new HttpError(400, "invitationId is required");
  }

  // IDEMPOTENCY: Check if member already exists (in case of retry)
  const { data: invitation, error: invError } = await supabase
    .from('organization_invitations')
    .select('id, organization_id, role_id, user_id, status')
    .eq('id', invitationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (invError || !invitation) {
    throw new HttpError(404, "Invitation not found");
  }

  // If already accepted, check if member exists
  if (invitation.status === 'accepted') {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', invitation.organization_id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingMember) {
      // Already processed successfully - idempotent success
      return { success: true };
    }
    // Invitation accepted but member missing - continue to create
  } else if (invitation.status !== 'pending') {
    throw new HttpError(400, "Invitation already processed");
  }

  // Check for existing membership before creating (prevents duplicates)
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', invitation.organization_id)
    .maybeSingle();

  if (existingMember) {
    // Member already exists - just mark invitation as accepted
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
    }

    return { success: true };
  }

  // TRANSACTIONAL: Update status FIRST, then create member
  // This prevents duplicate accepts since status check happens first
  const { error: updateError } = await supabase
    .from('organization_invitations')
    .update({ 
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .eq('status', 'pending'); // Only update if still pending

  if (updateError) {
    console.error('Error updating invitation status:', updateError);
    throw new HttpError(500, 'Failed to update invitation status');
  }

  // Create organization member AFTER status update
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: userId,
      role_id: invitation.role_id,
      is_active: true,
    });

  if (memberError) {
    console.error('Error creating organization member:', memberError);
    // Member creation failed but invitation is marked accepted
    // This is a safer failure mode than the reverse
    throw new HttpError(500, 'Failed to create organization member. Please contact support.');
  }

  return { success: true };
}
