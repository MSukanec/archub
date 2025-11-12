import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing subscription ID' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Cancel Subscription] Invalid token:', authError);
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    const userId = user.id;

    // Get subscription to check organization
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .select('id, organization_id, status')
      .eq('id', id)
      .single();

    if (subError || !subscription) {
      console.error('[Cancel Subscription] Subscription not found:', subError);
      return res.status(404).json({ ok: false, error: 'Subscription not found' });
    }

    // Verify user is admin of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('id, role_id, roles!inner(name)')
      .eq('organization_id', subscription.organization_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (memberError || !membership) {
      console.error('[Cancel Subscription] User not member of organization:', memberError);
      return res.status(403).json({ ok: false, error: 'You don\'t have permissions to cancel this subscription' });
    }

    // Verify user is admin
    const roleName = (membership.roles as any)?.name?.toLowerCase();
    if (roleName !== 'admin' && roleName !== 'owner' && roleName !== 'administrador') {
      console.error('[Cancel Subscription] User is not admin:', { roleName });
      return res.status(403).json({ ok: false, error: 'Only administrators can cancel the subscription' });
    }

    // Check if already cancelled
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ ok: false, error: 'Subscription is already cancelled' });
    }

    // Update subscription status to cancelled
    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Cancel Subscription] Error updating subscription:', updateError);
      return res.status(500).json({ ok: false, error: 'Failed to cancel subscription' });
    }

    console.log('[Cancel Subscription] ✅ Subscription cancelled successfully:', id);

    return res.status(200).json({
      ok: true,
      message: 'Subscription cancelled successfully. Access will remain until expiration date.'
    });

  } catch (error: any) {
    console.error('[Cancel Subscription] Error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
}
