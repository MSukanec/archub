import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  materials, type Material, type InsertMaterial,
  tasks, type Task, type InsertTask,
  taskMaterials, type TaskMaterial, type InsertTaskMaterial,
  budgets, type Budget, type InsertBudget,
  budgetTasks, type BudgetTask, type InsertBudgetTask
} from "@shared/schema";

import { IStorage } from "./storage";
import { supabase } from "./supabase";

// Función auxiliar para convertir numbers para Supabase y null para valores opcionales
const prepareForDb = <T>(item: T): any => {
  if (!item || typeof item !== 'object') return item;
  
  const result = {...item as any};
  
  // Asegurar que valores opcionales sean null y no undefined
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      result[key] = null;
    }
  });
  
  return result;
};

// Función auxiliar para convertir datos de Supabase al formato esperado
const convertFromDb = <T>(item: T): T => {
  if (!item || typeof item !== 'object') return item;
  
  const result = {...item as any};
  
  // Convertir numeric (string) a number para JavaScript si es necesario
  if ('unitPrice' in result && result.unitPrice !== null && typeof result.unitPrice === 'string') {
    result.unitPrice = Number(result.unitPrice);
  }
  
  if ('quantity' in result && result.quantity !== null && typeof result.quantity === 'string') {
    result.quantity = Number(result.quantity);
  }
  
  return result as T;
};

// Auxiliar para procesar arrays de resultados
const convertArrayFromDb = <T>(items: T[]): T[] => {
  return items.map(item => convertFromDb(item));
};

// Mapeo de nombres de tablas
const tableNames = {
  users: 'users',
  projects: 'projects',
  materials: 'materials',
  tasks: 'tasks',
  taskMaterials: 'task_materials',
  budgets: 'budgets',
  budgetTasks: 'budget_tasks'
};

