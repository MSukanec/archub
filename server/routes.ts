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
  
  // Handle new user registration (called after Supabase auth signup)
  app.post("/api/auth/register-user", async (req, res) => {
    try {
      const { auth_id, email, full_name } = req.body;

      if (!auth_id || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log("Creating new user record:", { auth_id, email, full_name });

      // Create user in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          auth_id,
          email,
          full_name: full_name || '',
          avatar_url: '',
          avatar_source: ''
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating user:", userError);
        return res.status(500).json({ error: "Failed to create user record" });
      }

      // Create user_data record
      const { error: userDataError } = await supabase
        .from('user_data')
        .insert({
          user_id: userData.id,
          first_name: '',
          last_name: '',
          country: null,
          birthdate: null
        });

      if (userDataError) {
        console.error("Error creating user_data:", userDataError);
      }

      // Create user_preferences record
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userData.id,
          theme: 'light',
          sidebar_docked: false,
          onboarding_completed: false
        });

      if (preferencesError) {
        console.error("Error creating user_preferences:", preferencesError);
      }

      res.json({ success: true, user: userData });
    } catch (error) {
      console.error("Error in register-user:", error);
      res.status(500).json({ error: "Database error saving new user" });
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

  // Select organization endpoint
  app.post("/api/user/select-organization", async (req, res) => {
    try {
      const { organization_id } = req.body;
      const user_id = req.headers['x-user-id']; // You'll need to pass this from frontend

      if (!organization_id || !user_id) {
        return res.status(400).json({ error: "Missing organization_id or user_id" });
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organization_id })
        .eq('user_id', user_id);

      if (error) {
        console.error("Error updating last_organization_id:", error);
        return res.status(500).json({ error: "Failed to update organization selection" });
      }

      res.json({ success: true, message: "Organization selected successfully" });
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

  const httpServer = createServer(app);

  return httpServer;
}
