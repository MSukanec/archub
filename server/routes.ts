import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

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

  // Get all countries (public reference data, no auth required)
  app.get("/api/countries", async (req, res) => {
    try {
      const { data: countries, error } = await supabase
        .from("countries")
        .select("id, name, country_code, alpha_3")
        .order("name");

      if (error) {
        console.error("Error fetching countries:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.json(countries || []);
    } catch (err: any) {
      console.error("Countries API error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user data
  app.get("/api/current-user", async (req, res) => {
    try {
      
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
      
      // Debug: RPC call completed
      
      if (error) {
        console.error("Error fetching current user:", error);
        
        // Special handling for newly registered users who might not have complete data yet
        if (error.message && error.message.includes('organization')) {
          console.log("User appears to be newly registered without complete organization data");
          return res.status(404).json({ error: "User not found" });
        }
        
        return res.status(500).json({ error: "Failed to fetch user data", details: error });
      }
      
      if (!userData) {
        console.log("No user data found");
        return res.status(404).json({ error: "User not found" });
      }
      
      // Enhance organizations array with logo_url
      if (userData.organizations && Array.isArray(userData.organizations)) {

        
        // Get organization IDs for bulk query
        const orgIds = userData.organizations.map((org: any) => org.id);
        
        // Fetch logo_url for all organizations in one query
        const { data: orgLogos, error: logoError } = await authenticatedSupabase
          .from('organizations')
          .select('id, logo_url')
          .in('id', orgIds);
          
        if (!logoError && orgLogos) {
          // Create a map for quick lookup
          const logoMap = new Map(orgLogos.map((org: any) => [org.id, org.logo_url]));
          
          // Add logo_url to each organization
          userData.organizations = userData.organizations.map((org: any) => ({
            ...org,
            logo_url: logoMap.get(org.id) || null
          }));
          

        } else {
          console.error("Error fetching organization logos:", logoError);
        }
      }
      
      // User data retrieved successfully
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

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data: budgets, error } = await authenticatedSupabase
        .from('budgets')
        .select(`
          *,
          currency:currencies!currency_id(id, code, name, symbol)
        `)
        .eq('project_id', project_id)
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching budgets:", error);
        return res.status(500).json({ error: "Failed to fetch budgets" });
      }

      // Calcular el total para cada presupuesto
      const budgetsWithTotals = await Promise.all(
        (budgets || []).map(async (budget) => {
          const { data: items, error: itemsError } = await authenticatedSupabase
            .from('budget_items')
            .select(`
              unit_price, 
              quantity, 
              markup_pct, 
              tax_pct
            `)
            .eq('budget_id', budget.id);

          if (itemsError) {
            console.error(`Error fetching items for budget ${budget.id}:`, itemsError);
            return { ...budget, total: 0 };
          }

          let total = 0;

          // Calcular totales para cada item
          for (const item of items || []) {
            const quantity = item.quantity || 1;
            
            // Calcular el total del item (con markup y tax)
            const subtotal = (item.unit_price || 0) * quantity;
            const markupAmount = subtotal * ((item.markup_pct || 0) / 100);
            const taxableAmount = subtotal + markupAmount;
            const taxAmount = taxableAmount * ((item.tax_pct || 0) / 100);
            const itemTotal = taxableAmount + taxAmount;
            total += itemTotal;
          }

          return { 
            ...budget, 
            total
          };
        })
      );

      res.json(budgetsWithTotals);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  // Create a new budget
  app.post("/api/budgets", async (req, res) => {
    try {
      const budgetData = req.body;

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data: budget, error } = await authenticatedSupabase
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

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data: budget, error } = await authenticatedSupabase
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

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { error } = await authenticatedSupabase
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

  // ========== BUDGET ITEMS ENDPOINTS ==========

  // Get budget items for a budget
  app.get("/api/budget-items", async (req, res) => {
    try {
      const { budget_id, organization_id } = req.query;
      
      if (!budget_id || !organization_id) {
        return res.status(400).json({ error: "budget_id and organization_id are required" });
      }

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data: budgetItems, error } = await authenticatedSupabase
        .from('budget_items_view')
        .select('*, position')
        .eq('budget_id', budget_id)
        .eq('organization_id', organization_id)
        .order('position', { ascending: true })
        .order('division_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching budget items:", error);
        return res.status(500).json({ error: "Failed to fetch budget items" });
      }

      res.json(budgetItems || []);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ error: "Failed to fetch budget items" });
    }
  });

  // Get organization task prices from ORGANIZATION_TASK_PRICES_VIEW
  app.get("/api/organization-task-prices", async (req, res) => {
    try {
      const { organization_id, task_id } = req.query;
      
      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      let query = authenticatedSupabase
        .from('organization_task_prices_view')
        .select('*')
        .eq('organization_id', organization_id);

      // If task_id is provided, filter by it (for single task lookup)
      if (task_id) {
        query = query.eq('task_id', task_id).maybeSingle();
        
        const { data: taskPrice, error } = await query;
        
        if (error) {
          console.error("Error fetching organization task price:", error);
          return res.status(500).json({ error: "Failed to fetch organization task price" });
        }

        return res.json(taskPrice);
      } else {
        // Return all task prices for the organization
        query = query.order('created_at', { ascending: false });
        
        const { data: taskPrices, error } = await query;
        
        if (error) {
          console.error("Error fetching organization task prices:", error);
          return res.status(500).json({ error: "Failed to fetch organization task prices" });
        }

        return res.json(taskPrices || []);
      }
    } catch (error) {
      console.error("Error fetching organization task prices:", error);
      res.status(500).json({ error: "Failed to fetch organization task prices" });
    }
  });

  // Create a new budget item
  app.post("/api/budget-items", async (req, res) => {
    try {
      const budgetItemData = req.body;

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data: budgetItem, error } = await authenticatedSupabase
        .from('budget_items')
        .insert(budgetItemData)
        .select()
        .single();

      if (error) {
        console.error("Error creating budget item:", error);
        return res.status(500).json({ error: "Failed to create budget item" });
      }

      res.json(budgetItem);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(500).json({ error: "Failed to create budget item" });
    }
  });

  // Update a budget item
  app.patch("/api/budget-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data: budgetItem, error } = await authenticatedSupabase
        .from('budget_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating budget item:", error);
        return res.status(500).json({ error: "Failed to update budget item" });
      }

      res.json(budgetItem);
    } catch (error) {
      console.error("Error updating budget item:", error);
      res.status(500).json({ error: "Failed to update budget item" });
    }
  });

  // Delete a budget item
  app.delete("/api/budget-items/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { error } = await authenticatedSupabase
        .from('budget_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting budget item:", error);
        return res.status(500).json({ error: "Failed to delete budget item" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting budget item:", error);
      res.status(500).json({ error: "Failed to delete budget item" });
    }
  });

  // Move budget item (reorder)
  app.post("/api/budget-items/move", async (req, res) => {
    try {
      const { budget_id, item_id, prev_item_id, next_item_id } = req.body;

      if (!budget_id || !item_id) {
        return res.status(400).json({ error: "budget_id and item_id are required" });
      }

      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Create an authenticated Supabase client
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

      const { data, error } = await authenticatedSupabase.rpc('budget_item_move', {
        p_budget_id: budget_id,
        p_item_id: item_id,
        p_prev_item_id: prev_item_id,
        p_next_item_id: next_item_id,
      });

      if (error) {
        console.error("Error moving budget item:", error);
        return res.status(500).json({ error: "Failed to move budget item" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error moving budget item:", error);
      res.status(500).json({ error: "Failed to move budget item" });
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

      // Fetching user organization preferences

      // First try to get existing preferences
      const { data, error } = await supabase
        .from('user_organization_preferences')
        .select('*')
        .eq('user_id', user_id)
        .eq('organization_id', organization_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          console.log("🔧 No preferences found, creating default ones for new user");
          
          // Create default preferences for new user
          const { data: newPreferences, error: createError } = await supabase
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

      // Found user organization preferences successfully
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
        .eq('subcontract_id', subcontractId)
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

  app.put("/api/subcontract-bids", async (req, res) => {
    try {
      const bidData = req.body;
      const { id, created_by, created_at, updated_at, ...updateData } = bidData;

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

  app.delete("/api/subcontract-bids/:bidId", async (req, res) => {
    try {
      const { bidId } = req.params;
      
      console.log("Attempting to delete bid:", bidId);

      // Primero, obtener información sobre el subcontrato relacionado
      const { data: bid, error: bidError } = await supabase
        .from('subcontract_bids')
        .select('subcontract_id')
        .eq('id', bidId)
        .single();

      if (bidError || !bid) {
        console.error("Error finding bid:", bidError);
        return res.status(404).json({ error: "Bid not found" });
      }

      // Verificar si este bid es el ganador del subcontrato
      const { data: subcontract, error: subcontractError } = await supabase
        .from('subcontracts')
        .select('winner_bid_id')
        .eq('id', bid.subcontract_id)
        .single();

      if (subcontractError) {
        console.error("Error finding subcontract:", subcontractError);
        return res.status(500).json({ error: "Failed to check subcontract" });
      }

      // Si es la oferta ganadora, limpiar la referencia primero
      if (subcontract.winner_bid_id === bidId) {
        console.log("Cleaning winner reference for bid:", bidId);
        const { error: updateError } = await supabase
          .from('subcontracts')
          .update({ 
            winner_bid_id: null,
            status: 'active'
          })
          .eq('id', bid.subcontract_id);

        if (updateError) {
          console.error("Error updating subcontract:", updateError);
          return res.status(500).json({ error: "Failed to update subcontract" });
        }
      }

      // Ahora eliminar la oferta
      const { error } = await supabase
        .from('subcontract_bids')
        .delete()
        .eq('id', bidId);

      if (error) {
        console.error("Error deleting subcontract bid:", error);
        return res.status(500).json({ error: "Failed to delete subcontract bid" });
      }

      console.log("Successfully deleted bid:", bidId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subcontract bid:", error);
      res.status(500).json({ error: "Failed to delete subcontract bid" });
    }
  });

  // Subcontract Tasks Routes
  app.get("/api/subcontract-tasks/:subcontractId", async (req, res) => {
    try {
      const { subcontractId } = req.params;

      // Obtener las tareas del subcontrato
      const { data: subcontractTasks, error } = await supabase
        .from('subcontract_tasks')
        .select(`
          id,
          subcontract_id,
          task_id,
          unit,
          amount,
          notes,
          created_at
        `)
        .eq('subcontract_id', subcontractId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching subcontract tasks:", error);
        return res.status(500).json({ error: "Failed to fetch subcontract tasks" });
      }

      if (!subcontractTasks || subcontractTasks.length === 0) {
        return res.json([]);
      }

      // Obtener información de las tareas usando construction_tasks_view
      const taskIds = subcontractTasks.map(item => item.task_id);
      
      const { data: constructionTasks, error: taskError } = await supabase
        .from('construction_tasks_view')
        .select('*')
        .in('id', taskIds);

      if (taskError) {
        console.error('Error fetching construction tasks:', taskError);
      }

      // Combinar los datos
      const combinedData = subcontractTasks.map(subcontractTask => {
        const constructionTask = constructionTasks?.find(task => task.id === subcontractTask.task_id);
        
        return {
          ...subcontractTask,
          task_name: constructionTask?.display_name || constructionTask?.name_rendered || constructionTask?.name || 'Sin nombre',
          task_description: constructionTask?.description || '',
          unit_symbol: constructionTask?.unit_symbol || constructionTask?.unit || 'Sin unidad',
          rubro_name: constructionTask?.rubro_name || 'Sin rubro'
        };
      });

      res.json(combinedData);
    } catch (error) {
      console.error("Error fetching subcontract tasks:", error);
      res.status(500).json({ error: "Failed to fetch subcontract tasks" });
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

  // PUT /api/subcontracts/:id/award - Complete subcontract award process
  app.put("/api/subcontracts/:id/award", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.substring(7);
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

      const { id } = req.params;
      const { winner_bid_id, amount_total, currency_id } = req.body;

      if (!winner_bid_id || !amount_total || !currency_id) {
        return res.status(400).json({ 
          error: "winner_bid_id, amount_total, and currency_id are required" 
        });
      }

      // Get subcontract info to find organization
      const { data: subcontractInfo, error: subcontractInfoError } = await authenticatedSupabase
        .from('subcontracts')
        .select('organization_id')
        .eq('id', id)
        .single();

      if (subcontractInfoError) {
        return res.status(500).json({ 
          error: "Failed to get subcontract info", 
          details: subcontractInfoError 
        });
      }

      // Find the organization_currency_id for this currency
      const { data: orgCurrency, error: orgCurrencyError } = await authenticatedSupabase
        .from('organization_currencies')
        .select('id')
        .eq('organization_id', subcontractInfo.organization_id)
        .eq('currency_id', currency_id)
        .single();

      if (orgCurrencyError) {
        console.error("Organization currency not found:", orgCurrencyError);
        return res.status(400).json({ 
          error: "Currency not available for this organization", 
          details: orgCurrencyError 
        });
      }

      // Get the contact_id from the winning bid
      const { data: winningBidData, error: winningBidError } = await authenticatedSupabase
        .from('subcontract_bids')
        .select('contact_id')
        .eq('id', winner_bid_id)
        .single();

      if (winningBidError) {
        console.error("Error getting winning bid contact:", winningBidError);
        return res.status(500).json({ 
          error: "Failed to get winning bid contact", 
          details: winningBidError 
        });
      }

      // Perform all updates in sequence for the award process
      
      // 1. Update the subcontract with award details including contact_id
      const { data: subcontractData, error: subcontractError } = await authenticatedSupabase
        .from('subcontracts')
        .update({ 
          winner_bid_id,
          amount_total,
          currency_id: orgCurrency.id,  // Use organization_currency_id
          contact_id: winningBidData.contact_id, // Save the contact from winning bid
          status: 'awarded'
        })
        .eq('id', id)
        .select()
        .single();

      if (subcontractError) {
        console.error("Error updating subcontract:", subcontractError);
        return res.status(500).json({ 
          error: "Failed to update subcontract", 
          details: subcontractError 
        });
      }

      // 2. Update the winning bid status
      const { error: winningBidUpdateError } = await authenticatedSupabase
        .from('subcontract_bids')
        .update({ status: 'awarded' })
        .eq('id', winner_bid_id);

      if (winningBidUpdateError) {
        console.error("Error updating winning bid:", winningBidUpdateError);
        return res.status(500).json({ 
          error: "Failed to update winning bid status", 
          details: winningBidUpdateError 
        });
      }

      // 3. Update other bids status to 'rejected'
      const { error: otherBidsError } = await authenticatedSupabase
        .from('subcontract_bids')
        .update({ status: 'rejected' })
        .eq('subcontract_id', id)
        .neq('id', winner_bid_id);

      if (otherBidsError) {
        console.error("Error updating other bids:", otherBidsError);
        // Don't fail the whole operation for this
      }

      res.json({ 
        success: true, 
        data: subcontractData,
        message: "Subcontract awarded successfully"
      });

    } catch (error) {
      console.error("Error in award endpoint:", error);
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // POST /api/subcontract-bid-tasks - Save tasks for a subcontract bid
  app.post("/api/subcontract-bid-tasks", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.substring(7);
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

      const { bidId, tasks } = req.body;

      if (!bidId || !Array.isArray(tasks)) {
        return res.status(400).json({ error: "bidId and tasks array are required" });
      }

      // First, delete existing tasks for this bid
      const { error: deleteError } = await authenticatedSupabase
        .from('subcontract_bid_tasks')
        .delete()
        .eq('subcontract_bid_id', bidId);

      if (deleteError) {
        console.error("Error deleting existing bid tasks:", deleteError);
        return res.status(500).json({ error: "Failed to clear existing tasks", details: deleteError });
      }

      // Then insert new tasks if any
      if (tasks.length > 0) {
        const { data, error: insertError } = await authenticatedSupabase
          .from('subcontract_bid_tasks')
          .insert(tasks)
          .select();

        if (insertError) {
          console.error("Error inserting bid tasks:", insertError);
          return res.status(500).json({ error: "Failed to save bid tasks", details: insertError });
        }

        res.json({ success: true, data });
      } else {
        res.json({ success: true, data: [] });
      }

    } catch (error) {
      console.error("Error in subcontract-bid-tasks endpoint:", error);
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // POST /api/subcontract-bids/contacts - Get contacts for specific bid IDs
  app.post("/api/subcontract-bids/contacts", async (req, res) => {
    try {
      const { bidIds } = req.body;
      
      if (!bidIds || !Array.isArray(bidIds) || bidIds.length === 0) {
        return res.json([]);
      }

      const { data: contacts, error } = await supabase
        .from('subcontract_bids')
        .select(`
          id,
          contacts:contact_id (
            id,
            first_name,
            last_name,
            full_name,
            email,
            company_name
          )
        `)
        .in('id', bidIds);

      if (error) {
        console.error("Error fetching winner contacts:", error);
        return res.status(500).json({ error: "Failed to fetch winner contacts" });
      }

      // Transformar los datos para incluir bid_id
      const transformedContacts = contacts?.map(bid => ({
        bid_id: bid.id,
        ...bid.contacts
      })) || [];

      res.json(transformedContacts);
    } catch (error) {
      console.error("Error fetching winner contacts:", error);
      res.status(500).json({ error: "Failed to fetch winner contacts" });
    }
  });

  // DELETE /api/subcontracts/:id - Delete subcontract with all dependencies
  app.delete("/api/subcontracts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log("Attempting to delete subcontract:", id);

      // Primero obtener las ofertas del subcontrato
      const { data: bids, error: getBidsError } = await supabase
        .from('subcontract_bids')
        .select('id')
        .eq('subcontract_id', id);

      if (getBidsError) {
        console.error("Error getting bids:", getBidsError);
        return res.status(500).json({ error: "Failed to get bids" });
      }

      // Eliminar las tareas de las ofertas si existen ofertas
      if (bids && bids.length > 0) {
        const bidIds = bids.map(bid => bid.id);
        const { error: bidTasksError } = await supabase
          .from('subcontract_bid_tasks')
          .delete()
          .in('subcontract_bid_id', bidIds);

        if (bidTasksError) {
          console.error("Error deleting bid tasks:", bidTasksError);
          return res.status(500).json({ error: "Failed to delete bid tasks" });
        }
      }

      // Luego eliminar todas las ofertas (subcontract_bids)
      const { error: bidsError } = await supabase
        .from('subcontract_bids')
        .delete()
        .eq('subcontract_id', id);

      if (bidsError) {
        console.error("Error deleting bids:", bidsError);
        return res.status(500).json({ error: "Failed to delete bids" });
      }

      // Eliminar las tareas del subcontrato (subcontract_tasks)
      const { error: tasksError } = await supabase
        .from('subcontract_tasks')
        .delete()
        .eq('subcontract_id', id);

      if (tasksError) {
        console.error("Error deleting subcontract tasks:", tasksError);
        return res.status(500).json({ error: "Failed to delete subcontract tasks" });
      }

      // Finalmente eliminar el subcontrato
      const { error } = await supabase
        .from('subcontracts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting subcontract:", error);
        return res.status(500).json({ error: "Failed to delete subcontract" });
      }

      console.log("Successfully deleted subcontract:", id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subcontract:", error);
      res.status(500).json({ error: "Failed to delete subcontract" });
    }
  });

  // POST /api/lessons/:lessonId/progress - Mark lesson progress/complete
  app.post("/api/lessons/:lessonId/progress", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { progress_pct, last_position_sec, completed_at, is_completed } = req.body;
      
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get current user from Supabase Auth
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get user from users table by auth_id
      const { data: existingUser, error: userLookupError } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (userLookupError || !existingUser) {
        console.error("User not found in users table:", user.id, userLookupError);
        return res.status(404).json({ error: "User not found in database" });
      }
      
      // Use the CORRECT user_id from users table
      const dbUserId = existingUser.id;
      
      // Upsert progress
      // Auto-complete when progress >= 95%
      const normalizedProgress = progress_pct || 0;
      const shouldAutoComplete = normalizedProgress >= 95;
      const finalIsCompleted = is_completed !== undefined ? is_completed : shouldAutoComplete;
      const finalCompletedAt = (finalIsCompleted || shouldAutoComplete) ? (completed_at || new Date().toISOString()) : null;
      
      const { data, error } = await authenticatedSupabase
        .from('course_lesson_progress')
        .upsert({
          user_id: dbUserId,
          lesson_id: lessonId,
          progress_pct: normalizedProgress,
          last_position_sec: last_position_sec || 0,
          completed_at: finalCompletedAt,
          is_completed: finalIsCompleted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error upserting lesson progress:", error);
        return res.status(500).json({ error: "Failed to update progress" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // GET /api/courses/:courseId/progress - Get all lesson progress for a course
  app.get("/api/courses/:courseId/progress", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get current user
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
      
      // Get all modules for the course
      const { data: modules, error: modulesError } = await authenticatedSupabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modulesError || !modules) {
        console.error("Error fetching modules:", modulesError);
        return res.status(500).json({ error: "Failed to fetch course modules" });
      }
      
      const moduleIds = modules.map(m => m.id);
      
      if (moduleIds.length === 0) {
        return res.json([]);
      }
      
      // Get all lessons for these modules
      const { data: lessons, error: lessonsError } = await authenticatedSupabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);
      
      if (lessonsError || !lessons) {
        console.error("Error fetching lessons:", lessonsError);
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }
      
      const lessonIds = lessons.map(l => l.id);
      
      if (lessonIds.length === 0) {
        return res.json([]);
      }
      
      // Get progress for all lessons
      const { data: progress, error: progressError } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id)
        .in('lesson_id', lessonIds);
      
      if (progressError) {
        console.error("Error fetching progress:", progressError);
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // GET /api/lessons/:lessonId/notes - Get all notes for a lesson
  app.get("/api/lessons/:lessonId/notes", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: notes, error } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notes:", error);
        return res.status(500).json({ error: "Failed to fetch notes" });
      }
      
      res.json(notes || []);
    } catch (error) {
      console.error("Error fetching lesson notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // POST /api/lessons/:lessonId/notes - Create or update a lesson note
  app.post("/api/lessons/:lessonId/notes", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { body, time_sec, is_pinned } = req.body;
      
      if (body === undefined || typeof body !== 'string') {
        return res.status(400).json({ error: "Body must be a string" });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { data: existingNote } = await authenticatedSupabase
        .from('course_lesson_notes')
        .select('*')
        .eq('user_id', dbUser.id)
        .eq('lesson_id', lessonId)
        .is('time_sec', null)
        .single();
      
      let noteData;
      
      if (existingNote) {
        const { data, error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .update({
            body,
            is_pinned: is_pinned ?? false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating note:", error);
          return res.status(500).json({ error: "Failed to update note" });
        }
        
        noteData = data;
      } else {
        const { data, error } = await authenticatedSupabase
          .from('course_lesson_notes')
          .insert({
            user_id: dbUser.id,
            lesson_id: lessonId,
            body,
            time_sec: time_sec || null,
            is_pinned: is_pinned ?? false
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating note:", error);
          return res.status(500).json({ error: "Failed to create note" });
        }
        
        noteData = data;
      }
      
      res.json(noteData);
    } catch (error) {
      console.error("Error saving lesson note:", error);
      res.status(500).json({ error: "Failed to save note" });
    }
  });

  // GET /api/user/all-progress - Get all lesson progress for current user
  app.get("/api/user/all-progress", async (req, res) => {
    try {
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get current user
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
      
      // Get all progress for this user
      const { data: progress, error: progressError } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select('*')
        .eq('user_id', dbUser.id);
      
      if (progressError) {
        console.error("Error fetching user progress:", progressError);
        return res.status(500).json({ error: "Failed to fetch progress" });
      }
      
      console.log('📊 /api/user/all-progress returning:', JSON.stringify(progress, null, 2));
      
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // GET /api/user/enrollments - Get all course enrollments for current user
  app.get("/api/user/enrollments", async (req, res) => {
    try {
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get current auth user
      const { data: { user: authUser }, error: authUserError } = await authenticatedSupabase.auth.getUser();
      
      if (authUserError || !authUser || !authUser.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the user record from the users table using auth_id
      const { data: userRecord, error: userRecordError } = await authenticatedSupabase
        .from('users')
        .select('id, email')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      
      if (userRecordError || !userRecord) {
        console.error("Error fetching user record:", userRecordError);
        return res.json([]);
      }
      
      // Get all enrollments for this user with course slug
      const { data: enrollments, error: enrollmentsError} = await authenticatedSupabase
        .from('course_enrollments')
        .select('*, courses(slug)')
        .eq('user_id', userRecord.id);
      
      if (enrollmentsError) {
        console.error("Error fetching user enrollments:", enrollmentsError);
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }
      
      // Flatten the course slug
      const formattedEnrollments = (enrollments || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      res.json(formattedEnrollments);
    } catch (error) {
      console.error("Error fetching user enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // GET /api/learning/dashboard - Consolidated endpoint for dashboard data
  app.get("/api/learning/dashboard", async (req, res) => {
    try {
      // Get the authorization token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get current user
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
        return res.json({
          enrollments: [],
          progress: [],
          courseLessons: [],
          recentCompletions: []
        });
      }
      
      // Execute all queries in parallel for maximum speed
      const [enrollmentsResult, progressResult, courseLessonsResult, recentCompletionsResult] = await Promise.all([
        // Get enrollments with course slug
        authenticatedSupabase
          .from('course_enrollments')
          .select('*, courses(slug)')
          .eq('user_id', dbUser.id),
        
        // Get all progress
        authenticatedSupabase
          .from('course_lesson_progress')
          .select('*')
          .eq('user_id', dbUser.id),
        
        // Get all active course lessons with course info
        authenticatedSupabase
          .from('course_lessons')
          .select('id, module_id, course_modules!inner(course_id)')
          .eq('is_active', true),
        
        // Get recent completions (last 10) with lesson and course details
        authenticatedSupabase
          .from('course_lesson_progress')
          .select(`
            *,
            course_lessons!inner(
              id,
              title,
              course_modules!inner(
                id,
                title,
                course_id,
                courses!inner(
                  id,
                  title,
                  slug
                )
              )
            )
          `)
          .eq('user_id', dbUser.id)
          .eq('is_completed', true)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(10)
      ]);
      
      // Check for errors
      if (enrollmentsResult.error) {
        console.error("Error fetching enrollments:", enrollmentsResult.error);
        throw enrollmentsResult.error;
      }
      
      if (progressResult.error) {
        console.error("Error fetching progress:", progressResult.error);
        throw progressResult.error;
      }
      
      if (courseLessonsResult.error) {
        console.error("Error fetching course lessons:", courseLessonsResult.error);
        throw courseLessonsResult.error;
      }
      
      if (recentCompletionsResult.error) {
        console.error("Error fetching recent completions:", recentCompletionsResult.error);
        throw recentCompletionsResult.error;
      }
      
      // Format enrollments to flatten course slug
      const formattedEnrollments = (enrollmentsResult.data || []).map((e: any) => ({
        ...e,
        course_slug: e.courses?.slug
      }));
      
      // Format recent completions to extract nested data
      const formattedCompletions = (recentCompletionsResult.data || []).map((completion: any) => {
        const lesson = completion.course_lessons;
        const module = lesson?.course_modules;
        const course = module?.courses;
        
        return {
          id: completion.id,
          completed_at: completion.completed_at,
          lesson_title: lesson?.title || 'Sin título',
          module_title: module?.title || 'Sin módulo',
          course_title: course?.title || 'Sin curso',
          course_slug: course?.slug || '',
          lesson_id: lesson?.id,
          module_id: module?.id,
          course_id: course?.id
        };
      });
      
      // Return consolidated data
      res.json({
        enrollments: formattedEnrollments,
        progress: progressResult.data || [],
        courseLessons: courseLessonsResult.data || [],
        recentCompletions: formattedCompletions
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ==================== MERCADO PAGO CHECKOUT & WEBHOOKS ====================
  
  // Create Mercado Pago preference with coupon support
  app.post("/api/checkout/mp/create", async (req, res) => {
    try {
      const { courseSlug, code } = req.body;

      if (!courseSlug) {
        return res.status(400).json({ error: "courseSlug is required" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.substring(7);

      // Get authenticated user
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

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Invalid authentication" });
      }

      // Get user profile (public.users id)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return res.status(404).json({ error: "User profile not found" });
      }

      // Get course data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, slug, title')
        .eq('slug', courseSlug)
        .single();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return res.status(404).json({ error: "Course not found" });
      }

      // Get course price
      const { data: priceData, error: priceError } = await supabase
        .from('course_prices')
        .select('*')
        .eq('course_id', course.id)
        .eq('currency_code', 'ARS')
        .or(`provider.eq.mercadopago,provider.eq.any`)
        .eq('is_active', true)
        .order('provider', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priceError || !priceData) {
        console.error('Error fetching price:', priceError);
        return res.status(404).json({ error: "Price not found for this course" });
      }

      let finalPrice = priceData.amount;
      let couponData: any = null;

      // Validate coupon if provided (server-side validation)
      if (code && code.trim()) {
        // Use authenticatedSupabase instead of supabase to preserve user context
        const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
          p_code: code.trim(),
          p_course_id: course.id,
          p_price: priceData.amount,
          p_currency: priceData.currency_code
        });

        if (couponError) {
          console.error('Error validating coupon:', couponError);
          return res.status(400).json({ error: "Error validating coupon" });
        }

        if (!validationResult || !validationResult.ok) {
          return res.status(400).json({ 
            error: "Invalid coupon", 
            reason: validationResult?.reason || 'UNKNOWN'
          });
        }

        // Coupon is valid
        couponData = validationResult;
        finalPrice = validationResult.final_price;
      }

      // Initialize Mercado Pago SDK
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error('MP_ACCESS_TOKEN not configured');
        return res.status(500).json({ error: "Payment gateway not configured" });
      }

      const client = new MercadoPagoConfig({ 
        accessToken: mpAccessToken
      });
      const preference = new Preference(client);

      // Prepare metadata
      const metadata: any = {
        course_id: course.id,
        course_slug: course.slug,
        user_id: profile.id,
        user_auth_id: user.id,
        list_price: priceData.amount,
        final_price: finalPrice
      };

      if (couponData) {
        metadata.coupon_code = code.trim().toUpperCase();
        metadata.coupon_id = couponData.coupon_id;
        metadata.discount = couponData.discount;
      }

      // Create preference
      const appUrl = process.env.APP_URL || process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:5000';

      const preferenceData = {
        items: [
          {
            id: course.id,
            title: course.title,
            quantity: 1,
            currency_id: 'ARS',
            unit_price: Number(finalPrice)
          }
        ],
        payer: {
          email: profile.email || user.email,
          name: profile.full_name
        },
        back_urls: {
          success: `${appUrl}/learning/payment-return?status=success&course=${courseSlug}`,
          failure: `${appUrl}/learning/payment-return?status=failure&course=${courseSlug}`,
          pending: `${appUrl}/learning/payment-return?status=pending&course=${courseSlug}`
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mp`,
        metadata: metadata
      };

      console.log('Creating MP preference:', {
        courseSlug,
        finalPrice,
        hasCoupon: !!couponData,
        userId: profile.id
      });

      const result = await preference.create({ body: preferenceData });

      res.json({
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
        preference_id: result.id
      });

    } catch (error: any) {
      console.error('Error creating MP preference:', error);
      res.status(500).json({ 
        error: "Failed to create payment preference",
        message: error.message 
      });
    }
  });

  // Free enrollment with 100% coupon
  app.post("/api/checkout/free-enroll", async (req, res) => {
    try {
      const { courseSlug, code } = req.body;
      const authHeader = req.headers.authorization || '';

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization header" });
      }

      const token = authHeader.substring(7);

      // Get authenticated user
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

      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Invalid authentication" });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return res.status(404).json({ error: "User profile not found" });
      }

      // Get course data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, slug, title')
        .eq('slug', courseSlug)
        .single();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return res.status(404).json({ error: "Course not found" });
      }

      // Validate coupon (must be 100% discount)
      if (!code || !code.trim()) {
        return res.status(400).json({ error: "Coupon code required for free enrollment" });
      }

      const { data: priceData } = await supabase
        .from('course_prices')
        .select('amount, currency_code')
        .eq('course_id', course.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const coursePrice = priceData?.amount || 0;

      // Validate coupon using authenticated client
      const { data: validationResult, error: couponError } = await authenticatedSupabase.rpc('validate_coupon', {
        p_code: code.trim(),
        p_course_id: course.id,
        p_price: coursePrice,
        p_currency: priceData?.currency_code || 'ARS'
      });

      if (couponError || !validationResult || !validationResult.ok) {
        console.error('Coupon validation failed:', couponError || validationResult);
        return res.status(400).json({ error: "Invalid coupon" });
      }

      // Verify it's actually 100% discount
      if (validationResult.final_price !== 0) {
        return res.status(400).json({ 
          error: "This coupon does not provide 100% discount. Please use the normal payment flow." 
        });
      }

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', profile.id)
        .eq('course_id', course.id)
        .maybeSingle();

      if (existingEnrollment) {
        return res.status(400).json({ error: "You are already enrolled in this course" });
      }

      // Create course enrollment
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year subscription

      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: profile.id,
          course_id: course.id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_method: 'coupon_100',
          amount_paid: 0,
          currency: priceData?.currency_code || 'ARS'
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        return res.status(500).json({ error: "Failed to create enrollment" });
      }

      // Record coupon redemption
      if (validationResult.coupon_id) {
        await supabase
          .from('coupon_redemptions')
          .insert({
            coupon_id: validationResult.coupon_id,
            user_id: profile.id,
            course_id: course.id,
            original_price: coursePrice,
            discount_amount: validationResult.discount,
            final_price: 0
          });
      }

      console.log('✅ Free enrollment created:', {
        userId: profile.id,
        courseId: course.id,
        couponCode: code
      });

      res.json({ 
        success: true,
        message: 'Enrollment created successfully',
        courseSlug: course.slug
      });

    } catch (error: any) {
      console.error('Error creating free enrollment:', error);
      res.status(500).json({ 
        error: "Failed to create enrollment",
        message: error.message 
      });
    }
  });

  // Mercado Pago Webhook
  app.post("/api/webhooks/mp", async (req, res) => {
    try {
      console.log('🔔 MP Webhook received:', req.body);

      const { type, data } = req.body;

      // Only process payment notifications
      if (type !== 'payment') {
        console.log('Ignoring non-payment notification:', type);
        return res.status(200).json({ ok: true });
      }

      if (!data || !data.id) {
        console.log('Invalid webhook data - missing payment ID');
        return res.status(400).json({ error: "Invalid webhook data" });
      }

      // Initialize MP SDK
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error('MP_ACCESS_TOKEN not configured');
        return res.status(500).json({ error: "Payment gateway not configured" });
      }

      const client = new MercadoPagoConfig({ 
        accessToken: mpAccessToken
      });
      const payment = new Payment(client);

      // Get payment details from MP
      const paymentData = await payment.get({ id: data.id });

      console.log('💳 Payment data:', {
        id: paymentData.id,
        status: paymentData.status,
        metadata: paymentData.metadata
      });

      // Only process approved payments
      if (paymentData.status !== 'approved') {
        console.log('Payment not approved, status:', paymentData.status);
        return res.status(200).json({ ok: true, message: 'Payment not approved yet' });
      }

      const metadata = paymentData.metadata;
      
      if (!metadata || !metadata.course_id || !metadata.user_id) {
        console.error('Missing required metadata:', metadata);
        return res.status(400).json({ error: "Invalid payment metadata" });
      }

      // Check if enrollment already exists (idempotency)
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', metadata.user_id)
        .eq('course_id', metadata.course_id)
        .maybeSingle();

      if (existingEnrollment) {
        console.log('Enrollment already exists, skipping');
        return res.status(200).json({ ok: true, message: 'Enrollment already exists' });
      }

      // Create course enrollment
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year subscription

      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: metadata.user_id,
          course_id: metadata.course_id,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        // Don't return error to MP, we'll try again on next notification
        return res.status(500).json({ error: "Failed to create enrollment" });
      }

      console.log('✅ Enrollment created successfully');

      // Log payment
      const { error: logError } = await supabase
        .from('payments_log')
        .insert({
          user_id: metadata.user_id,
          course_id: metadata.course_id,
          provider: 'mercadopago',
          provider_payment_id: String(paymentData.id),
          status: paymentData.status,
          amount: metadata.final_price,
          currency: 'ARS',
          external_reference: paymentData.external_reference,
          raw_payload: paymentData
        });

      if (logError) {
        console.error('Error logging payment (non-critical):', logError);
      }

      // Redeem coupon if present
      if (metadata.coupon_code && metadata.coupon_id) {
        console.log('💰 Redeeming coupon:', metadata.coupon_code);

        const { error: redeemError } = await supabase.rpc('redeem_coupon', {
          p_code: metadata.coupon_code,
          p_course_id: metadata.course_id,
          p_price: metadata.list_price,
          p_currency: 'ARS',
          p_order_id: paymentData.id
        });

        if (redeemError) {
          console.error('Error redeeming coupon (non-critical):', redeemError);
        } else {
          console.log('✅ Coupon redeemed successfully');
        }
      }

      res.status(200).json({ ok: true, message: 'Payment processed successfully' });

    } catch (error: any) {
      console.error('❌ Error processing MP webhook:', error);
      res.status(500).json({ 
        error: "Failed to process webhook",
        message: error.message 
      });
    }
  });

  // ==================== ADMIN ENDPOINTS (for development) ====================
  
  // Helper function to verify admin access
  async function verifyAdmin(authHeader: string) {
    const token = authHeader.substring(7);
    
    const authSupabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    
    const { data: { user }, error } = await authSupabase.auth.getUser(token);
    
    if (error || !user) {
      return { isAdmin: false, error: "Invalid or expired token" };
    }
    
    const { data: adminCheck } = await authSupabase
      .from('admin_users')
      .select('auth_id')
      .eq('auth_id', user.id)
      .maybeSingle();
    
    if (!adminCheck) {
      return { isAdmin: false, error: "Admin access required" };
    }
    
    return { isAdmin: true, user };
  }
  
  // GET /api/admin/courses - Get all courses
  app.get("/api/admin/courses", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (coursesError) {
        console.error("Error fetching courses:", coursesError);
        return res.status(500).json({ error: "Failed to fetch courses" });
      }
      
      return res.json(courses);
    } catch (error: any) {
      console.error("Error in /api/admin/courses:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/courses/:id - Get single course
  app.get("/api/admin/courses/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (courseError) {
        console.error("Error fetching course:", courseError);
        return res.status(500).json({ error: "Failed to fetch course" });
      }
      
      return res.json(course);
    } catch (error: any) {
      console.error("Error in /api/admin/courses/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/courses/:id - Update course
  app.patch("/api/admin/courses/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (courseError) {
        console.error("Error updating course:", courseError);
        return res.status(500).json({ error: "Failed to update course" });
      }
      
      return res.json(course);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/courses/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // DELETE /api/admin/courses/:id - Delete course
  app.delete("/api/admin/courses/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (courseError) {
        console.error("Error deleting course:", courseError);
        return res.status(500).json({ error: "Failed to delete course" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error in DELETE /api/admin/courses/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/modules?course_id=X - Get modules for a course
  app.get("/api/admin/modules", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { course_id } = req.query;
      
      let query = supabase
        .from('course_modules')
        .select('*')
        .order('sort_index', { ascending: true });
      
      if (course_id) {
        query = query.eq('course_id', course_id);
      }
      
      const { data: modules, error: modulesError } = await query;
      
      if (modulesError) {
        console.error("Error fetching modules:", modulesError);
        return res.status(500).json({ error: "Failed to fetch modules" });
      }
      
      return res.json(modules || []);
    } catch (error: any) {
      console.error("Error in /api/admin/modules:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/modules/:id - Update module
  app.patch("/api/admin/modules/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (moduleError) {
        console.error("Error updating module:", moduleError);
        return res.status(500).json({ error: "Failed to update module" });
      }
      
      return res.json(module);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/modules/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // GET /api/admin/lessons?module_id=X - Get lessons for a module
  app.get("/api/admin/lessons", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { module_id } = req.query;
      
      let query = supabase
        .from('course_lessons')
        .select('*')
        .order('sort_index', { ascending: true });
      
      if (module_id) {
        query = query.eq('module_id', module_id);
      }
      
      const { data: lessons, error: lessonsError } = await query;
      
      if (lessonsError) {
        console.error("Error fetching lessons:", lessonsError);
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }
      
      return res.json(lessons || []);
    } catch (error: any) {
      console.error("Error in /api/admin/lessons:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // PATCH /api/admin/lessons/:id - Update lesson
  app.patch("/api/admin/lessons/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      const { data: lesson, error: lessonError } = await supabase
        .from('course_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (lessonError) {
        console.error("Error updating lesson:", lessonError);
        return res.status(500).json({ error: "Failed to update lesson" });
      }
      
      return res.json(lesson);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/lessons/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // GET /api/admin/enrollments - Get all enrollments with progress
  app.get("/api/admin/enrollments", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { course_id } = req.query;
      
      // Fetch enrollments with users and courses
      let query = supabase
        .from('course_enrollments')
        .select(`
          *,
          users!inner(id, full_name, email),
          courses!inner(id, title)
        `)
        .order('started_at', { ascending: false });
      
      if (course_id) {
        query = query.eq('course_id', course_id);
      }
      
      const { data: enrollments, error: enrollmentsError } = await query;
      
      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
        return res.status(500).json({ error: "Failed to fetch enrollments" });
      }
      
      // Fetch progress for all enrollments in parallel
      const enrollmentsWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          // Get all modules for the course
          const { data: modules } = await supabase
            .from('course_modules')
            .select('id')
            .eq('course_id', enrollment.course_id);
          
          if (!modules || modules.length === 0) {
            return {
              ...enrollment,
              progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
            };
          }
          
          const moduleIds = modules.map(m => m.id);
          
          // Get all lessons for these modules
          const { data: lessons } = await supabase
            .from('course_lessons')
            .select('id')
            .in('module_id', moduleIds);
          
          if (!lessons || lessons.length === 0) {
            return {
              ...enrollment,
              progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
            };
          }
          
          const lessonIds = lessons.map(l => l.id);
          const total_lessons = lessons.length;
          
          // Get completed lessons for this user
          const { data: progressData } = await supabase
            .from('course_lesson_progress')
            .select('id, is_completed')
            .eq('user_id', enrollment.user_id)
            .in('lesson_id', lessonIds)
            .eq('is_completed', true);
          
          const completed_lessons = progressData?.length || 0;
          const progress_percentage = total_lessons > 0 
            ? Math.round((completed_lessons / total_lessons) * 100) 
            : 0;
          
          return {
            ...enrollment,
            progress: { 
              completed_lessons, 
              total_lessons, 
              progress_percentage 
            }
          };
        })
      );
      
      return res.json(enrollmentsWithProgress);
    } catch (error: any) {
      console.error("Error in /api/admin/enrollments:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // DELETE /api/admin/enrollments/:id
  app.delete("/api/admin/enrollments/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const { id } = req.params;
      
      const { error: deleteError } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error("Error deleting enrollment:", deleteError);
        return res.status(500).json({ error: "Failed to delete enrollment" });
      }
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error in DELETE /api/admin/enrollments/:id:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  // GET /api/admin/dashboard - Get admin dashboard data
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const { isAdmin, error } = await verifyAdmin(authHeader);
      if (!isAdmin) {
        return res.status(403).json({ error });
      }
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Execute all queries in parallel
      const [
        allCoursesResult,
        activeCoursesResult,
        allEnrollmentsResult,
        activeEnrollmentsResult,
        expiringThisMonthResult,
        expiringNextMonthResult,
        recentEnrollmentsResult,
        expiringSoonResult,
        allProgressResult
      ] = await Promise.all([
        // Total courses
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        
        // Active courses
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        
        // Total enrollments
        supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
        
        // Active enrollments
        supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        
        // Expiring this month
        supabase.from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('expires_at', 'is', null)
          .gte('expires_at', startOfMonth.toISOString())
          .lte('expires_at', endOfMonth.toISOString()),
        
        // Expiring next month
        supabase.from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('expires_at', 'is', null)
          .gte('expires_at', startOfNextMonth.toISOString())
          .lte('expires_at', endOfNextMonth.toISOString()),
        
        // Recent enrollments (last 10)
        supabase.from('course_enrollments')
          .select('*, users(full_name, email), courses(title, slug)')
          .order('started_at', { ascending: false })
          .limit(10),
        
        // Expiring in next 30 days
        supabase.from('course_enrollments')
          .select('*, users(full_name, email), courses(title, slug)')
          .eq('status', 'active')
          .not('expires_at', 'is', null)
          .gte('expires_at', now.toISOString())
          .lte('expires_at', next30Days.toISOString())
          .order('expires_at', { ascending: true })
          .limit(10),
        
        // All lesson progress for avg completion rate
        supabase.from('course_lesson_progress')
          .select('progress_pct')
      ]);
      
      // Calculate average completion rate
      const progressData = allProgressResult.data || [];
      const avgCompletionRate = progressData.length > 0
        ? progressData.reduce((sum, p) => sum + (p.progress_pct || 0), 0) / progressData.length
        : 0;
      
      // Note: Revenue data would require a payments table - setting to 0 for now
      const stats = {
        totalCourses: allCoursesResult.count || 0,
        activeCourses: activeCoursesResult.count || 0,
        totalEnrollments: allEnrollmentsResult.count || 0,
        activeEnrollments: activeEnrollmentsResult.count || 0,
        expiringThisMonth: expiringThisMonthResult.count || 0,
        expiringNextMonth: expiringNextMonthResult.count || 0,
        totalRevenue: 0, // TODO: Implement when payments table is available
        revenueThisMonth: 0, // TODO: Implement when payments table is available
        revenueLastMonth: 0, // TODO: Implement when payments table is available
        avgCompletionRate: avgCompletionRate
      };
      
      return res.json({
        stats,
        recentEnrollments: recentEnrollmentsResult.data || [],
        expiringSoon: expiringSoonResult.data || []
      });
    } catch (error: any) {
      console.error("Error in /api/admin/dashboard:", error);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // TEMPORARY DEBUG ENDPOINT
  app.get("/api/debug/user-info", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const token = authHeader.substring(7);
      
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
      
      // Get auth user
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Search by email
      const { data: userByEmail } = await authenticatedSupabase
        .from('users')
        .select('id, email, auth_id, full_name')
        .ilike('email', user.email!)
        .maybeSingle();
      
      // Search by auth_id
      const { data: userByAuthId } = await authenticatedSupabase
        .from('users')
        .select('id, email, auth_id, full_name')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      // Get RPC result
      const { data: rpcUser } = await authenticatedSupabase.rpc('archub_get_user');
      
      // Get enrollments with the correct user_id
      const correctUserId = userByAuthId?.id || userByEmail?.id;
      const { data: enrollments } = correctUserId 
        ? await authenticatedSupabase
            .from('course_enrollments')
            .select('*')
            .eq('user_id', correctUserId)
        : { data: null };
      
      // Get ALL enrollments to see what user_ids exist
      const { data: allEnrollments } = await authenticatedSupabase
        .from('course_enrollments')
        .select('user_id, course_id, status, created_at')
        .limit(20);
      
      return res.json({
        auth_user_id: user.id,
        auth_user_email: user.email,
        user_by_email: userByEmail,
        user_by_auth_id: userByAuthId,
        rpc_user_id: rpcUser?.user?.id || null,
        rpc_user_auth_id: rpcUser?.user?.auth_id || null,
        correct_user_id: correctUserId,
        enrollments_for_correct_user: enrollments,
        all_enrollments_sample: allEnrollments,
      });
    } catch (error: any) {
      console.error('Debug endpoint error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
