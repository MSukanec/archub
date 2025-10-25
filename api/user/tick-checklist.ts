import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Missing required field: key' });
    }

    // Validate key
    const validKeys = ['create_project', 'create_contact', 'create_movement'];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid key. Must be one of: create_project, create_contact, create_movement' });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's current organization from user_data
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('last_organization_id')
      .eq('user_id', user.id)
      .single();

    if (userDataError || !userData?.last_organization_id) {
      return res.status(400).json({ error: 'User has no active organization' });
    }

    const organizationId = userData.last_organization_id;

    // Get or create user_organization_preferences
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('user_organization_preferences')
      .select('home_checklist')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    let currentChecklist = existingPrefs?.home_checklist || {
      create_project: false,
      create_contact: false,
      create_movement: false
    };

    // Update the specific key
    currentChecklist = {
      ...currentChecklist,
      [key]: true
    };

    // Upsert the preferences
    const { error: upsertError } = await supabase
      .from('user_organization_preferences')
      .upsert({
        user_id: user.id,
        organization_id: organizationId,
        home_checklist: currentChecklist,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,organization_id'
      });

    if (upsertError) {
      console.error('Error upserting preferences:', upsertError);
      return res.status(500).json({ error: 'Failed to update checklist' });
    }

    return res.status(200).json({ 
      success: true,
      checklist: currentChecklist
    });

  } catch (error: any) {
    console.error('Error in tick-checklist:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