export class SupabaseStorage implements IStorage {
  // Usuarios
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from(tableNames.users)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as User);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from(tableNames.users)
      .select('*')
      .eq('username', username)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as User);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Asegurar que los campos opcionales son null y no undefined
    const userData = prepareForDb(insertUser);
    
    const { data, error } = await supabase
      .from(tableNames.users)
      .insert(userData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear usuario: ${error.message}`);
    return convertFromDb(data as User);
  }

  // Proyectos
  async getProjects(userId: number): Promise<Project[]> {
    const { data, error } = await supabase
      .from(tableNames.projects)
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw new Error(`Error al obtener proyectos: ${error.message}`);
    return convertArrayFromDb(data as Project[]);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from(tableNames.projects)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Project);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const projectData = prepareForDb(project);
    
    const { data, error } = await supabase
      .from(tableNames.projects)
      .insert(projectData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear proyecto: ${error.message}`);
    return convertFromDb(data as Project);
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const dbData = prepareForDb(projectData);
    
    const { data, error } = await supabase
      .from(tableNames.projects)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Project);
  }

  async deleteProject(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.projects)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Materiales
  async getMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from(tableNames.materials)
      .select('*');
      
    if (error) throw new Error(`Error al obtener materiales: ${error.message}`);
    return convertArrayFromDb(data as Material[]);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const { data, error } = await supabase
      .from(tableNames.materials)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Material);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const materialData = prepareForDb(material);
    
    const { data, error } = await supabase
      .from(tableNames.materials)
      .insert(materialData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear material: ${error.message}`);
    return convertFromDb(data as Material);
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    const dbData = prepareForDb(materialData);
    
    const { data, error } = await supabase
      .from(tableNames.materials)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Material);
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.materials)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Tareas
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from(tableNames.tasks)
      .select('*');
      
    if (error) throw new Error(`Error al obtener tareas: ${error.message}`);
    return convertArrayFromDb(data as Task[]);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from(tableNames.tasks)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Task);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const taskData = prepareForDb(task);
    
    const { data, error } = await supabase
      .from(tableNames.tasks)
      .insert(taskData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear tarea: ${error.message}`);
    return convertFromDb(data as Task);
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const dbData = prepareForDb(taskData);
    
    const { data, error } = await supabase
      .from(tableNames.tasks)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Task);
  }

  async deleteTask(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.tasks)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Relaciones Tarea-Material
  async getTaskMaterials(taskId: number): Promise<TaskMaterial[]> {
    const { data, error } = await supabase
      .from(tableNames.taskMaterials)
      .select('*')
      .eq('task_id', taskId);
      
    if (error) throw new Error(`Error al obtener materiales de tarea: ${error.message}`);
    return convertArrayFromDb(data as TaskMaterial[]);
  }

  async addTaskMaterial(taskMaterial: InsertTaskMaterial): Promise<TaskMaterial> {
    const taskMaterialData = prepareForDb(taskMaterial);
    
    const { data, error } = await supabase
      .from(tableNames.taskMaterials)
      .insert(taskMaterialData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al agregar material a tarea: ${error.message}`);
    return convertFromDb(data as TaskMaterial);
  }

  async removeTaskMaterial(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.taskMaterials)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Presupuestos
  async getBudgets(userId: number, isProjectId: boolean = false): Promise<Budget[]> {
    const fieldName = isProjectId ? 'project_id' : 'user_id';
    
    const { data, error } = await supabase
      .from(tableNames.budgets)
      .select('*')
      .eq(fieldName, userId);
      
    if (error) throw new Error(`Error al obtener presupuestos: ${error.message}`);
    return convertArrayFromDb(data as Budget[]);
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const { data, error } = await supabase
      .from(tableNames.budgets)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Budget);
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const budgetData = prepareForDb(budget);
    
    const { data, error } = await supabase
      .from(tableNames.budgets)
      .insert(budgetData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear presupuesto: ${error.message}`);
    return convertFromDb(data as Budget);
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const dbData = prepareForDb(budgetData);
    
    const { data, error } = await supabase
      .from(tableNames.budgets)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Budget);
  }

  async deleteBudget(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.budgets)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Tareas de Presupuesto
  async getBudgetTasks(budgetId: number): Promise<BudgetTask[]> {
    const { data, error } = await supabase
      .from(tableNames.budgetTasks)
      .select(`
        *,
        task:${tableNames.tasks}(*)
      `)
      .eq('budget_id', budgetId);
      
    if (error) throw new Error(`Error al obtener tareas de presupuesto: ${error.message}`);
    
    return data.map(item => {
      // Convertir la estructura anidada de Supabase al formato esperado por la aplicación
      const budgetTask = item as any;
      return convertFromDb({
        ...budgetTask,
        task: budgetTask.task ? convertFromDb(budgetTask.task) : undefined
      } as BudgetTask);
    });
  }

  async getBudgetTask(id: number): Promise<BudgetTask | undefined> {
    const { data, error } = await supabase
      .from(tableNames.budgetTasks)
      .select(`
        *,
        task:${tableNames.tasks}(*)
      `)
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    
    // Convertir la estructura anidada de Supabase al formato esperado por la aplicación
    const budgetTask = data as any;
    return convertFromDb({
      ...budgetTask,
      task: budgetTask.task ? convertFromDb(budgetTask.task) : undefined
    } as BudgetTask);
  }

  async addBudgetTask(budgetTask: InsertBudgetTask): Promise<BudgetTask> {
    const budgetTaskData = prepareForDb(budgetTask);
    
    const { data, error } = await supabase
      .from(tableNames.budgetTasks)
      .insert(budgetTaskData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al agregar tarea a presupuesto: ${error.message}`);
    return convertFromDb(data as BudgetTask);
  }

  async updateBudgetTask(id: number, quantity: number): Promise<BudgetTask | undefined> {
    const { data, error } = await supabase
      .from(tableNames.budgetTasks)
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as BudgetTask);
  }

  async removeBudgetTask(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.budgetTasks)
      .delete()
      .eq('id', id);
      
    return !error;
  }
}