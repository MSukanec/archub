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
  getBudgets(projectId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Budget Task operations
  getBudgetTasks(budgetId: number): Promise<BudgetTask[]>;
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
  async getBudgets(projectId: number): Promise<Budget[]> {
    return Array.from(this.budgetMap.values()).filter(
      (budget) => budget.projectId === projectId
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

export const storage = new MemStorage();
