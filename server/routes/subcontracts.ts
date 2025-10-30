import type { Express } from "express";
import type { RouteDeps } from './_base';
import { extractToken, createAuthenticatedClient } from './_base';

/**
 * Register subcontract-related endpoints
 * Includes: bulk movements, movement-subcontracts, subcontract-bids, subcontract-tasks, and subcontracts
 */
export function registerSubcontractRoutes(app: Express, deps: RouteDeps): void {
  const { supabase, createAuthenticatedClient: createAuthClient, extractToken: getToken } = deps;

  // ========== BULK MOVEMENTS IMPORT ENDPOINT ==========

  // POST /api/movements/bulk - Bulk import movements
  app.post("/api/movements/bulk", async (req, res) => {
    try {
      const { movements, user_token } = req.body;

      if (!movements || !Array.isArray(movements)) {
        return res.status(400).json({ error: "Missing or invalid movements array" });
      }

      console.log('Received bulk movements:', movements.length);

      // Use authenticated client with user's token
      const token = user_token || getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data, error } = await authenticatedSupabase
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

  // ========== MOVEMENT SUBCONTRACTS ENDPOINTS ==========

  // POST /api/movement-subcontracts - Create movement-subcontract relationship
  app.post("/api/movement-subcontracts", async (req, res) => {
    try {
      const { movement_id, subcontract_id, amount } = req.body;

      if (!movement_id || !subcontract_id) {
        return res.status(400).json({ error: "Movement ID and subcontract ID are required" });
      }

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data, error } = await authenticatedSupabase
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

  // GET /api/movement-subcontracts - Get movement-subcontract relationships
  app.get("/api/movement-subcontracts", async (req, res) => {
    try {
      const { movement_id } = req.query;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      let query = authenticatedSupabase.from('movement_subcontracts').select('*');
      
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

  // DELETE /api/movement-subcontracts/:id - Delete movement-subcontract relationship
  app.delete("/api/movement-subcontracts/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { error } = await authenticatedSupabase
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

  // DELETE /api/movement-subcontracts/by-movement/:movementId - Delete by movement ID
  app.delete("/api/movement-subcontracts/by-movement/:movementId", async (req, res) => {
    try {
      const { movementId } = req.params;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { error } = await authenticatedSupabase
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

  // ========== SUBCONTRACT BIDS ENDPOINTS ==========

  // GET /api/subcontract-bids/:subcontractId - Get bids for a subcontract
  app.get("/api/subcontract-bids/:subcontractId", async (req, res) => {
    try {
      const { subcontractId } = req.params;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data: bids, error } = await authenticatedSupabase
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

  // POST /api/subcontract-bids - Create a new bid
  app.post("/api/subcontract-bids", async (req, res) => {
    try {
      const bidData = req.body;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data: bid, error } = await authenticatedSupabase
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

  // PUT /api/subcontract-bids - Update a bid (PUT method)
  app.put("/api/subcontract-bids", async (req, res) => {
    try {
      const bidData = req.body;
      const { id, created_by, created_at, updated_at, ...updateData } = bidData;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data: bid, error } = await authenticatedSupabase
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

  // DELETE /api/subcontract-bids/:bidId - Delete bid by bidId (handles winner cleanup)
  app.delete("/api/subcontract-bids/:bidId", async (req, res) => {
    try {
      const { bidId } = req.params;
      
      console.log("Attempting to delete bid:", bidId);

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      // Primero, obtener información sobre el subcontrato relacionado
      const { data: bid, error: bidError } = await authenticatedSupabase
        .from('subcontract_bids')
        .select('subcontract_id')
        .eq('id', bidId)
        .single();

      if (bidError || !bid) {
        console.error("Error finding bid:", bidError);
        return res.status(404).json({ error: "Bid not found" });
      }

      // Verificar si este bid es el ganador del subcontrato
      const { data: subcontract, error: subcontractError } = await authenticatedSupabase
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
        const { error: updateError } = await authenticatedSupabase
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
      const { error } = await authenticatedSupabase
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

  // ========== SUBCONTRACT TASKS ENDPOINTS ==========

  // GET /api/subcontract-tasks/:subcontractId - Get tasks for a subcontract
  app.get("/api/subcontract-tasks/:subcontractId", async (req, res) => {
    try {
      const { subcontractId } = req.params;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      // Obtener las tareas del subcontrato
      const { data: subcontractTasks, error } = await authenticatedSupabase
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
      
      const { data: constructionTasks, error: taskError } = await authenticatedSupabase
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

  // PATCH /api/subcontract-bids/:id - Update bid (PATCH method)
  app.patch("/api/subcontract-bids/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data: bid, error } = await authenticatedSupabase
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

  // DELETE /api/subcontract-bids/:id - Delete bid by id (simple delete)
  app.delete("/api/subcontract-bids/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { error } = await authenticatedSupabase
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

  // ========== SUBCONTRACT AWARD ENDPOINT ==========

  // PUT /api/subcontracts/:id/award - Award subcontract to winning bid
  app.put("/api/subcontracts/:id/award", async (req, res) => {
    try {
      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

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

  // ========== SUBCONTRACT BID TASKS ENDPOINT ==========

  // POST /api/subcontract-bid-tasks - Save tasks for a subcontract bid
  app.post("/api/subcontract-bid-tasks", async (req, res) => {
    try {
      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

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

  // ========== SUBCONTRACT BIDS CONTACTS ENDPOINT ==========

  // POST /api/subcontract-bids/contacts - Get contacts for specific bid IDs
  app.post("/api/subcontract-bids/contacts", async (req, res) => {
    try {
      const { bidIds } = req.body;
      
      if (!bidIds || !Array.isArray(bidIds) || bidIds.length === 0) {
        return res.json([]);
      }

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      const { data: contacts, error } = await authenticatedSupabase
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

  // ========== SUBCONTRACT DELETE ENDPOINT ==========

  // DELETE /api/subcontracts/:id - Delete subcontract with all dependencies
  app.delete("/api/subcontracts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log("Attempting to delete subcontract:", id);

      const token = getToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthClient(token);

      // Primero obtener las ofertas del subcontrato
      const { data: bids, error: getBidsError } = await authenticatedSupabase
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
        const { error: bidTasksError } = await authenticatedSupabase
          .from('subcontract_bid_tasks')
          .delete()
          .in('subcontract_bid_id', bidIds);

        if (bidTasksError) {
          console.error("Error deleting bid tasks:", bidTasksError);
          return res.status(500).json({ error: "Failed to delete bid tasks" });
        }
      }

      // Luego eliminar todas las ofertas (subcontract_bids)
      const { error: bidsError } = await authenticatedSupabase
        .from('subcontract_bids')
        .delete()
        .eq('subcontract_id', id);

      if (bidsError) {
        console.error("Error deleting bids:", bidsError);
        return res.status(500).json({ error: "Failed to delete bids" });
      }

      // Eliminar las tareas del subcontrato (subcontract_tasks)
      const { error: tasksError } = await authenticatedSupabase
        .from('subcontract_tasks')
        .delete()
        .eq('subcontract_id', id);

      if (tasksError) {
        console.error("Error deleting subcontract tasks:", tasksError);
        return res.status(500).json({ error: "Failed to delete subcontract tasks" });
      }

      // Finalmente eliminar el subcontrato
      const { error } = await authenticatedSupabase
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
}
