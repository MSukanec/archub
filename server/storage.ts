import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  materials, type Material, type InsertMaterial,
  tasks, type Task, type InsertTask,
  taskMaterials, type TaskMaterial, type InsertTaskMaterial,
  budgets, type Budget, type InsertBudget,
  budgetTasks, type BudgetTask, type InsertBudgetTask
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Material operations
  getMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Task Material operations
  getTaskMaterials(taskId: number): Promise<TaskMaterial[]>;
  addTaskMaterial(taskMaterial: InsertTaskMaterial): Promise<TaskMaterial>;
  removeTaskMaterial(id: number): Promise<boolean>;
  
  // Budget operations
  getBudgets(userId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Budget Task operations
  getBudgetTasks(budgetId: number): Promise<BudgetTask[]>;
  getBudgetTask(id: number): Promise<BudgetTask | undefined>;
  addBudgetTask(budgetTask: InsertBudgetTask): Promise<BudgetTask>;
  updateBudgetTask(id: number, quantity: number): Promise<BudgetTask | undefined>;
  removeBudgetTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private projectMap: Map<number, Project>;
  private materialMap: Map<number, Material>;
  private taskMap: Map<number, Task>;
  private taskMaterialMap: Map<number, TaskMaterial>;
  private budgetMap: Map<number, Budget>;
  private budgetTaskMap: Map<number, BudgetTask>;
  
  private userId: number;
  private projectId: number;
  private materialId: number;
  private taskId: number;
  private taskMaterialId: number;
  private budgetId: number;
  private budgetTaskId: number;

  constructor() {
    this.userMap = new Map();
    this.projectMap = new Map();
    this.materialMap = new Map();
    this.taskMap = new Map();
    this.taskMaterialMap = new Map();
    this.budgetMap = new Map();
    this.budgetTaskMap = new Map();
    
    this.userId = 1;
    this.projectId = 1;
    this.materialId = 1;
    this.taskId = 1;
    this.taskMaterialId = 1;
    this.budgetId = 1;
    this.budgetTaskId = 1;
    
    // Add sample user
    const sampleUser: User = {
      id: this.userId++,
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@example.com",
      avatarUrl: null
    };
    this.userMap.set(sampleUser.id, sampleUser);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.userMap.set(id, user);
    return user;
  }

  // Project operations
  async getProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projectMap.values()).filter(
      (project) => project.userId === userId
    );
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projectMap.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.projectMap.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projectMap.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { 
      ...project, 
      ...projectData, 
      updatedAt: new Date() 
    };
    this.projectMap.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projectMap.delete(id);
  }

  // Material operations
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materialMap.values());
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materialMap.get(id);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.materialId++;
    const material: Material = { 
      ...insertMaterial, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.materialMap.set(id, material);
    return material;
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const material = this.materialMap.get(id);
    if (!material) return undefined;
    
    const updatedMaterial: Material = { 
      ...material, 
      ...materialData, 
      updatedAt: new Date() 
    };
    this.materialMap.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.materialMap.delete(id);
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.taskMap.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.taskMap.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.taskMap.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.taskMap.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = { 
      ...task, 
      ...taskData, 
      updatedAt: new Date() 
    };
    this.taskMap.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.taskMap.delete(id);
  }

  // Task Material operations
  async getTaskMaterials(taskId: number): Promise<TaskMaterial[]> {
    return Array.from(this.taskMaterialMap.values()).filter(
      (tm) => tm.taskId === taskId
    );
  }

  async addTaskMaterial(insertTaskMaterial: InsertTaskMaterial): Promise<TaskMaterial> {
    const id = this.taskMaterialId++;
    const taskMaterial: TaskMaterial = { ...insertTaskMaterial, id };
    this.taskMaterialMap.set(id, taskMaterial);
    return taskMaterial;
  }

  async removeTaskMaterial(id: number): Promise<boolean> {
    return this.taskMaterialMap.delete(id);
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgetMap.values()).filter(
      (budget) => budget.userId === userId
    );
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgetMap.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.budgetId++;
    const budget: Budget = { 
      ...insertBudget, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.budgetMap.set(id, budget);
    return budget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgetMap.get(id);
    if (!budget) return undefined;
    
    const updatedBudget: Budget = { 
      ...budget, 
      ...budgetData, 
      updatedAt: new Date() 
    };
    this.budgetMap.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgetMap.delete(id);
  }

  // Budget Task operations
  async getBudgetTasks(budgetId: number): Promise<BudgetTask[]> {
    return Array.from(this.budgetTaskMap.values()).filter(
      (bt) => bt.budgetId === budgetId
    );
  }

  async getBudgetTask(id: number): Promise<BudgetTask | undefined> {
    return this.budgetTaskMap.get(id);
  }

  async addBudgetTask(insertBudgetTask: InsertBudgetTask): Promise<BudgetTask> {
    const id = this.budgetTaskId++;
    const budgetTask: BudgetTask = { ...insertBudgetTask, id };
    this.budgetTaskMap.set(id, budgetTask);
    return budgetTask;
  }

  async updateBudgetTask(id: number, quantity: number): Promise<BudgetTask | undefined> {
    const budgetTask = this.budgetTaskMap.get(id);
    if (!budgetTask) return undefined;
    
    const updatedBudgetTask: BudgetTask = { 
      ...budgetTask, 
      quantity 
    };
    this.budgetTaskMap.set(id, updatedBudgetTask);
    return updatedBudgetTask;
  }

  async removeBudgetTask(id: number): Promise<boolean> {
    return this.budgetTaskMap.delete(id);
  }
}

