import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listOrganizationClientPayments,
  type ListOrganizationClientPaymentsParams
} from '../../lib/handlers/organization/clientPayments.js';
import { getOrganizationPaymentMetrics } from '../../lib/services/paymentsMetrics.js';
import type { ProjectsContext } from '../../lib/handlers/projects/shared.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function handleListOrganizationClientPayments(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);
    const ctx: ProjectsContext = { supabase };

    const params: ListOrganizationClientPaymentsParams = {
      organizationId: req.params.organizationId
    };

    const result = await listOrganizationClientPayments(ctx, params);

    if (result.success) {
      return res.status(200).json({ data: result.data });
    } else {
      return res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Error in listOrganizationClientPayments controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to list organization client payments' });
  }
}

export async function handleGetOrganizationClientPaymentsMetrics(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = createAuthenticatedClient(token);

    const organizationId = req.params.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const metrics = await getOrganizationPaymentMetrics(supabase, organizationId);

    return res.status(200).json({ data: metrics });
  } catch (error: any) {
    console.error('Error in getOrganizationClientPaymentsMetrics controller:', error);
    return res.status(500).json({ error: error.message || 'Failed to get organization payment metrics' });
  }
}
