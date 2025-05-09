import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import path from "path";
import fs from "fs";
import multer from "multer";
import { 
  insertUserSchema, 
  insertProjectSchema, 
  insertMaterialSchema, 
  insertTaskSchema,
  insertTaskMaterialSchema,
  insertBudgetSchema,
  insertBudgetTaskSchema,
  insertCategorySchema,
  insertUnitSchema,
  insertTransactionSchema,
  insertOrganizationSchema,
  insertOrganizationUserSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = '/api';
  
  // Setup authentication with Passport.js
  setupAuth(app);

  // Authentication middleware utilizando Passport.js
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Configurar Multer para subida de archivos
  const uploadsDir = path.join(process.cwd(), 'client/public/uploads');
  
  // Crear directorio si no existe
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });
  
  const upload = multer({ 
    storage: multerStorage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    },
    fileFilter: (req, file, cb) => {
      // Aceptar solo imágenes
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen'));
      }
    }
  });

  // Nota: Las rutas de autenticación están configuradas en auth.ts
  // /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/me

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
      console.log("Creando proyecto con datos:", req.body);
      
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      console.log("Datos parseados correctamente:", projectData);
      
      const project = await storage.createProject(projectData);
      console.log("Proyecto creado:", project);
      
      return res.status(201).json(project);
    } catch (error) {
      console.error("Error al crear proyecto:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      
      return res.status(500).json({ 
        message: "Server error", 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        } 
      });
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
      console.log("Creando material con datos:", req.body);
      
      const materialData = insertMaterialSchema.parse(req.body);
      console.log("Datos parseados correctamente:", materialData);
      
      const material = await storage.createMaterial(materialData);
      console.log("Material creado:", material);
      
      return res.status(201).json(material);
    } catch (error) {
      console.error("Error al crear material:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      
      return res.status(500).json({ 
        message: "Server error", 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        } 
      });
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
  
  // Get all task materials for all tasks in a project's budgets
  app.get(`${apiPrefix}/projects/:projectId/task-materials`, authenticate, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user?.id) {
        return res.status(403).json({ message: "Not authorized to access this project's materials" });
      }
      
      // Get all budgets for this project
      const budgets = await storage.getBudgets(projectId, true);
      
      // Get all budget tasks for each budget
      const budgetTasksMap: Record<number, any[]> = {};
      for (const budget of budgets) {
        const budgetTasks = await storage.getBudgetTasks(budget.id);
        budgetTasksMap[budget.id] = budgetTasks;
      }
      
      return res.json(budgetTasksMap);
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
      let budgetData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Si hay projectId, verificamos que el proyecto existe y pertenece al usuario
      if (req.body.projectId) {
        const projectId = parseInt(req.body.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        if (project.userId !== req.user.id) {
          return res.status(403).json({ message: "Not authorized to create a budget for this project" });
        }
        
        // Aseguramos que el projectId es un número
        budgetData.projectId = projectId;
      }
      
      // Validar con el schema
      budgetData = insertBudgetSchema.parse(budgetData);
      
      const budget = await storage.createBudget(budgetData);
      return res.status(201).json(budget);
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
      
      // Pasar isProjectId como true para filtrar por projectId
      const budgets = await storage.getBudgets(projectId, true);
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
        projectId,
        userId: req.user.id
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

  // Category routes
  app.get(`${apiPrefix}/categories`, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      console.log('Fetching categories with type:', type);
      const categories = await storage.getCategories(type);
      return res.json(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      return res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get(`${apiPrefix}/categories/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Fetching category with id:', id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(category);
    } catch (error) {
      console.error('Error getting category by id:', error);
      return res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post(`${apiPrefix}/categories`, authenticate, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/categories/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/categories/:id/position`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { position } = req.body;
      
      if (typeof position !== 'number') {
        return res.status(400).json({ message: "Position must be a number" });
      }
      
      const success = await storage.updateCategoryPosition(id, position);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/categories/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Unit routes
  app.get(`${apiPrefix}/units`, async (req, res) => {
    try {
      const units = await storage.getUnits();
      res.json(units);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/units/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await storage.getUnit(id);
      
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      res.json(unit);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/units`, async (req, res) => {
    try {
      const parsedBody = insertUnitSchema.safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid unit data", 
          errors: parsedBody.error.format() 
        });
      }
      
      const unit = await storage.createUnit(parsedBody.data);
      res.status(201).json(unit);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.put(`${apiPrefix}/units/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsedBody = insertUnitSchema.partial().safeParse(req.body);
      
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid unit data", 
          errors: parsedBody.error.format() 
        });
      }
      
      const updatedUnit = await storage.updateUnit(id, parsedBody.data);
      
      if (!updatedUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      res.json(updatedUnit);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/units/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUnit(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Rutas para Transacciones (Movimientos)
  app.get(`${apiPrefix}/projects/:projectId/transactions`, authenticate, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this project's transactions" });
      }
      
      const transactions = await storage.getTransactions(projectId);
      return res.json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/projects/:projectId/transactions`, authenticate, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to create transactions for this project" });
      }
      
      const transactionData = {
        ...req.body,
        projectId: projectId
      };
      
      // Validar con el schema
      const validatedData = insertTransactionSchema.parse(transactionData);
      
      const transaction = await storage.createTransaction(validatedData);
      return res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/transactions/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const project = await storage.getProject(transaction.projectId);
      
      if (project?.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this transaction" });
      }
      
      return res.json(transaction);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.put(`${apiPrefix}/transactions/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const project = await storage.getProject(transaction.projectId);
      
      if (project?.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this transaction" });
      }
      
      // Validar con el schema parcial
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      
      const updatedTransaction = await storage.updateTransaction(id, validatedData);
      return res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/transactions/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const project = await storage.getProject(transaction.projectId);
      
      if (project?.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this transaction" });
      }
      
      const deleted = await storage.deleteTransaction(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete transaction" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Organization routes
  app.get(`${apiPrefix}/organizations`, authenticate, async (req, res) => {
    try {
      // Obtener todas las organizaciones del usuario
      const organizations = await storage.getUserOrganizations(req.user.id);
      return res.json(organizations);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });
  
  // Ruta para obtener la organización activa
  app.get(`${apiPrefix}/organizations/active`, authenticate, async (req, res) => {
    try {
      // Obtener todas las organizaciones del usuario
      const organizations = await storage.getUserOrganizations(req.user.id);
      
      if (!organizations || organizations.length === 0) {
        // Si no hay organizaciones, crear una por defecto
        const defaultOrg = await storage.createOrganization({
          name: "Construcciones XYZ",
          description: "Organización por defecto",
        });
        
        // Agregar al usuario como propietario
        await storage.addUserToOrganization({
          organizationId: defaultOrg.id,
          userId: req.user.id,
          role: "owner"
        });
        
        return res.json(defaultOrg);
      }
      
      // Por ahora, simplemente devolver la primera organización
      // En el futuro, se podría permitir al usuario seleccionar su organización activa
      return res.json(organizations[0]);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.get(`${apiPrefix}/organizations/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario pertenece a esta organización
      const userOrganizations = await storage.getUserOrganizations(req.user.id);
      const isUserInOrg = userOrganizations.some(org => org.id === id);
      
      if (!isUserInOrg) {
        return res.status(403).json({ message: "Not authorized to access this organization" });
      }
      
      return res.json(organization);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/organizations`, authenticate, async (req, res) => {
    try {
      // Validar los datos de la organización
      const organizationData = insertOrganizationSchema.parse(req.body);
      
      // Crear la organización
      const organization = await storage.createOrganization(organizationData);
      
      // Añadir al usuario como propietario de la organización
      await storage.addUserToOrganization({
        userId: req.user.id,
        organizationId: organization.id,
        role: 'owner'
      });
      
      return res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/organizations/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario tiene permisos para editar (debe ser owner o admin)
      const orgUsers = await storage.getOrganizationUsers(id);
      const userRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to update this organization" });
      }
      
      // Validar con el schema parcial
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      
      // Actualizar la organización
      const updatedOrganization = await storage.updateOrganization(id, validatedData);
      return res.json(updatedOrganization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });
  
  // Ruta para subir el logo de la organización
  app.post(`${apiPrefix}/organizations/:id/logo`, authenticate, upload.single('logo'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario tiene permisos para editar
      const orgUsers = await storage.getOrganizationUsers(id);
      const userRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to update this organization" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Ruta relativa para acceder al archivo
      const relativePath = `/uploads/${req.file.filename}`;
      
      // Si ya existe un logo anterior, eliminarlo
      if (organization.logoUrl) {
        const oldLogoPath = path.join(process.cwd(), 'client/public', organization.logoUrl);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      // Actualizar la URL del logo en la base de datos
      const updatedOrganization = await storage.updateOrganization(id, {
        logoUrl: relativePath
      });
      
      return res.json(updatedOrganization);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });
  
  // Ruta para eliminar el logo de la organización
  app.delete(`${apiPrefix}/organizations/:id/logo`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario tiene permisos para editar
      const orgUsers = await storage.getOrganizationUsers(id);
      const userRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to update this organization" });
      }
      
      // Si existe un logo, eliminarlo
      if (organization.logoUrl) {
        const logoPath = path.join(process.cwd(), 'client/public', organization.logoUrl);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
        
        // Actualizar la URL del logo en la base de datos
        await storage.updateOrganization(id, {
          logoUrl: null
        });
      }
      
      return res.json({ message: "Logo removed successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/organizations/:id`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario es propietario
      const orgUsers = await storage.getOrganizationUsers(id);
      const userRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      if (userRole !== 'owner') {
        return res.status(403).json({ message: "Only the owner can delete the organization" });
      }
      
      const deleted = await storage.deleteOrganization(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete organization" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  // Organization User routes
  app.get(`${apiPrefix}/organizations/:id/users`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario pertenece a esta organización
      const userOrganizations = await storage.getUserOrganizations(req.user.id);
      const isUserInOrg = userOrganizations.some(org => org.id === id);
      
      if (!isUserInOrg) {
        return res.status(403).json({ message: "Not authorized to access this organization's users" });
      }
      
      const orgUsers = await storage.getOrganizationUsers(id);
      return res.json(orgUsers);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.post(`${apiPrefix}/organizations/:id/users`, authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario tiene permisos para añadir miembros (debe ser owner o admin)
      const orgUsers = await storage.getOrganizationUsers(id);
      const userRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to add users to this organization" });
      }
      
      // Validar los datos
      const orgUserData = insertOrganizationUserSchema.parse({
        ...req.body,
        organizationId: id
      });
      
      // Comprobar si el usuario ya es miembro
      const existingMember = orgUsers.find(ou => ou.userId === orgUserData.userId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this organization" });
      }
      
      // Añadir al usuario a la organización
      const orgUser = await storage.addUserToOrganization(orgUserData);
      return res.status(201).json(orgUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", error: error.errors });
      }
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.patch(`${apiPrefix}/organizations/:orgId/users/:userId`, authenticate, async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const targetUserId = parseInt(req.params.userId);
      
      // Verificar si la organización existe
      const organization = await storage.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario tiene permisos para cambiar roles (debe ser owner)
      const orgUsers = await storage.getOrganizationUsers(orgId);
      const userRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      if (userRole !== 'owner') {
        return res.status(403).json({ message: "Only the owner can change user roles" });
      }
      
      // Buscar la membresía del usuario objetivo
      const targetMembership = orgUsers.find(ou => ou.userId === targetUserId);
      if (!targetMembership) {
        return res.status(404).json({ message: "User is not a member of this organization" });
      }
      
      // No permitir cambiar el rol del propietario
      if (targetMembership.role === 'owner') {
        return res.status(400).json({ message: "Cannot change the role of the organization owner" });
      }
      
      // Validar el nuevo rol
      const { role } = req.body;
      if (!role || !['admin', 'member'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Valid roles are: admin, member" });
      }
      
      // Actualizar el rol
      const updatedMembership = await storage.updateUserOrganizationRole(targetMembership.id, role);
      return res.json(updatedMembership);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  app.delete(`${apiPrefix}/organizations/:orgId/users/:userId`, authenticate, async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const targetUserId = parseInt(req.params.userId);
      
      // Verificar si la organización existe
      const organization = await storage.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Verificar si el usuario tiene permisos para eliminar miembros
      const orgUsers = await storage.getOrganizationUsers(orgId);
      const currentUserRole = orgUsers.find(ou => ou.userId === req.user.id)?.role;
      
      // El usuario puede eliminar a otros si es owner o admin, o puede eliminarse a sí mismo
      const isRemovingSelf = targetUserId === req.user.id;
      const hasPermission = isRemovingSelf || currentUserRole === 'owner' || currentUserRole === 'admin';
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to remove users from this organization" });
      }
      
      // Buscar la membresía del usuario objetivo
      const targetMembership = orgUsers.find(ou => ou.userId === targetUserId);
      if (!targetMembership) {
        return res.status(404).json({ message: "User is not a member of this organization" });
      }
      
      // No permitir eliminar al propietario
      if (targetMembership.role === 'owner' && !isRemovingSelf) {
        return res.status(400).json({ message: "Cannot remove the organization owner" });
      }
      
      // Eliminar la membresía
      const deleted = await storage.removeUserFromOrganization(targetMembership.id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to remove user from organization" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
