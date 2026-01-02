import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { getFileUrl } from '@/lib/storage/getFileUrl';
import type { BucketName } from '@/lib/storage/types';

/**
 * Register user-related endpoints (profile, preferences, authentication)
 */
export function registerUserRoutes(app: Express, deps: RouteDeps): void {
  const { supabase, createAuthenticatedClient, extractToken } = deps;

  // ========== COURSE PROGRESS ENDPOINT ==========
  
  // GET /api/user/course-progress - Get user's course progress from optimized view
  // Optional query param: course_id to filter by specific course
  app.get("/api/user/course-progress", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json([]);
      }
      
      // Build query
      let query = authenticatedSupabase
        .from('course_progress_view')
        .select('*')
        .eq('user_id', dbUser.id);
      
      // Optional filter by course_id
      const courseId = req.query.course_id as string;
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching course progress:', error);
        return res.status(500).json({ error: 'Failed to fetch course progress' });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Error in /api/user/course-progress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/user/study-time - Get user's study time metrics from optimized view
  app.get("/api/user/study-time", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.json({ seconds_lifetime: 0, seconds_this_month: 0 });
      }
      
      // Use optimized view
      const { data, error } = await authenticatedSupabase
        .from('course_user_study_time_view')
        .select('*')
        .eq('user_id', dbUser.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching study time:', error);
        return res.status(500).json({ error: 'Failed to fetch study time' });
      }
      
      res.json(data || { seconds_lifetime: 0, seconds_this_month: 0 });
    } catch (error) {
      console.error('Error in /api/user/study-time:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get current user data
  app.get("/api/current-user", async (req, res) => {
    try {
      
      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create a Supabase client with the user's token for authenticated requests
      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Try RPC first, but if we suspect stale data, refresh it
      const forceRefresh = req.query.refresh === 'true';
      
      let userData, error;
      
      if (forceRefresh) {
        // Call RPC twice to force refresh of cached data
        await authenticatedSupabase.rpc('get_user');
        const result = await authenticatedSupabase.rpc('get_user');
        userData = result.data;
        error = result.error;
      } else {
        // Normal RPC call
        const result = await authenticatedSupabase.rpc('get_user');
        userData = result.data;
        error = result.error;
      }
      
      // Debug: RPC call completed
      
      if (error) {
        console.error("Error fetching current user:", error);
        
        // Special handling for newly registered users who might not have complete data yet
        if (error.message && error.message.includes('organization')) {
          return res.status(404).json({ error: "User not found" });
        }
        
        return res.status(500).json({ error: "Failed to fetch user data", details: error });
      }
      
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Enhance organizations array with logo_url (computed from image_bucket + image_path)
      if (userData.organizations && Array.isArray(userData.organizations)) {
        // Get organization IDs for bulk query
        const orgIds = userData.organizations.map((org: any) => org.id);
        
        // Fetch image_bucket and image_path for all organizations in one query
        const { data: orgLogos, error: logoError } = await authenticatedSupabase
          .from('organizations')
          .select('id, image_bucket, image_path')
          .eq('is_deleted', false)
          .in('id', orgIds);
          
        if (!logoError && orgLogos) {
          // Create a map for quick lookup with generated URLs
          const logoMap = new Map<string, string | null>();
          
          await Promise.all(
            orgLogos.map(async (org: any) => {
              let logoUrl: string | null = null;
              if (org.image_bucket && org.image_path) {
                try {
                  logoUrl = await getFileUrl(org.image_bucket as BucketName, org.image_path);
                } catch (error) {
                  console.error('Error generating logo URL for org', org.id, error);
                }
              }
              logoMap.set(org.id, logoUrl);
            })
          );
          
          // Add logo_url to each organization
          userData.organizations = userData.organizations.map((org: any) => ({
            ...org,
            logo_url: logoMap.get(org.id) || null
          }));
        } else {
          console.error("Error fetching organization logos:", logoError);
        }
      }
      
      // Enhance memberships with is_over_limit flag for soft-lock functionality
      if (userData.memberships && Array.isArray(userData.memberships) && userData.user?.id) {
        const { data: membershipLimits, error: limitsError } = await authenticatedSupabase
          .from('organization_members')
          .select('id, organization_id, is_over_limit')
          .eq('user_id', userData.user.id)
          .eq('is_active', true);
        
        if (!limitsError && membershipLimits) {
          const limitsMap = new Map(
            membershipLimits.map((m: any) => [m.organization_id, m.is_over_limit || false])
          );
          
          userData.memberships = userData.memberships.map((m: any) => ({
            ...m,
            is_over_limit: limitsMap.get(m.organization_id) || false
          }));
        }
      }
      
      // User data retrieved successfully
      res.json(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user data", details: error });
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
        phone_e164,
        theme,
        sidebar_docked,
        layout
      } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Get the authorization token and create authenticated client for RLS
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);

      // Update user_data table - now includes first_name, last_name, birthdate, country and phone_e164
      if (birthdate !== undefined || country !== undefined || first_name !== undefined || last_name !== undefined || phone_e164 !== undefined) {
        // Check if user_data record exists
        const { data: existingData } = await authenticatedSupabase
          .from('user_data')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const updateData: any = {};
        if (birthdate !== undefined && birthdate !== "") updateData.birthdate = birthdate;
        if (country !== undefined && country !== "") updateData.country = country;
        if (first_name !== undefined && first_name !== "") updateData.first_name = first_name;
        if (last_name !== undefined && last_name !== "") updateData.last_name = last_name;
        if (phone_e164 !== undefined && phone_e164 !== "") updateData.phone_e164 = phone_e164;

        if (existingData) {
          // Update existing record
          const { error } = await authenticatedSupabase
            .from('user_data')
            .update(updateData)
            .eq('user_id', user_id);
          
          if (error) {
            console.error("Error updating user_data:", error);
            return res.status(500).json({ error: "Failed to update user data", details: error });
          }
        } else {
          // Insert new record
          const { error } = await authenticatedSupabase
            .from('user_data')
            .insert({
              user_id,
              ...updateData
            });
          
          if (error) {
            console.error("Error inserting user_data:", error);
            return res.status(500).json({ error: "Failed to insert user data", details: error });
          }
        }
      }

      // Update user_preferences table
      if (theme !== undefined || sidebar_docked !== undefined || layout !== undefined) {
        const { data: existingPrefs } = await authenticatedSupabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const prefsData: any = {};
        if (theme !== undefined) prefsData.theme = theme;
        if (sidebar_docked !== undefined) prefsData.sidebar_docked = sidebar_docked;
        if (layout !== undefined) prefsData.layout = layout;

        if (existingPrefs) {
          const { error } = await authenticatedSupabase
            .from('user_preferences')
            .update(prefsData)
            .eq('user_id', user_id);
          
          if (error) {
            console.error("Error updating user_preferences:", error);
            return res.status(500).json({ error: "Failed to update user preferences", details: error });
          }
        } else {
          const { error } = await authenticatedSupabase
            .from('user_preferences')
            .insert({
              user_id,
              ...prefsData
            });
          
          if (error) {
            console.error("Error inserting user_preferences:", error);
            return res.status(500).json({ error: "Failed to insert user preferences", details: error });
          }
        }
      }

      // Update users table for user profile fields (excluding first_name/last_name which are now in user_data)
      if (full_name !== undefined || avatar_url !== undefined) {
        const userUpdateData: any = {};
        if (full_name !== undefined) userUpdateData.full_name = full_name;
        if (avatar_url !== undefined) userUpdateData.avatar_url = avatar_url;

        if (Object.keys(userUpdateData).length > 0) {
          const { error } = await authenticatedSupabase
            .from('users')
            .update(userUpdateData)
            .eq('id', user_id);

          if (error) {
            console.error("Error updating users table:", error);
            return res.status(500).json({ error: "Failed to update user profile", details: error });
          }
        }
      }

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // User sign out endpoint
  app.post("/api/user/signout", async (req, res) => {
    try {
      // For Supabase auth, we don't need server-side logout logic
      // The client handles the session cleanup
      res.json({ success: true, message: "Signed out successfully" });
    } catch (error) {
      console.error("Error signing out:", error);
      res.status(500).json({ error: "Failed to sign out" });
    }
  });

  // Get user organization preferences endpoint
  app.get("/api/user/organization-preferences", async (req, res) => {
    try {
      const { user_id, organization_id } = req.query;

      if (!user_id || !organization_id) {
        return res.status(400).json({ error: "Missing user_id or organization_id" });
      }

      // Get the authorization token and create authenticated client for RLS
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);

      // Fetching user organization preferences

      // First try to get existing preferences
      const { data, error } = await authenticatedSupabase
        .from('user_organization_preferences')
        .select('*')
        .eq('user_id', user_id)
        .eq('organization_id', organization_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          // Create default preferences for new user
          const { data: newPreferences, error: createError } = await authenticatedSupabase
            .from('user_organization_preferences')
            .upsert(
              {
                user_id,
                organization_id,
                last_project_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                onConflict: 'user_id,organization_id'
              }
            )
            .select()
            .single();

          if (createError) {
            console.error("Error creating default user organization preferences:", createError);
            return res.status(500).json({ error: "Failed to create organization preferences" });
          }

          // Default organization preferences created successfully"
          return res.json(newPreferences);
        }
        console.error("Error fetching user organization preferences:", error);
        return res.status(500).json({ error: "Failed to fetch organization preferences" });
      }

      // Found existing organization preferences
      res.json(data);
    } catch (error) {
      console.error("Error fetching organization preferences:", error);
      res.status(500).json({ error: "Failed to fetch organization preferences" });
    }
  });

  // Select organization endpoint
  app.post("/api/user/select-organization", async (req, res) => {
    try {
      const { organization_id } = req.body;

      if (!organization_id) {
        return res.status(400).json({ error: "Missing organization_id" });
      }

      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get the auth user from the token
      const { data: { user: authUser }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user_id from the database using auth_id
      const { data: dbUser, error: dbUserError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (dbUserError || !dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const user_id = dbUser.id;

      // Verificar si existe el registro de user_preferences
      const { data: existingPrefs, error: checkError } = await authenticatedSupabase
        .from('user_preferences')
        .select('id, user_id, last_organization_id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing preferences:", checkError);
        return res.status(500).json({ error: "Failed to check user preferences" });
      }



      if (!existingPrefs) {
        console.error("No user_preferences record found for user_id:", user_id);
        return res.status(404).json({ error: "User preferences not found" });
      }

      // Actualizar el registro existente
      const { data: updateResult, error: updateError } = await authenticatedSupabase
        .from('user_preferences')
        .update({ 
          last_organization_id: organization_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select('last_organization_id, updated_at');

      if (updateError) {
        console.error("Error updating last_organization_id:", updateError);
        return res.status(500).json({ error: "Failed to update organization selection" });
      }

      if (!updateResult || updateResult.length === 0) {
        console.error("No rows were updated");
        return res.status(500).json({ error: "No preferences were updated" });
      }

      const updatedPrefs = updateResult[0];

      if (updatedPrefs.last_organization_id !== organization_id) {
        console.error("Organization update failed - values don't match");
        return res.status(500).json({ error: "Organization update verification failed" });
      }

      res.json({ 
        success: true, 
        message: "Organization selected successfully",
        updated_organization_id: updatedPrefs.last_organization_id,
        updated_at: updatedPrefs.updated_at
      });
    } catch (error) {
      console.error("Error selecting organization:", error);
      res.status(500).json({ error: "Failed to select organization" });
    }
  });

  // Select project endpoint
  app.post("/api/user/select-project", async (req, res) => {
    try {
      const { project_id } = req.body;
      const user_id = req.headers['x-user-id'];

      if (!project_id || !user_id) {
        return res.status(400).json({ error: "Missing project_id or user_id" });
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: project_id })
        .eq('user_id', user_id);

      if (error) {
        console.error("Error updating last_project_id:", error);
        return res.status(500).json({ error: "Failed to update project selection" });
      }

      res.json({ success: true, message: "Project selected successfully" });
    } catch (error) {
      console.error("Error selecting project:", error);
      res.status(500).json({ error: "Failed to select project" });
    }
  });

  // Update user organization preferences endpoint
  app.post("/api/user/update-organization-preferences", async (req, res) => {
    try {
      const { organization_id, last_project_id } = req.body;
      const user_id = req.headers['x-user-id'];

      if (!organization_id || !user_id) {
        return res.status(400).json({ error: "Missing organization_id or user_id" });
      }

      // Get the authorization token and create authenticated client for RLS
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data, error } = await authenticatedSupabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id,
            organization_id,
            last_project_id,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,organization_id'
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error updating user organization preferences:", error);
        return res.status(500).json({ error: "Failed to update organization preferences" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error updating organization preferences:", error);
      res.status(500).json({ error: "Failed to update organization preferences" });
    }
  });

  // Get user organization preferences endpoint
  app.get("/api/user/organization-preferences/:organizationId", async (req, res) => {
    try {
      const { organizationId } = req.params;
      const user_id = req.headers['x-user-id'];

      if (!organizationId || !user_id) {
        return res.status(400).json({ error: "Missing organizationId or user_id" });
      }

      // Get the authorization token and create authenticated client for RLS
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data, error } = await authenticatedSupabase
        .from('user_organization_preferences')
        .select('*')
        .eq('user_id', user_id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return null
          return res.json({ last_project_id: null });
        }
        console.error("Error getting user organization preferences:", error);
        return res.status(500).json({ error: "Failed to get organization preferences" });
      }

      // Found user organization preferences successfully
      res.json(data);
    } catch (error) {
      console.error("Error getting organization preferences:", error);
      res.status(500).json({ error: "Failed to get organization preferences" });
    }
  });

  // Complete onboarding endpoint - handles all onboarding data in one transaction
  app.post("/api/onboarding/complete", async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        country,
        birthdate,
        theme,
        organization_name,
        organization_id
      } = req.body;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get the auth user
      const { data: { user: authUser }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user_id from the database using auth_id
      const { data: dbUser, error: dbUserError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (dbUserError || !dbUser) {
        console.error("Error finding user:", dbUserError);
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // 1. Handle user_data (upsert pattern)
      const { data: existingUserData } = await authenticatedSupabase
        .from('user_data')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const userDataPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (first_name !== undefined) userDataPayload.first_name = first_name;
      if (last_name !== undefined) userDataPayload.last_name = last_name;
      if (country !== undefined) userDataPayload.country = country || null;
      if (birthdate !== undefined) userDataPayload.birthdate = birthdate || null;

      if (existingUserData) {
        const { error: userDataError } = await authenticatedSupabase
          .from('user_data')
          .update(userDataPayload)
          .eq('user_id', userId);
        if (userDataError) {
          console.error("Error updating user_data:", userDataError);
          return res.status(500).json({ error: "Failed to update user data", details: userDataError });
        }
      } else {
        const { error: userDataError } = await authenticatedSupabase
          .from('user_data')
          .insert({
            user_id: userId,
            ...userDataPayload,
            created_at: new Date().toISOString(),
          });
        if (userDataError) {
          console.error("Error inserting user_data:", userDataError);
          return res.status(500).json({ error: "Failed to insert user data", details: userDataError });
        }
      }

      // 2. Handle user_preferences (upsert pattern)
      const { data: existingPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const prefsPayload: Record<string, any> = {
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };
      if (theme !== undefined) prefsPayload.theme = theme;

      if (existingPrefs) {
        const { error: prefsError } = await authenticatedSupabase
          .from('user_preferences')
          .update(prefsPayload)
          .eq('user_id', userId);
        if (prefsError) {
          console.error("Error updating user_preferences:", prefsError);
          return res.status(500).json({ error: "Failed to update preferences", details: prefsError });
        }
      } else {
        const { error: prefsError } = await authenticatedSupabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...prefsPayload,
            created_at: new Date().toISOString(),
          });
        if (prefsError) {
          console.error("Error inserting user_preferences:", prefsError);
          return res.status(500).json({ error: "Failed to insert preferences", details: prefsError });
        }
      }

      // 3. Update organization name if provided
      if (organization_name && organization_id) {
        const { error: orgError } = await authenticatedSupabase
          .from('organizations')
          .update({
            name: organization_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organization_id);

        if (orgError) {
          console.error("Error updating organization:", orgError);
          return res.status(500).json({ error: "Failed to update organization", details: orgError });
        }
      }

      res.json({ success: true, message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

}
