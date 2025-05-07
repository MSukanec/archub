import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  materials, type Material, type InsertMaterial,
  tasks, type Task, type InsertTask,
  taskMaterials, type TaskMaterial, type InsertTaskMaterial,
  budgets, type Budget, type InsertBudget,
  budgetTasks, type BudgetTask, type InsertBudgetTask,
  categories, type Category, type InsertCategory
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
  
  // Category operations
  getCategories(type?: string): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  updateCategoryPosition(id: number, newPosition: number): Promise<boolean>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Unit operations
  getUnits(): Promise<Unit[]>;
  getUnit(id: number): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, unit: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private userMap: Map<number, User>;
  private projectMap: Map<number, Project>;
  private materialMap: Map<number, Material>;
  private taskMap: Map<number, Task>;
  private taskMaterialMap: Map<number, TaskMaterial>;
  private budgetMap: Map<number, Budget>;
  private budgetTaskMap: Map<number, BudgetTask>;
  private categoryMap: Map<number, Category>;
  private unitMap: Map<number, Unit>;
  
  private userId: number;
  private projectId: number;
  private materialId: number;
  private taskId: number;
  private taskMaterialId: number;
  private budgetId: number;
  private budgetTaskId: number;
  private categoryId: number;
  private unitId: number;

  constructor() {
    this.userMap = new Map();
    this.projectMap = new Map();
    this.materialMap = new Map();
    this.taskMap = new Map();
    this.taskMaterialMap = new Map();
    this.budgetMap = new Map();
    this.budgetTaskMap = new Map();
    this.categoryMap = new Map();
    this.unitMap = new Map();
    
    this.userId = 1;
    this.projectId = 1;
    this.materialId = 1;
    this.taskId = 1;
    this.taskMaterialId = 1;
    this.budgetId = 1;
    this.budgetTaskId = 1;
    this.categoryId = 1;
    this.unitId = 1;
    
    // Add sample users
    const adminUser: User = {
      id: this.userId++,
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@example.com",
      avatarUrl: null
    };
    
    const demoUser: User = {
      id: this.userId++,
      username: "demo",
      password: "demo123",
      fullName: "Demo User",
      email: "demo@example.com",
      avatarUrl: null
    };
    
    this.userMap.set(adminUser.id, adminUser);
    this.userMap.set(demoUser.id, demoUser);
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
  async getBudgets(userIdOrProjectId: number, isProjectId: boolean = false): Promise<Budget[]> {
    if (isProjectId) {
      // Si es un projectId, filtramos por el projectId
      return Array.from(this.budgetMap.values()).filter(
        (budget) => budget.projectId === userIdOrProjectId
      );
    } else {
      // Si es un userId, filtramos por el userId
      return Array.from(this.budgetMap.values()).filter(
        (budget) => budget.userId === userIdOrProjectId
      );
    }
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
  
  // Category operations
  async getCategories(type?: string): Promise<Category[]> {
    let categories = Array.from(this.categoryMap.values());
    
    if (type) {
      categories = categories.filter(cat => cat.type === type);
    }
    
    // Ordenamos por position
    categories.sort((a, b) => a.position - b.position);
    
    // Construir estructura jerárquica
    const rootCategories: Category[] = [];
    const childrenMap: Record<number, Category[]> = {};
    
    // Primero, agrupamos todas las categorías hijas por su parentId
    categories.forEach(cat => {
      if (cat.parentId) {
        if (!childrenMap[cat.parentId]) {
          childrenMap[cat.parentId] = [];
        }
        childrenMap[cat.parentId].push(cat);
      }
    });
    
    // Luego, para cada categoría principal (sin parentId), asignamos sus hijos
    categories.forEach(cat => {
      if (!cat.parentId) {
        const categoryWithChildren = { ...cat };
        if (childrenMap[cat.id]) {
          categoryWithChildren.children = childrenMap[cat.id];
        }
        rootCategories.push(categoryWithChildren);
      }
    });
    
    return rootCategories;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const category = this.categoryMap.get(id);
    if (!category) return undefined;
    
    // Buscar hijos de esta categoría
    const children = Array.from(this.categoryMap.values())
      .filter(cat => cat.parentId === id)
      .sort((a, b) => a.position - b.position);
      
    if (children.length > 0) {
      return { ...category, children };
    }
    
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { 
      ...insertCategory, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.categoryMap.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categoryMap.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { 
      ...category, 
      ...categoryData, 
      updatedAt: new Date() 
    };
    this.categoryMap.set(id, updatedCategory);
    return updatedCategory;
  }

  async updateCategoryPosition(id: number, newPosition: number): Promise<boolean> {
    const category = this.categoryMap.get(id);
    if (!category) return false;
    
    category.position = newPosition;
    category.updatedAt = new Date();
    this.categoryMap.set(id, category);
    return true;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Primero verificamos si hay categorías hijas
    const children = Array.from(this.categoryMap.values())
      .filter(cat => cat.parentId === id);
      
    // Si hay hijos, primero los asignamos a otra categoría padre
    if (children.length > 0) {
      // Obtener el parent de la categoría que vamos a eliminar
      const category = this.categoryMap.get(id);
      if (!category) return false;
      
      // Asignar los hijos al parent de la categoría que estamos eliminando
      const parentId = category.parentId;
      
      // Actualizar los hijos
      children.forEach(child => {
        child.parentId = parentId;
        child.updatedAt = new Date();
        this.categoryMap.set(child.id, child);
      });
    }
    
    // Ahora eliminamos la categoría
    return this.categoryMap.delete(id);
  }

  // Unit operations
  async getUnits(): Promise<Unit[]> {
    return Array.from(this.unitMap.values());
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    return this.unitMap.get(id);
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const id = this.unitId++;
    const unit: Unit = { ...insertUnit, id };
    this.unitMap.set(id, unit);
    return unit;
  }

  async updateUnit(id: number, unitData: Partial<InsertUnit>): Promise<Unit | undefined> {
    const unit = this.unitMap.get(id);
    if (!unit) return undefined;
    
    const updatedUnit: Unit = { 
      ...unit, 
      ...unitData 
    };
    this.unitMap.set(id, updatedUnit);
    return updatedUnit;
  }

  async deleteUnit(id: number): Promise<boolean> {
    return this.unitMap.delete(id);
  }
}

import { db } from "./db";
import { and, eq } from "drizzle-orm";

// Función auxiliar para convertir numbers para PostgreSQL y null para valores opcionales
const prepareForDb = <T>(item: T): any => {
  if (!item || typeof item !== 'object') return item;
  
  const result = {...item as any};
  
  // Asegurar que valores opcionales sean null y no undefined
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      result[key] = null;
    }
    
    // Convertir numeric a string para PostgreSQL
    if (key === 'unitPrice' || key === 'quantity') {
      if (typeof result[key] === 'number') {
        result[key] = String(result[key]);
      }
    }
  });
  
  return result;
};

