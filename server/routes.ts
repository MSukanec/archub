import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase credentials are not set");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all countries
  app.get("/api/countries", async (req, res) => {
    try {
      const { data: countries, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) {
        console.error("Supabase error fetching countries:", error);
        return res.status(500).json({ error: "Failed to fetch countries" });
      }

      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // Update user profile - direct table updates
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const {
        user_id,
        full_name,
        avatar_url,
        first_name,
        last_name,
        birthdate,
        country,
        theme,
        sidebar_docked
      } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      console.log("Updating profile for user:", user_id);

      // Update user_data table directly - only birthdate and country exist
      if (birthdate !== undefined || country !== undefined) {
        // Check if user_data record exists
        const { data: existingData } = await supabase
          .from('user_data')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const updateData: any = {};
        if (birthdate !== undefined && birthdate !== "") updateData.birthdate = birthdate;
        if (country !== undefined && country !== "") updateData.country = country;

        if (existingData) {
          // Update existing record
          const { error } = await supabase
            .from('user_data')
            .update(updateData)
            .eq('user_id', user_id);
          
          if (error) {
            console.error("Error updating user_data:", error);
          } else {
            console.log("Updated user_data successfully");
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('user_data')
            .insert({
              user_id,
              ...updateData
            });
          
          if (error) {
            console.error("Error inserting user_data:", error);
          } else {
            console.log("Inserted user_data successfully");
          }
        }
      }

      // Update user_preferences table
      if (theme !== undefined || sidebar_docked !== undefined) {
        const { data: existingPrefs } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const prefsData: any = {};
        if (theme !== undefined) prefsData.theme = theme;
        if (sidebar_docked !== undefined) prefsData.sidebar_docked = sidebar_docked;

        if (existingPrefs) {
          const { error } = await supabase
            .from('user_preferences')
            .update(prefsData)
            .eq('user_id', user_id);
          
          if (error) {
            console.error("Error updating user_preferences:", error);
          } else {
            console.log("Updated user_preferences successfully");
          }
        } else {
          const { error } = await supabase
            .from('user_preferences')
            .insert({
              user_id,
              ...prefsData
            });
          
          if (error) {
            console.error("Error inserting user_preferences:", error);
          } else {
            console.log("Inserted user_preferences successfully");
          }
        }
      }

      // Update auth.users metadata for all user fields
      if (full_name !== undefined || avatar_url !== undefined || first_name !== undefined || last_name !== undefined) {
        const metadata: any = {};
        if (full_name !== undefined) metadata.full_name = full_name;
        if (avatar_url !== undefined) metadata.avatar_url = avatar_url;
        if (first_name !== undefined) metadata.first_name = first_name;
        if (last_name !== undefined) metadata.last_name = last_name;

        const { error } = await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: metadata
        });

        if (error) {
          console.error("Error updating auth metadata:", error);
        } else {
          console.log("Updated auth metadata successfully");
        }
      }

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update the SQL function to include user_data and organization_preferences
  app.post('/api/update-user-function', async (req, res) => {
    try {
      const sqlFunction = `
CREATE OR REPLACE FUNCTION archub_get_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    SELECT json_build_object(
        'user', json_build_object(
            'id', u.id,
            'auth_id', u.auth_id,
            'email', u.email,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'avatar_source', u.avatar_source,
            'role_id', u.role_id,
            'created_at', u.created_at
        ),
        'user_data', CASE 
            WHEN ud.id IS NOT NULL THEN json_build_object(
                'id', ud.id,
                'user_id', ud.user_id,
                'country', ud.country,
                'birthdate', ud.birthdate,
                'created_at', ud.created_at,
                'updated_at', ud.updated_at
            )
            ELSE NULL
        END,
        'preferences', CASE 
            WHEN up.id IS NOT NULL THEN json_build_object(
                'id', up.id,
                'user_id', up.user_id,
                'last_project_id', up.last_project_id,
                'last_organization_id', up.last_organization_id,
                'last_budget_id', up.last_budget_id,
                'theme', up.theme,
                'sidebar_docked', up.sidebar_docked,
                'onboarding_completed', up.onboarding_completed,
                'created_at', up.created_at
            )
            ELSE NULL
        END,
        'organization', CASE 
            WHEN o.id IS NOT NULL THEN json_build_object(
                'id', o.id,
                'name', o.name,
                'is_active', o.is_active,
                'is_system', o.is_system,
                'created_by', o.created_by,
                'created_at', o.created_at,
                'updated_at', o.updated_at
            )
            ELSE NULL
        END,
        'organization_preferences', CASE 
            WHEN op.id IS NOT NULL THEN json_build_object(
                'id', op.id,
                'organization_id', op.organization_id,
                'default_currency', op.default_currency,
                'default_wallet', op.default_wallet,
                'pdf_template', op.pdf_template,
                'created_at', op.created_at,
                'updated_at', op.updated_at
            )
            ELSE NULL
        END,
        'role', CASE 
            WHEN r.id IS NOT NULL THEN json_build_object(
                'id', r.id,
                'name', r.name,
                'permissions', r.permissions
            )
            ELSE NULL
        END,
        'plan', CASE 
            WHEN p.id IS NOT NULL THEN json_build_object(
                'id', p.id,
                'name', p.name,
                'features', p.features,
                'max_users', p.max_users,
                'price', p.price
            )
            ELSE NULL
        END
    ) INTO result
    FROM users u
    LEFT JOIN user_data ud ON u.id = ud.user_id
    LEFT JOIN user_preferences up ON u.id = up.user_id
    LEFT JOIN organizations o ON up.last_organization_id = o.id
    LEFT JOIN organization_preferences op ON o.id = op.organization_id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN plans p ON o.plan_id = p.id
    WHERE u.auth_id = current_user_id;

    RETURN result;
END;
$$;
      `;

      // Execute the SQL function update
      const { data, error } = await supabase.from('_dummy').select('*').limit(0);
      
      if (!error) {
        // Try to execute raw SQL through RPC if available
        const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { 
          query: sqlFunction 
        });
        
        if (rpcError) {
          console.log('RPC exec_sql not available, function needs manual update');
          res.json({ 
            success: false, 
            message: 'Function update requires manual execution in Supabase console',
            sql: sqlFunction
          });
        } else {
          console.log('SQL function updated successfully via RPC');
          res.json({ success: true, message: 'Function updated successfully' });
        }
      } else {
        res.json({ 
          success: false, 
          message: 'Function update requires manual execution in Supabase console',
          sql: sqlFunction
        });
      }
    } catch (error) {
      console.error('Error updating function:', error);
      res.status(500).json({ error: 'Failed to update function' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
