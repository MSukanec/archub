// api/_lib/handlers/organization/rejectInvitation.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth-helpers.js";

export async function rejectInvitation(
  supabase: SupabaseClient,
  userId: string,
  invitationId: string
): Promise<{ success: boolean }> {
  if (!invitationId) {
    throw new HttpError(400, "invitationId is required");
  }

  // Verify the invitation belongs to the current user and is pending
  const { data: invitation, error: invError } = await supabase
    .from('organization_invitations')
    .select('id, user_id, status')
    .eq('id', invitationId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (invError || !invitation) {
    throw new HttpError(404, "Invitation not found or already processed");
  }

  // Update invitation status to rejected
  const { error: updateError } = await supabase
    .from('organization_invitations')
    .update({ 
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId);

  if (updateError) {
    console.error('Error updating invitation status:', updateError);
    throw new HttpError(500, 'Failed to reject invitation');
  }

  return { success: true };
}