// Función auxiliar para convertir strings de numeric a numbers en JavaScript
const convertFromDb = <T>(item: T): T => {
  if (!item || typeof item !== 'object') return item;
  
  const result = {...item as any};
  
  // Convertir numeric (string) a number para JavaScript
  if ('unitPrice' in result && result.unitPrice !== null) {
    result.unitPrice = Number(result.unitPrice);
  }
  
  if ('quantity' in result && result.quantity !== null) {
    result.quantity = Number(result.quantity);
  }
  
  // Asegurar que los campos opcionales son null y no undefined
  if ('fullName' in result && result.fullName === undefined) {
    result.fullName = null;
  }
  
  if ('email' in result && result.email === undefined) {
    result.email = null;
  }
  
  if ('avatarUrl' in result && result.avatarUrl === undefined) {
    result.avatarUrl = null;
  }
  
  if ('description' in result && result.description === undefined) {
    result.description = null;
  }
  
  // Asegurar que status tiene un valor por defecto
  if ('status' in result && result.status === undefined) {
    result.status = 'planning';
  }
  
  return result as T;
};

// Auxiliar para procesar arrays de resultados
const convertArrayFromDb = <T>(items: T[]): T[] => {
  return items.map(item => convertFromDb(item));
};

class DatabaseStorage implements IStorage {
  // Usuarios
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return convertFromDb(user);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return convertFromDb(user);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Asegurar que los campos opcionales son null y no undefined
    const userData = {
      ...insertUser,
      fullName: insertUser.fullName || null,
      email: insertUser.email || null,
      avatarUrl: insertUser.avatarUrl || null
    };
    
