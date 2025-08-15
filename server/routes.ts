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
  
  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Get current user data
  app.get("/api/current-user", async (req, res) => {
    try {
      console.log("Attempting to fetch current user data...");
      
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create a Supabase client with the user's token for authenticated requests
      const authenticatedSupabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      // Try RPC first, but if we suspect stale data, refresh it
      const forceRefresh = req.query.refresh === 'true';
      
      let userData, error;
      
      if (forceRefresh) {
        console.log("Force refresh requested - calling RPC twice to ensure fresh data");
        // Call RPC twice to force refresh of cached data
        await authenticatedSupabase.rpc('archub_get_user');
        const result = await authenticatedSupabase.rpc('archub_get_user');
        userData = result.data;
        error = result.error;
      } else {
        // Normal RPC call
        const result = await authenticatedSupabase.rpc('archub_get_user');
        userData = result.data;
        error = result.error;
      }
      
      console.log("Supabase RPC result:", { userData, error, forceRefresh });
      
      if (error) {
        console.error("Error fetching current user:", error);
        return res.status(500).json({ error: "Failed to fetch user data", details: error });
      }
      
      if (!userData) {
        console.log("No user data found");
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("Returning user data:", userData);
      res.json(userData);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user data", details: error });
    }
  });
  
  // Delete project safely - server-side implementation
  app.delete("/api/projects/:projectId", async (req, res) => {
    try {
      console.log("Attempting to delete project:", req.params.projectId);
      
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      const projectId = req.params.projectId;
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      // Get user organization directly from token instead of heavy RPC call
      const { data: { user } } = await authenticatedSupabase.auth.getUser();
      if (!user) {
        return res.status(401).json({ error: "Invalid authentication" });
      }
      
      // Get organization ID from query parameters (passed from frontend)
      const organizationId = req.query.organizationId as string;
      if (!organizationId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }
      
      // Combined operation: verify ownership and delete in fewer queries
      // First delete project_data (if exists) - no verification needed since it's linked to project
      await authenticatedSupabase
        .from('project_data')
        .delete()
        .eq('project_id', projectId);
      
      // Delete the main project with organization verification in one step
      const { error: projectError } = await authenticatedSupabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', organizationId);
      
      if (projectError) {
        console.error("Error deleting project:", projectError);
        return res.status(500).json({ error: "Failed to delete project", details: projectError });
      }
      
      console.log("Project deleted successfully:", projectId);
      res.json({ success: true, message: "Project deleted successfully" });
      
    } catch (error) {
      console.error("Error in delete project endpoint:", error);
      res.status(500).json({ error: "Internal server error", details: error });
    }
  });

  // Get budgets for a project
  app.get("/api/budgets", async (req, res) => {
    try {
      const { project_id, organization_id } = req.query;
      
      if (!project_id || !organization_id) {
        return res.status(400).json({ error: "project_id and organization_id are required" });
      }

      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', project_id)
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching budgets:", error);
        return res.status(500).json({ error: "Failed to fetch budgets" });
      }

      res.json(budgets || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  // Create a new budget
  app.post("/api/budgets", async (req, res) => {
    try {
      const budgetData = req.body;

      const { data: budget, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single();

      if (error) {
        console.error("Error creating budget:", error);
        return res.status(500).json({ error: "Failed to create budget" });
      }

      res.json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(500).json({ error: "Failed to create budget" });
    }
  });

  // Update a budget
  app.patch("/api/budgets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data: budget, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating budget:", error);
        return res.status(500).json({ error: "Failed to update budget" });
      }

      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ error: "Failed to update budget" });
    }
  });

  // Delete a budget
  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting budget:", error);
        return res.status(500).json({ error: "Failed to delete budget" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ error: "Failed to delete budget" });
    }
  });



  // Get task parameter values with expression templates
  app.get("/api/task-parameter-values", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select(`
          name, 
          label,
          task_parameters!inner(expression_template)
        `);
      
      if (error) {
        console.error("Error fetching task parameter values:", error);
        return res.status(500).json({ error: "Failed to fetch task parameter values" });
      }
      
      // Flatten the data structure to include expression_template directly
      const flattenedData = data?.map(item => ({
        name: item.name,
        label: item.label,
        expression_template: item.task_parameters?.expression_template || null
      })) || [];

      res.json(flattenedData);
    } catch (error) {
      console.error("Error fetching task parameter values:", error);
      res.status(500).json({ error: "Failed to fetch task parameter values" });
    }
  });

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

      // Update user_data table - now includes first_name, last_name, birthdate and country
      if (birthdate !== undefined || country !== undefined || first_name !== undefined || last_name !== undefined) {
        // Check if user_data record exists
        const { data: existingData } = await supabase
          .from('user_data')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const updateData: any = {};
        if (birthdate !== undefined && birthdate !== "") updateData.birthdate = birthdate;
        if (country !== undefined && country !== "") updateData.country = country;
        if (first_name !== undefined && first_name !== "") updateData.first_name = first_name;
        if (last_name !== undefined && last_name !== "") updateData.last_name = last_name;

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

      // Update users table for user profile fields (excluding first_name/last_name which are now in user_data)
      if (full_name !== undefined || avatar_url !== undefined) {
        const userUpdateData: any = {};
        if (full_name !== undefined) userUpdateData.full_name = full_name;
        if (avatar_url !== undefined) userUpdateData.avatar_url = avatar_url;

        if (Object.keys(userUpdateData).length > 0) {
          const { error } = await supabase
            .from('users')
            .update(userUpdateData)
            .eq('auth_id', user_id);

          if (error) {
            console.error("Error updating users table:", error);
          } else {
            console.log("Updated users table successfully");
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

      const { data, error } = await supabase
        .from('user_organization_preferences')
        .select('*')
        .eq('user_id', user_id)
        .eq('organization_id', organization_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return res.status(404).json({ error: "Preferences not found" });
        }
        console.error("Error fetching user organization preferences:", error);
        return res.status(500).json({ error: "Failed to fetch organization preferences" });
      }

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
      const user_id = req.headers['x-user-id'];

      if (!organization_id || !user_id) {
        return res.status(400).json({ error: "Missing organization_id or user_id" });
      }

      console.log(`Updating organization for user ${user_id} to ${organization_id}`);

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client (same as current-user endpoint)
      const authenticatedSupabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

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

      console.log("🔧 Updating user organization preferences", { user_id, organization_id, last_project_id });

      const { data, error } = await supabase
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

      console.log("🔧 Successfully updated user organization preferences", data);
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

      console.log("🔧 Getting user organization preferences", { user_id, organizationId });

      const { data, error } = await supabase
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

      console.log("🔧 Found user organization preferences", data);
      res.json(data);
    } catch (error) {
      console.error("Error getting organization preferences:", error);
      res.status(500).json({ error: "Failed to get organization preferences" });
    }
  });

  // Create design phase task endpoint
  app.post("/api/design-phase-tasks", async (req, res) => {
    try {
      const {
        project_phase_id,
        name,
        description,
        start_date,
        end_date,
        assigned_to,
        status,
        priority,
        created_by
      } = req.body;

      if (!project_phase_id || !name || !created_by) {
        return res.status(400).json({ error: "Missing required fields: project_phase_id, name, created_by" });
      }

      // Get the highest position for ordering
      const { data: existingTasks } = await supabase
        .from('design_phase_tasks')
        .select('position')
        .eq('project_phase_id', project_phase_id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingTasks && existingTasks.length > 0 ? existingTasks[0].position + 1 : 1;

      const { data, error } = await supabase
        .from('design_phase_tasks')
        .insert({
          project_phase_id,
          name,
          description,
          start_date,
          end_date,
          assigned_to,
          status: status || 'pendiente',
          priority: priority || 'media',
          position: nextPosition,
          is_active: true,
          created_by
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating design phase task:", error);
        return res.status(500).json({ error: "Failed to create design phase task" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error creating design phase task:", error);
      res.status(500).json({ error: "Failed to create design phase task" });
    }
  });

  // Bulk movements import endpoint
  app.post("/api/movements/bulk", async (req, res) => {
    try {
      const { movements, user_token } = req.body;

      if (!movements || !Array.isArray(movements)) {
        return res.status(400).json({ error: "Missing or invalid movements array" });
      }

      console.log('Received bulk movements:', movements.length);

      // Use user's token to bypass RLS with proper user context
      let clientToUse = supabase;
      if (user_token) {
        // Create a client with the user's session token
        clientToUse = createClient(supabaseUrl!, supabaseServiceKey!, {
          global: {
            headers: {
              Authorization: `Bearer ${user_token}`
            }
          }
        });
      }

      const { data, error } = await clientToUse
        .from('movements')
        .insert(movements)
        .select();

      if (error) {
        console.error("Error inserting bulk movements:", error);
        return res.status(500).json({ error: "Failed to insert movements", details: error.message });
      }

      console.log('Successfully inserted movements:', data?.length);
      res.json({ success: true, insertedCount: data?.length || 0, data });
    } catch (error) {
      console.error("Error in bulk movements endpoint:", error);
      res.status(500).json({ error: "Failed to process bulk movements" });
    }
  });

  // Movement Subcontracts routes
  app.post("/api/movement-subcontracts", async (req, res) => {
    try {
      const { movement_id, subcontract_id, amount } = req.body;

      if (!movement_id || !subcontract_id) {
        return res.status(400).json({ error: "Movement ID and subcontract ID are required" });
      }

      const { data, error } = await supabase
        .from('movement_subcontracts')
        .insert({ movement_id, subcontract_id, amount })
        .select()
        .single();

      if (error) {
        console.error("Error creating movement subcontract:", error);
        return res.status(500).json({ error: "Failed to create movement subcontract" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error in movement subcontracts endpoint:", error);
      res.status(500).json({ error: "Failed to process movement subcontract" });
    }
  });

  app.get("/api/movement-subcontracts", async (req, res) => {
    try {
      const { movement_id } = req.query;

      let query = supabase.from('movement_subcontracts').select('*');
      
      if (movement_id) {
        query = query.eq('movement_id', movement_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching movement subcontracts:", error);
        return res.status(500).json({ error: "Failed to fetch movement subcontracts" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching movement subcontracts:", error);
      res.status(500).json({ error: "Failed to fetch movement subcontracts" });
    }
  });

  app.delete("/api/movement-subcontracts/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('movement_subcontracts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting movement subcontract:", error);
        return res.status(500).json({ error: "Failed to delete movement subcontract" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting movement subcontract:", error);
      res.status(500).json({ error: "Failed to delete movement subcontract" });
    }
  });

  app.delete("/api/movement-subcontracts/by-movement/:movementId", async (req, res) => {
    try {
      const { movementId } = req.params;

      const { error } = await supabase
        .from('movement_subcontracts')
        .delete()
        .eq('movement_id', movementId);

      if (error) {
        console.error("Error deleting movement subcontracts:", error);
        return res.status(500).json({ error: "Failed to delete movement subcontracts" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting movement subcontracts:", error);
      res.status(500).json({ error: "Failed to delete movement subcontracts" });
    }
  });

  // Subcontract Bids Routes
  app.get("/api/subcontract-bids/:subcontractId", async (req, res) => {
    try {
      const { subcontractId } = req.params;

      const { data: bids, error } = await supabase
        .from('subcontract_bids')
        .select(`
          *,
          contacts:contact_id(id, company_name, full_name, first_name, last_name),
          currencies:currency_id(id, code, name)
        `)
        // Note: subcontract_bids table doesn't have subcontract_id per real schema
        // For now, get all bids - need to clarify relationship
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching subcontract bids:", error);
        return res.status(500).json({ error: "Failed to fetch subcontract bids" });
      }

      res.json(bids || []);
    } catch (error) {
      console.error("Error fetching subcontract bids:", error);
      res.status(500).json({ error: "Failed to fetch subcontract bids" });
    }
  });

  app.post("/api/subcontract-bids", async (req, res) => {
    try {
      const bidData = req.body;

      const { data: bid, error } = await supabase
        .from('subcontract_bids')
        .insert([bidData])
        .select()
        .single();

      if (error) {
        console.error("Error creating subcontract bid:", error);
        return res.status(500).json({ error: "Failed to create subcontract bid" });
      }

      res.status(201).json(bid);
    } catch (error) {
      console.error("Error creating subcontract bid:", error);
      res.status(500).json({ error: "Failed to create subcontract bid" });
    }
  });

  app.patch("/api/subcontract-bids/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data: bid, error } = await supabase
        .from('subcontract_bids')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating subcontract bid:", error);
        return res.status(500).json({ error: "Failed to update subcontract bid" });
      }

      res.json(bid);
    } catch (error) {
      console.error("Error updating subcontract bid:", error);
      res.status(500).json({ error: "Failed to update subcontract bid" });
    }
  });

  app.delete("/api/subcontract-bids/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('subcontract_bids')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting subcontract bid:", error);
        return res.status(500).json({ error: "Failed to delete subcontract bid" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subcontract bid:", error);
      res.status(500).json({ error: "Failed to delete subcontract bid" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
