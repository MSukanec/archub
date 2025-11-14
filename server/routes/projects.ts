import type { Express } from "express";
import type { RouteDeps } from "./_base";

/**
 * Register project-related endpoints (projects, budgets, budget items, design phase tasks)
 */
export function registerProjectRoutes(app: Express, deps: RouteDeps): void {
  const { supabase, createAuthenticatedClient, extractToken, getAdminClient } = deps;

  // ========== PROJECT ENDPOINTS ==========

  // Create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = req.body;

      if (!projectData.organization_id || !projectData.name) {
        return res.status(400).json({ 
          error: "organization_id and name are required" 
        });
      }

      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

      // Create new project using upsert
      const { data: newProject, error: projectError } = await authenticatedSupabase
        .from('projects')
        .upsert({
          organization_id: projectData.organization_id,
          name: projectData.name,
          status: projectData.status || 'active',
          created_by: projectData.created_by,
          created_at: new Date().toISOString(),
          is_active: true,
          color: projectData.color || "#84cc16",
          use_custom_color: projectData.use_custom_color || false,
          custom_color_h: projectData.custom_color_h || null,
          custom_color_hex: projectData.custom_color_hex || null,
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (projectError) {
        console.error("Error creating project:", projectError);
        return res.status(500).json({ 
          error: "Failed to create project",
          details: projectError.message 
        });
      }

      // ALWAYS create project_data with organization_id (required for RLS)
      const { error: dataError } = await authenticatedSupabase
        .from('project_data')
        .insert({
          project_id: newProject.id,
          organization_id: projectData.organization_id,
          project_type_id: projectData.project_type_id || null,
          modality_id: projectData.modality_id || null,
        });

      if (dataError) {
        console.error("Error creating project_data:", dataError);
        // Rollback: delete the project we just created
        await authenticatedSupabase.from('projects').delete().eq('id', newProject.id);
        return res.status(500).json({ 
          error: "Failed to create project data",
          details: dataError.message 
        });
      }

      res.json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update an existing project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const updateData = req.body;

      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

      // Update main project
      const { error: projectError } = await authenticatedSupabase
        .from('projects')
        .update({
          name: updateData.name,
          status: updateData.status,
          color: updateData.color || "#84cc16",
          use_custom_color: updateData.use_custom_color || false,
          custom_color_h: updateData.custom_color_h || null,
          custom_color_hex: updateData.custom_color_hex || null,
        })
        .eq('id', projectId);

      if (projectError) {
        console.error("Error updating project:", projectError);
        return res.status(500).json({ 
          error: "Failed to update project",
          details: projectError.message 
        });
      }

      // Update project_data if it exists, create if it doesn't
      const { data: existingProjectData } = await authenticatedSupabase
        .from('project_data')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (existingProjectData) {
        const { error: dataError } = await authenticatedSupabase
          .from('project_data')
          .update({
            project_type_id: updateData.project_type_id || null,
            modality_id: updateData.modality_id || null,
          })
          .eq('project_id', projectId);

        if (dataError) {
          console.error("Error updating project_data:", dataError);
          return res.status(500).json({ 
            error: "Failed to update project data",
            details: dataError.message 
          });
        }
      } else if (updateData.project_type_id || updateData.modality_id) {
        // Create project_data if doesn't exist and we have data to insert
        const { error: dataError } = await authenticatedSupabase
          .from('project_data')
          .upsert({
            project_id: projectId,
            organization_id: updateData.organization_id,
            project_type_id: updateData.project_type_id || null,
            modality_id: updateData.modality_id || null,
          }, {
            onConflict: 'project_id'
          });

        if (dataError) {
          console.error("Error creating project_data:", dataError);
          return res.status(500).json({ 
            error: "Failed to create project data",
            details: dataError.message 
          });
        }
      }

      // Get updated project
      const { data: updatedProject, error: fetchError } = await authenticatedSupabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        console.error("Error fetching updated project:", fetchError);
        return res.status(500).json({ 
          error: "Project updated but failed to fetch result",
          details: fetchError.message 
        });
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Delete project safely - server-side implementation
  app.delete("/api/projects/:projectId", async (req, res) => {
    try {
      console.log("Attempting to delete project:", req.params.projectId);
      
      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      const projectId = req.params.projectId;
      
      // Create authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);
      
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

  // ========== PROJECT CLIENTS ENDPOINTS ==========

  // GET /api/projects/:projectId/clients - Get all clients for a project
  app.get("/api/projects/:projectId/clients", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Query project_clients with contact information
      const { data: projectClients, error } = await authenticatedSupabase
        .from('project_clients')
        .select(`
          *,
          contacts:contacts!client_id (
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            company_name,
            linked_user:users!linked_user_id (
              id,
              avatar_url
            )
          ),
          currency:currencies!currency_id (
            id,
            code,
            symbol
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching project clients:", error);
        return res.status(500).json({ error: "Failed to fetch project clients" });
      }

      res.json(projectClients || []);
    } catch (error) {
      console.error("Error in get project clients endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/projects/:projectId/clients/summary - Get financial summary for project clients (plan-aware)
  app.get("/api/projects/:projectId/clients/summary", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Fetch organization plan to determine behavior
      const { data: orgData, error: orgError } = await authenticatedSupabase
        .from('organizations')
        .select(`
          id,
          plan_id,
          plan:plan_id (
            id,
            slug,
            name
          )
        `)
        .eq('id', organization_id as string)
        .single();

      if (orgError) {
        console.error("Error fetching organization plan:", orgError);
        return res.status(500).json({ error: "Failed to fetch organization plan" });
      }

      const planSlug = orgData?.plan?.slug?.toUpperCase() || 'FREE';
      const isMultiCurrency = planSlug === 'PRO' || planSlug === 'TEAMS' || planSlug === 'ENTERPRISE';

      // Use new view with currency conversion for PRO/TEAMS, old logic for FREE
      const viewName = isMultiCurrency ? 'client_financial_overview_v2' : 'client_financial_overview';

      // Query the financial overview view
      const { data: financialData, error: viewError } = await authenticatedSupabase
        .from(viewName)
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string);

      if (viewError) {
        console.error("Error fetching client financial overview:", viewError);
        return res.status(500).json({ error: "Failed to fetch client financial data" });
      }

      if (!financialData || financialData.length === 0) {
        return res.json({
          plan: {
            slug: planSlug,
            isMultiCurrency
          },
          clients: []
        });
      }

      // Get unique project_client_ids
      const projectClientIds = Array.from(new Set(financialData.map((item: any) => item.project_client_id)));

      // Get unique currency_ids to fetch currency data
      const currencyIds = Array.from(new Set(financialData.map((item: any) => item.currency_id).filter(Boolean)));

      // Fetch contact data for avatars
      const { data: enrichedData, error: enrichError } = await authenticatedSupabase
        .from('project_clients')
        .select(`
          id,
          unit,
          contacts:contacts!client_id (
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            company_name,
            linked_user:users!linked_user_id (
              id,
              avatar_url
            )
          )
        `)
        .in('id', projectClientIds);

      if (enrichError) {
        console.error("Error enriching client data:", enrichError);
        return res.status(500).json({ error: "Failed to enrich client data" });
      }

      // Fetch currency data only if there are currency_ids
      let currencyData: any[] = [];
      if (currencyIds.length > 0) {
        const { data, error: currencyError } = await authenticatedSupabase
          .from('currencies')
          .select('id, code, symbol')
          .in('id', currencyIds);

        if (currencyError) {
          console.error("Error fetching currency data:", currencyError);
          return res.status(500).json({ error: "Failed to fetch currency data" });
        }
        currencyData = data || [];
      }

      // Pre-index currencies by ID for O(1) lookup
      const currencyById = new Map(currencyData?.map((c: any) => [c.id, c]) || []);

      // Pre-index enriched data by project_client_id for O(1) lookup
      const enrichedById = new Map(enrichedData?.map((e: any) => [e.id, e]) || []);

      // Group financial data by project_client_id
      const groupedByClient = financialData.reduce((acc: any, row: any) => {
        const clientId = row.project_client_id;
        
        if (!acc[clientId]) {
          const enriched = enrichedById.get(clientId);
          
          acc[clientId] = {
            id: row.project_client_id, // Frontend expects 'id'
            project_id: row.project_id,
            client_id: row.client_id,
            organization_id: row.organization_id,
            unit: enriched?.unit || null,
            contacts: enriched?.contacts || null,
            role: row.role_id ? {
              id: row.role_id,
              name: row.role_name,
              is_default: row.role_is_default
            } : null,
            financialByCurrency: []
          };
        }

        // Get currency info using pre-indexed Map
        const currency = row.currency_id ? currencyById.get(row.currency_id) : null;

        // Add this currency's financial data
        acc[clientId].financialByCurrency.push({
          currency: currency || null,
          total_committed_amount: parseFloat(row.total_committed_amount || 0),
          total_paid_amount: parseFloat(row.total_paid_amount || 0),
          balance_due: parseFloat(row.balance_due || 0),
          next_due_date: row.next_due_date || null,
          next_due_amount: row.next_due_amount ? parseFloat(row.next_due_amount) : null,
          last_payment_date: row.last_payment_date || null,
          total_schedule_items: row.total_schedule_items || 0,
          schedule_paid: row.schedule_paid || 0,
          schedule_overdue: row.schedule_overdue || 0,
          payments_missing_rate: row.payments_missing_rate || 0, // Warning flag for PRO/TEAMS
        });

        return acc;
      }, {});

      // Convert to array and add derived sorting fields
      const mergedData = Object.values(groupedByClient).map((client: any) => {
        // Calculate totals across all currencies for sorting
        const total_committed_amount = client.financialByCurrency.reduce(
          (sum: number, f: any) => sum + f.total_committed_amount, 0
        );
        const total_paid_amount = client.financialByCurrency.reduce(
          (sum: number, f: any) => sum + f.total_paid_amount, 0
        );
        const balance_due = client.financialByCurrency.reduce(
          (sum: number, f: any) => sum + f.balance_due, 0
        );
        
        // Find earliest next due date for sorting
        const nextDueDates = client.financialByCurrency
          .filter((f: any) => f.next_due_date)
          .map((f: any) => new Date(f.next_due_date).getTime());
        const next_due = nextDueDates.length > 0 ? Math.min(...nextDueDates) : null;
        
        return {
          ...client,
          // Add derived fields for sorting (sums across all currencies)
          total_committed_amount,
          total_paid_amount,
          balance_due,
          next_due,
        };
      });

      // Sort A-Z by client name
      mergedData.sort((a: any, b: any) => {
        const nameA = (a.contacts?.company_name || a.contacts?.full_name || 
                      `${a.contacts?.first_name || ''} ${a.contacts?.last_name || ''}`.trim()).toLowerCase();
        const nameB = (b.contacts?.company_name || b.contacts?.full_name || 
                      `${b.contacts?.first_name || ''} ${b.contacts?.last_name || ''}`.trim()).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Include plan info in response for frontend rendering
      res.json({
        plan: {
          slug: planSlug,
          isMultiCurrency
        },
        clients: mergedData
      });
    } catch (error) {
      console.error("Error in get project clients summary endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/projects/:projectId/clients - Add a client to a project
  app.post("/api/projects/:projectId/clients", async (req, res) => {
    try {
      const { projectId } = req.params;
      const clientData = req.body;

      if (!clientData.client_id || !clientData.organization_id) {
        return res.status(400).json({ error: "client_id and organization_id are required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Create project_client relationship
      const { data: projectClient, error } = await authenticatedSupabase
        .from('project_clients')
        .insert({
          project_id: projectId,
          client_id: clientData.client_id,
          organization_id: clientData.organization_id,
          committed_amount: clientData.committed_amount || null,
          currency_id: clientData.currency_id || null,
          unit: clientData.unit || null,
          exchange_rate: clientData.exchange_rate || null
        })
        .select(`
          *,
          contacts:contacts!client_id (
            id,
            first_name,
            last_name,
            full_name,
            email,
            phone,
            company_name,
            linked_user:users!linked_user_id (
              id,
              avatar_url
            )
          ),
          currency:currencies!currency_id (
            id,
            code,
            symbol
          )
        `)
        .single();

      if (error) {
        console.error("Error adding client to project:", error);
        return res.status(500).json({ error: "Failed to add client to project" });
      }

      res.json(projectClient);
    } catch (error) {
      console.error("Error in add project client endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/projects/:projectId/clients/:clientId - Remove a client from a project
  // GET individual project client
  app.get("/api/projects/:projectId/clients/:clientId", async (req, res) => {
    try {
      const { projectId, clientId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Query single project_client with contact information
      const { data: projectClient, error } = await authenticatedSupabase
        .from('project_clients')
        .select(`
          *,
          contacts:contacts!client_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', clientId)
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string)
        .single();

      if (error) {
        console.error("Error fetching project client:", error);
        return res.status(404).json({ error: "Project client not found" });
      }

      res.json(projectClient);
    } catch (error) {
      console.error("Error in get project client endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH update project client
  app.patch("/api/projects/:projectId/clients/:clientId", async (req, res) => {
    try {
      const { projectId, clientId } = req.params;
      const updateData = req.body;

      if (!updateData.organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Build update object with only provided fields
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that are explicitly provided in the request
      if (updateData.hasOwnProperty('unit')) {
        updates.unit = updateData.unit || null;
      }
      if (updateData.hasOwnProperty('committed_amount')) {
        updates.committed_amount = updateData.committed_amount || null;
      }
      if (updateData.hasOwnProperty('currency_id')) {
        updates.currency_id = updateData.currency_id || null;
      }
      if (updateData.hasOwnProperty('exchange_rate')) {
        updates.exchange_rate = updateData.exchange_rate || null;
      }

      // Update project_client
      const { data: projectClient, error } = await authenticatedSupabase
        .from('project_clients')
        .update(updates)
        .eq('id', clientId)
        .eq('project_id', projectId)
        .eq('organization_id', updateData.organization_id)
        .select(`
          *,
          contacts:contacts!client_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) {
        console.error("Error updating project client:", error);
        return res.status(500).json({ error: "Failed to update project client" });
      }

      res.json(projectClient);
    } catch (error) {
      console.error("Error in update project client endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/projects/:projectId/clients/:clientId", async (req, res) => {
    try {
      const { projectId, clientId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Delete the project_client relationship
      const { error } = await authenticatedSupabase
        .from('project_clients')
        .delete()
        .eq('id', clientId)
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string);

      if (error) {
        console.error("Error removing client from project:", error);
        return res.status(500).json({ error: "Failed to remove client from project" });
      }

      res.json({ success: true, message: "Client removed from project successfully" });
    } catch (error) {
      console.error("Error in remove project client endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== BUDGET ENDPOINTS ==========

  // Get budgets for a project
  app.get("/api/budgets", async (req, res) => {
    try {
      const { project_id, organization_id } = req.query;
      
      if (!project_id || !organization_id) {
        return res.status(400).json({ error: "project_id and organization_id are required" });
      }

      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

      let query = authenticatedSupabase
        .from('organization_task_prices_view')
        .select('*')
        .eq('organization_id', organization_id);

      // If task_id is provided, filter by it (for single task lookup)
      if (task_id) {
        const { data: taskPrice, error } = await query
          .eq('task_id', task_id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching organization task price:", error);
          return res.status(500).json({ error: "Failed to fetch organization task price" });
        }

        return res.json(taskPrice);
      } else {
        // Return all task prices for the organization
        const { data: taskPrices, error } = await query
          .order('created_at', { ascending: false });
        
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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

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

  // ========== DESIGN PHASE TASKS ENDPOINTS ==========

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

      // Get the authorization token from headers
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      
      // Create an authenticated Supabase client
      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get the highest position for ordering
      const { data: existingTasks } = await authenticatedSupabase
        .from('design_phase_tasks')
        .select('position')
        .eq('project_phase_id', project_phase_id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingTasks && existingTasks.length > 0 ? existingTasks[0].position + 1 : 1;

      const { data, error } = await authenticatedSupabase
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

  // ========== COMMUNITY/PUBLIC ENDPOINTS ==========

  // GET /api/community/projects - Get all public projects with location data
  app.get("/api/community/projects", async (req, res) => {
    try {
      // Use admin client to bypass RLS for this public endpoint
      // (organizations table requires authenticated access)
      const adminClient = getAdminClient();
      
      const { data: projects, error } = await adminClient
        .from('projects')
        .select(`
          id,
          name,
          organization_id,
          color,
          organizations (
            id,
            name,
            logo_url
          ),
          project_data!inner (
            lat,
            lng,
            address,
            city,
            state,
            country,
            project_type_id,
            project_image_url
          )
        `)
        .eq('is_active', true)
        .not('project_data.lat', 'is', null)
        .not('project_data.lng', 'is', null);

      if (error) {
        console.error("Error fetching community projects:", error);
        return res.status(500).json({ error: "Failed to fetch projects" });
      }

      // Debug: log first project to see organizations structure
      if (projects && projects.length > 0) {
        console.log('First project sample:', JSON.stringify(projects[0], null, 2));
      }

      // Flatten the data structure for easier consumption
      const projectsWithLocation = (projects || []).map((p: any) => {
        const projectData = Array.isArray(p.project_data) ? p.project_data[0] : p.project_data;
        const orgData = p.organizations;
        return {
          id: p.id,
          name: p.name,
          organizationId: p.organization_id,
          organizationName: orgData?.name || 'Organización',
          organizationLogo: orgData?.logo_url,
          color: p.color,
          lat: parseFloat(projectData.lat),
          lng: parseFloat(projectData.lng),
          address: projectData.address,
          city: projectData.city,
          state: projectData.state,
          country: projectData.country,
          imageUrl: projectData.project_image_url
        };
      });

      res.json(projectsWithLocation);
    } catch (error) {
      console.error("Error fetching community projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // GET /api/community/stats - Get community statistics
  app.get("/api/community/stats", async (req, res) => {
    try {
      const adminClient = getAdminClient();

      // Parallelize count queries for better performance
      const [
        { count: organizationsCount, error: orgsError },
        { count: projectsCount, error: projectsError },
        { count: usersCount, error: usersError }
      ] = await Promise.all([
        adminClient
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        adminClient
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })
      ]);

      if (orgsError || projectsError || usersError) {
        console.error("Error counting stats:", { orgsError, projectsError, usersError });
        return res.status(500).json({ error: "Failed to fetch community stats" });
      }

      res.json({
        totalOrganizations: organizationsCount || 0,
        totalProjects: projectsCount || 0,
        totalMembers: usersCount || 0,
      });
    } catch (error) {
      console.error("Error fetching community stats:", error);
      res.status(500).json({ error: "Failed to fetch community stats" });
    }
  });

  // GET /api/community/organizations - Get featured organizations
  app.get("/api/community/organizations", async (req, res) => {
    try {
      const adminClient = getAdminClient();

      const { data: organizations, error } = await adminClient
        .from('organizations')
        .select('id, name, logo_url, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching organizations:", error);
        return res.status(500).json({ error: "Failed to fetch organizations" });
      }

      res.json(organizations || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // GET /api/community/active-users - Get recently active users
  app.get("/api/community/active-users", async (req, res) => {
    try {
      const adminClient = getAdminClient();

      // Calculate timestamp for 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: activeUsers, error } = await adminClient
        .from('user_presence')
        .select(`
          user_id,
          last_seen_at,
          current_view,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .gte('last_seen_at', twentyFourHoursAgo)
        .order('last_seen_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching active users:", error);
        return res.status(500).json({ error: "Failed to fetch active users" });
      }

      // Flatten the data structure
      const formattedUsers = (activeUsers || []).map((presence: any) => ({
        id: presence.user_id,
        name: presence.users?.full_name || 'Usuario',
        avatar_url: presence.users?.avatar_url,
        last_activity: presence.last_seen_at,
        current_page: presence.current_view,
      }));

      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });

  // TEMPORARY FIX: Drop unique constraint on projects.code
  app.post("/api/fix/drop-code-constraint", async (req, res) => {
    try {
      const adminClient = getAdminClient();
      
      // Execute raw SQL to drop the constraint
      const { data, error } = await adminClient.rpc('exec_sql', {
        sql_query: 'ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_code_unique_per_org'
      });

      if (error) {
        console.error("Error dropping constraint:", error);
        return res.status(500).json({ 
          error: "Failed to drop constraint",
          details: error.message 
        });
      }

      res.json({ 
        success: true, 
        message: "Constraint projects_code_unique_per_org dropped successfully" 
      });
    } catch (error) {
      console.error("Error in drop constraint endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
