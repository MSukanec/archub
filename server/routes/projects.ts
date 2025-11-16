import type { Express } from "express";
import type { RouteDeps } from "./_base";
import {
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject
} from '../controllers/projects/projects.controller.js';
import {
  handleListBudgets,
  handleCreateBudget,
  handleUpdateBudget,
  handleDeleteBudget
} from '../controllers/projects/budgets.controller.js';
import {
  handleListBudgetItems,
  handleCreateBudgetItem,
  handleUpdateBudgetItem,
  handleDeleteBudgetItem,
  handleMoveBudgetItem
} from '../controllers/projects/budgetItems.controller.js';
import {
  handleListClients,
  handleGetClientsSummary,
  handleGetClient,
  handleCreateClient,
  handleUpdateClient,
  handleDeleteClient
} from '../controllers/projects/projectClients.controller.js';
import {
  handleListClientPayments
} from '../controllers/projects/clientPayments.controller.js';

/**
 * Register project-related endpoints (projects, budgets, budget items, project clients)
 */
export function registerProjectRoutes(app: Express, deps: RouteDeps): void {
  // ========== PROJECT ENDPOINTS ==========
  
  // POST /api/projects - Create a new project
  app.post("/api/projects", handleCreateProject);
  
  // PATCH /api/projects/:id - Update an existing project
  app.patch("/api/projects/:id", handleUpdateProject);
  
  // DELETE /api/projects/:projectId - Delete a project
  app.delete("/api/projects/:projectId", handleDeleteProject);

  // ========== PROJECT CLIENTS ENDPOINTS ==========
  
  // GET /api/projects/:projectId/clients - Get all clients for a project
  app.get("/api/projects/:projectId/clients", handleListClients);
  
  // GET /api/projects/:projectId/clients/summary - Get financial summary for project clients
  app.get("/api/projects/:projectId/clients/summary", handleGetClientsSummary);
  
  // POST /api/projects/:projectId/clients - Add a client to a project
  app.post("/api/projects/:projectId/clients", handleCreateClient);
  
  // GET /api/projects/:projectId/clients/:clientId - Get individual project client
  app.get("/api/projects/:projectId/clients/:clientId", handleGetClient);
  
  // PATCH /api/projects/:projectId/clients/:clientId - Update project client
  app.patch("/api/projects/:projectId/clients/:clientId", handleUpdateClient);
  
  // DELETE /api/projects/:projectId/clients/:clientId - Remove a client from a project
  app.delete("/api/projects/:projectId/clients/:clientId", handleDeleteClient);

  // ========== CLIENT PAYMENTS ENDPOINTS ==========
  
  // GET /api/projects/:projectId/client-payments - Get all client payments for a project
  app.get("/api/projects/:projectId/client-payments", handleListClientPayments);

  // GET/POST /api/project-clients - Alternative endpoint for listing/creating project clients (with query params)
  // This endpoint provides an alternative way to access clients using query parameters instead of path parameters
  app.get("/api/project-clients", async (req, res) => {
    try {
      // Convert query params to path params format expected by handleListClients
      const projectId = req.query.projectId as string;
      
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required in query params" });
      }
      
      // Create a modified request object with projectId in params
      const modifiedReq = {
        ...req,
        params: { projectId }
      };
      
      return handleListClients(modifiedReq as any, res);
    } catch (error: any) {
      console.error('Error in /api/project-clients GET:', error);
      return res.status(500).json({ error: error.message || 'Failed to list project clients' });
    }
  });

  app.post("/api/project-clients", async (req, res) => {
    try {
      // Extract projectId from body and move it to params
      const { projectId, ...bodyWithoutProjectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required in body" });
      }
      
      // Create a modified request object with projectId in params
      const modifiedReq = {
        ...req,
        params: { projectId },
        body: bodyWithoutProjectId
      };
      
      return handleCreateClient(modifiedReq as any, res);
    } catch (error: any) {
      console.error('Error in /api/project-clients POST:', error);
      return res.status(500).json({ error: error.message || 'Failed to create project client' });
    }
  });

  // ========== BUDGET ENDPOINTS ==========
  
  // GET /api/budgets - Get budgets for a project
  app.get("/api/budgets", handleListBudgets);
  
  // POST /api/budgets - Create a new budget
  app.post("/api/budgets", handleCreateBudget);
  
  // PATCH /api/budgets/:id - Update a budget
  app.patch("/api/budgets/:id", handleUpdateBudget);
  
  // DELETE /api/budgets/:id - Delete a budget
  app.delete("/api/budgets/:id", handleDeleteBudget);

  // ========== BUDGET ITEMS ENDPOINTS ==========
  
  // GET /api/budget-items - Get budget items for a budget
  app.get("/api/budget-items", handleListBudgetItems);
  
  // POST /api/budget-items - Create a new budget item
  app.post("/api/budget-items", handleCreateBudgetItem);
  
  // PATCH /api/budget-items/:id - Update a budget item
  app.patch("/api/budget-items/:id", handleUpdateBudgetItem);
  
  // DELETE /api/budget-items/:id - Delete a budget item
  app.delete("/api/budget-items/:id", handleDeleteBudgetItem);
  
  // POST /api/budget-items/move - Move a budget item
  app.post("/api/budget-items/move", handleMoveBudgetItem);
}
