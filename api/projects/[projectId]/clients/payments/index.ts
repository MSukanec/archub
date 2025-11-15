import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getClientPayments } from '../../../../lib/handlers/projects/clientPayments';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('📥 [GET /api/projects/:projectId/clients/payments] Request received');
  
  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;
    const organizationId = Array.isArray(req.query.organization_id) 
      ? req.query.organization_id[0] 
      : req.query.organization_id;

    console.log('📝 Params:', { projectId, organizationId });

    if (!projectId || typeof projectId !== 'string') {
      console.log('❌ Invalid projectId');
      return res.status(400).json({ error: 'Invalid projectId' });
    }

    if (!organizationId || typeof organizationId !== 'string') {
      console.log('❌ Invalid organizationId');
      return res.status(400).json({ error: 'Invalid organizationId' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token extracted, length:', token.length);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    console.log('✅ Supabase client created');
    console.log('🚀 Calling getClientPayments handler...');

    const result = await getClientPayments(
      { supabase },
      { projectId, organizationId }
    );

    console.log('📤 Handler result:', result.success ? 'SUCCESS' : 'FAILED');

    if (!result.success) {
      console.log('❌ Handler failed:', result.error);
      return res.status(400).json({ error: result.error });
    }

    console.log('✅ Returning payments, count:', result.data?.total || 0);
    return res.status(200).json(result.data);
  } catch (error: any) {
    console.error('❌ Unexpected error in payments endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
