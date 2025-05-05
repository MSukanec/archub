import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertProjectSchema, 
  insertMaterialSchema, 
  insertTaskSchema,
  insertTaskMaterialSchema,
  insertBudgetSchema,
  insertBudgetTaskSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = '/api';

  // Authentication middleware
  const authenticate = async (req: Request, res: Response, next: Function) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  };

  // Auth routes
  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
      return res.json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/auth/register`, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
      return res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/auth/me`, authenticate, async (req, res) => {
    return res.json({ 
      id: req.user.id, 
      username: req.user.username, 
      fullName: req.user.fullName,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl
    });
  });

  app.post(`${apiPrefix}/auth/logout`, (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: err });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });

  // Project routes
  app.get(`${apiPrefix}/projects`, authenticate, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user.id);
      return res.json(projects);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/projects/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this project" });
      }
      
      return res.json(project);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/projects`, authenticate, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const project = await storage.createProject(projectData);
      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/projects/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this project" });
      }
      
      const projectData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, projectData);
      return res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/projects/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this project" });
      }
      
      await storage.deleteProject(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Material routes
  app.get(`${apiPrefix}/materials`, async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      return res.json(materials);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/materials/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      return res.json(material);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/materials`, authenticate, async (req, res) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(materialData);
      return res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/materials/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const materialData = insertMaterialSchema.partial().parse(req.body);
      const updatedMaterial = await storage.updateMaterial(id, materialData);
      
      if (!updatedMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      return res.json(updatedMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/materials/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMaterial(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Task routes
  app.get(`${apiPrefix}/tasks`, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/tasks/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/tasks`, authenticate, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/tasks/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, taskData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/tasks/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Task Material routes
  app.get(`${apiPrefix}/tasks/:taskId/materials`, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const taskMaterials = await storage.getTaskMaterials(taskId);
      return res.json(taskMaterials);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/tasks/:taskId/materials`, authenticate, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const taskMaterialData = insertTaskMaterialSchema.parse({
        ...req.body,
        taskId
      });
      
      const taskMaterial = await storage.addTaskMaterial(taskMaterialData);
      return res.status(201).json(taskMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/task-materials/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.removeTaskMaterial(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task material not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Budget routes
  app.get(`${apiPrefix}/budgets`, authenticate, async (req, res) => {
    try {
      // Get all budgets for the current user
      const budgets = await storage.getBudgets(req.user.id);
      return res.json(budgets);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/budgets`, authenticate, async (req, res) => {
    try {
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const budget = await storage.createBudget(budgetData);
      return res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/projects/:projectId/budgets`, authenticate, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this project's budgets" });
      }
      
      const budgets = await storage.getBudgets(projectId);
      return res.json(budgets);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/budgets/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudget(id);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this budget" });
      }
      
      return res.json(budget);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/projects/:projectId/budgets`, authenticate, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to create a budget for this project" });
      }
      
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        projectId
      });
      
      const budget = await storage.createBudget(budgetData);
      return res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/budgets/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudget(id);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this budget" });
      }
      
      const budgetData = insertBudgetSchema.partial().parse(req.body);
      const updatedBudget = await storage.updateBudget(id, budgetData);
      return res.json(updatedBudget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/budgets/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudget(id);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this budget" });
      }
      
      await storage.deleteBudget(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Budget Task routes
  app.get(`${apiPrefix}/budgets/:budgetId/tasks`, authenticate, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.budgetId);
      const budget = await storage.getBudget(budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this budget's tasks" });
      }
      
      const budgetTasks = await storage.getBudgetTasks(budgetId);
      return res.json(budgetTasks);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/budgets/:budgetId/tasks`, authenticate, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.budgetId);
      const budget = await storage.getBudget(budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to add tasks to this budget" });
      }
      
      const budgetTaskData = insertBudgetTaskSchema.parse({
        ...req.body,
        budgetId
      });
      
      const budgetTask = await storage.addBudgetTask(budgetTaskData);
      return res.status(201).json(budgetTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/budget-tasks/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budgetTask = await storage.getBudgetTask(id);
      
      if (!budgetTask) {
        return res.status(404).json({ message: "Budget task not found" });
      }
      
      const budget = await storage.getBudget(budgetTask.budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this budget task" });
      }
      
      const { quantity } = req.body;
      const numericQuantity = Number(quantity);
      
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      
      const updatedBudgetTask = await storage.updateBudgetTask(id, numericQuantity);
      return res.json(updatedBudgetTask);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/budget-tasks/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budgetTask = await storage.getBudgetTask(id);
      
      if (!budgetTask) {
        return res.status(404).json({ message: "Budget task not found" });
      }
      
      const budget = await storage.getBudget(budgetTask.budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this budget task" });
      }
      
      await storage.removeBudgetTask(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