import { db } from "./db";
import { and, eq } from "drizzle-orm";

// Función para convertir 'numeric' a number en JavaScript
const convertNumberFields = <T extends Record<string, any>>(item: T): T => {
  if (!item) return item;
  
  // Convertir campos numéricos
  if ('unitPrice' in item && item.unitPrice !== undefined) {
    item.unitPrice = Number(item.unitPrice);
  }
  
  if ('quantity' in item && item.quantity !== undefined) {
    item.quantity = Number(item.quantity);
  }
  
  return item;
};

class DatabaseStorage implements IStorage {
  // Usuarios
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Proyectos (mantenidos para compatibilidad)
  async getProjects(userId: number): Promise<Project[]> {
    return [];
  }

  async getProject(id: number): Promise<Project | undefined> {
    return undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    throw new Error("Proyectos no están disponibles en esta versión");
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    throw new Error("Proyectos no están disponibles en esta versión");
  }

  async deleteProject(id: number): Promise<boolean> {
    throw new Error("Proyectos no están disponibles en esta versión");
  }

  // Materiales
  async getMaterials(): Promise<Material[]> {
    const materials = await db.select().from(materials);
    return materials;
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [updatedMaterial] = await db
      .update(materials)
      .set(materialData)
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    await db.delete(materials).where(eq(materials.id, id));
    return true;
  }

  // Tareas
  async getTasks(): Promise<Task[]> {
    const tasksList = await db.select().from(tasks);
    return tasksList;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  // Materiales de tarea
  async getTaskMaterials(taskId: number): Promise<TaskMaterial[]> {
    const taskMaterialsList = await db
      .select()
      .from(taskMaterials)
      .where(eq(taskMaterials.taskId, taskId));
    return taskMaterialsList;
  }

  async addTaskMaterial(taskMaterial: InsertTaskMaterial): Promise<TaskMaterial> {
    const [newTaskMaterial] = await db
      .insert(taskMaterials)
      .values(taskMaterial)
      .returning();
    return newTaskMaterial;
  }

  async removeTaskMaterial(id: number): Promise<boolean> {
    await db.delete(taskMaterials).where(eq(taskMaterials.id, id));
    return true;
  }

  // Presupuestos
  async getBudgets(userId: number): Promise<Budget[]> {
    const budgetsList = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId));
    return budgetsList;
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(budgetData)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    await db.delete(budgets).where(eq(budgets.id, id));
    return true;
  }

  // Tareas de presupuesto
  async getBudgetTasks(budgetId: number): Promise<BudgetTask[]> {
    const budgetTasksList = await db
      .select()
      .from(budgetTasks)
      .where(eq(budgetTasks.budgetId, budgetId));

    // Obtener datos de tarea para cada budgetTask
    const result = [];
    for (const budgetTask of budgetTasksList) {
      const task = await this.getTask(budgetTask.taskId);
      result.push({
        ...budgetTask,
        task
      });
    }
    return result;
  }

  async getBudgetTask(id: number): Promise<BudgetTask | undefined> {
    const [budgetTask] = await db
      .select()
      .from(budgetTasks)
      .where(eq(budgetTasks.id, id));
    
    if (!budgetTask) return undefined;

    const task = await this.getTask(budgetTask.taskId);
    return {
      ...budgetTask,
      task
    };
  }

  async addBudgetTask(budgetTask: InsertBudgetTask): Promise<BudgetTask> {
    const [newBudgetTask] = await db
      .insert(budgetTasks)
      .values(budgetTask)
      .returning();
    
    const task = await this.getTask(newBudgetTask.taskId);
    return {
      ...newBudgetTask,
      task
    };
  }

  async updateBudgetTask(id: number, quantity: number): Promise<BudgetTask | undefined> {
    const [updatedBudgetTask] = await db
      .update(budgetTasks)
      .set({ quantity: String(quantity) })
      .where(eq(budgetTasks.id, id))
      .returning();
    
    if (!updatedBudgetTask) return undefined;
    
    const task = await this.getTask(updatedBudgetTask.taskId);
    return {
      ...updatedBudgetTask,
      task
    };
  }

  async removeBudgetTask(id: number): Promise<boolean> {
    await db.delete(budgetTasks).where(eq(budgetTasks.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