    const dbData = prepareForDb(userData);
    const [user] = await db.insert(users).values(dbData).returning();
    return convertFromDb(user);
  }

  // Proyectos
  async getProjects(userId: number): Promise<Project[]> {
    const projectsList = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    return convertArrayFromDb(projectsList);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return convertFromDb(project);
  }

  async createProject(project: InsertProject): Promise<Project> {
    // Asegurar que los campos opcionales son null o tienen valores predeterminados
    const projectData = {
      ...project,
      status: project.status || 'planning',
      description: project.description || null
    };
    
    const dbData = prepareForDb(projectData);
    const [newProject] = await db.insert(projects).values(dbData).returning();
    return convertFromDb(newProject);
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const dbData = prepareForDb(projectData);
    const [updatedProject] = await db
      .update(projects)
      .set(dbData)
      .where(eq(projects.id, id))
      .returning();
    return convertFromDb(updatedProject);
  }

  async deleteProject(id: number): Promise<boolean> {
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  // Materiales
  async getMaterials(): Promise<Material[]> {
    const materialsData = await db.select().from(materials);
    return convertArrayFromDb(materialsData);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return convertFromDb(material);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const dbData = prepareForDb(material);
    const [newMaterial] = await db.insert(materials).values(dbData).returning();
    return convertFromDb(newMaterial);
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const dbData = prepareForDb(materialData);
    const [updatedMaterial] = await db
      .update(materials)
      .set(dbData)
      .where(eq(materials.id, id))
      .returning();
    return convertFromDb(updatedMaterial);
  }

  async deleteMaterial(id: number): Promise<boolean> {
    await db.delete(materials).where(eq(materials.id, id));
    return true;
  }

  // Tareas
  async getTasks(): Promise<Task[]> {
    const tasksList = await db.select().from(tasks);
    return convertArrayFromDb(tasksList);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return convertFromDb(task);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const dbData = prepareForDb(task);
    const [newTask] = await db.insert(tasks).values(dbData).returning();
    return convertFromDb(newTask);
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const dbData = prepareForDb(taskData);
    const [updatedTask] = await db
      .update(tasks)
      .set(dbData)
      .where(eq(tasks.id, id))
      .returning();
    return convertFromDb(updatedTask);
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
    return convertArrayFromDb(taskMaterialsList);
  }

  async addTaskMaterial(taskMaterial: InsertTaskMaterial): Promise<TaskMaterial> {
    const dbData = prepareForDb(taskMaterial);
    const [newTaskMaterial] = await db
      .insert(taskMaterials)
      .values(dbData)
      .returning();
    return convertFromDb(newTaskMaterial);
  }

  async removeTaskMaterial(id: number): Promise<boolean> {
    await db.delete(taskMaterials).where(eq(taskMaterials.id, id));
    return true;
  }

  // Presupuestos
  async getBudgets(userIdOrProjectId: number, isProjectId: boolean = false): Promise<Budget[]> {
    let budgetsList;
    
    if (isProjectId) {
      // Filtramos por projectId
      budgetsList = await db
        .select()
        .from(budgets)
        .where(eq(budgets.projectId, userIdOrProjectId));
    } else {
      // Filtramos por userId
      budgetsList = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, userIdOrProjectId));
    }
    
    return convertArrayFromDb(budgetsList);
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return convertFromDb(budget);
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    // Asegurar que los campos opcionales son null
    const budgetData = {
      ...budget,
      description: budget.description || null
    };
    
    const dbData = prepareForDb(budgetData);
    const [newBudget] = await db.insert(budgets).values(dbData).returning();
    return convertFromDb(newBudget);
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const dbData = prepareForDb(budgetData);
    const [updatedBudget] = await db
      .update(budgets)
      .set(dbData)
      .where(eq(budgets.id, id))
      .returning();
    return convertFromDb(updatedBudget);
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
      const convertedBudgetTask = convertFromDb(budgetTask);
      const task = await this.getTask(convertedBudgetTask.taskId);
      result.push({
        ...convertedBudgetTask,
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

    const convertedBudgetTask = convertFromDb(budgetTask);
    const task = await this.getTask(convertedBudgetTask.taskId);
    
    return {
      ...convertedBudgetTask,
      task
    } as BudgetTask;
  }

  async addBudgetTask(budgetTask: InsertBudgetTask): Promise<BudgetTask> {
    // Asegurar que quantity sea un string
    const budgetTaskData = {
      ...budgetTask,
      quantity: String(budgetTask.quantity)
    };
    
    const dbData = prepareForDb(budgetTaskData);
    const [newBudgetTask] = await db
      .insert(budgetTasks)
      .values(dbData)
      .returning();
    
    const convertedBudgetTask = convertFromDb(newBudgetTask);
    const task = await this.getTask(convertedBudgetTask.taskId);
    
    return {
      ...convertedBudgetTask,
      task
    } as BudgetTask;
  }

  async updateBudgetTask(id: number, quantity: number): Promise<BudgetTask | undefined> {
    const [updatedBudgetTask] = await db
      .update(budgetTasks)
      .set({ quantity: String(quantity) })
      .where(eq(budgetTasks.id, id))
      .returning();
    
    if (!updatedBudgetTask) return undefined;
    
    const convertedBudgetTask = convertFromDb(updatedBudgetTask);
    const task = await this.getTask(convertedBudgetTask.taskId);
    
    return {
      ...convertedBudgetTask,
      task
    } as BudgetTask;
  }

  async removeBudgetTask(id: number): Promise<boolean> {
    await db.delete(budgetTasks).where(eq(budgetTasks.id, id));
    return true;
  }
}

// Temporalmente usamos MemStorage mientras resolvemos la conexión a la base de datos
// Cambiamos a almacenamiento en base de datos
import { SupabaseStorage } from './storage-supabase';

// Usar SupabaseStorage para todas las operaciones de almacenamiento

export const storage = new SupabaseStorage();
