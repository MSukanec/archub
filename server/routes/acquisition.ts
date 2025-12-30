import type { Express, Request, Response } from 'express';
import type { RouteDeps } from './_base';

export function registerAcquisitionRoutes(app: Express, deps: RouteDeps) {
  const { createAuthenticatedClient, extractToken } = deps;

  /**
   * POST /api/user/acquisition
   * Crea un registro de user_acquisition después de OAuth
   * Usa la función SQL step_create_user_acquisition que ya existe
   */
  app.post('/api/user/acquisition', async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the actual user_id from the users table (not the auth_id)
      const { data: userData, error: userDataError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userDataError || !userData) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { utm_source, utm_medium, utm_campaign, utm_content, landing_page, referrer } = req.body;

      // Call the SQL function to insert the acquisition record
      const { data, error } = await authenticatedSupabase.rpc('step_create_user_acquisition', {
        p_user_id: userData.id,
        p_raw_meta: {
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          landing_page: landing_page || null,
          referrer: referrer || null,
        },
      });

      if (error) {
        console.error('Error creating user acquisition record:', error);
        return res.status(500).json({ error: 'Failed to save acquisition data' });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Acquisition endpoint error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}
