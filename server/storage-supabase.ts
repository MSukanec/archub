import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  materials, type Material, type InsertMaterial,
  tasks, type Task, type InsertTask,
  taskMaterials, type TaskMaterial, type InsertTaskMaterial,
  budgets, type Budget, type InsertBudget,
  budgetTasks, type BudgetTask, type InsertBudgetTask,
  categories, type Category, type InsertCategory,
  units, type Unit, type InsertUnit,
  transactions, type Transaction, type InsertTransaction
} from "@shared/schema";

import { IStorage } from "./storage";
import { supabase } from "./supabase";

// Función auxiliar para convertir nombres de campos y asegurar valores adecuados para Supabase
const prepareForDb = <T>(item: T): any => {
  if (!item || typeof item !== 'object') return item;
  
  const result = {...item as any};
  
  // Asegurar que valores opcionales sean null y no undefined
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      result[key] = null;
    }
  });
  
  // Convertir camelCase a snake_case para los campos específicos
  if ('userId' in result) {
    result.user_id = result.userId;
    delete result.userId;
  }
  
  if ('projectId' in result) {
    result.project_id = result.projectId;
    delete result.projectId;
  }
  
  if ('taskId' in result) {
    result.task_id = result.taskId;
    delete result.taskId;
  }
  
  if ('materialId' in result) {
    result.material_id = result.materialId;
    delete result.materialId;
  }
  
  if ('budgetId' in result) {
    result.budget_id = result.budgetId;
    delete result.budgetId;
  }
  
  if ('unitPrice' in result) {
    result.unit_price = result.unitPrice;
    delete result.unitPrice;
  }
  
  // Asegurar que valores numéricos son realmente números
  if ('unit_price' in result && result.unit_price !== null) {
    result.unit_price = Number(result.unit_price);
  }
  
  if ('quantity' in result && result.quantity !== null) {
    result.quantity = Number(result.quantity);
  }
  
  return result;
};

// Función auxiliar para convertir datos de Supabase al formato esperado por la aplicación
const convertFromDb = <T>(item: T): T => {
  if (!item || typeof item !== 'object') return item;
  
  const result = {...item as any};
  
  // Convertir snake_case a camelCase
  if ('user_id' in result) {
    result.userId = result.user_id;
    delete result.user_id;
  }
  
  if ('project_id' in result) {
    result.projectId = result.project_id;
    delete result.project_id;
  }
  
  if ('task_id' in result) {
    result.taskId = result.task_id;
    delete result.task_id;
  }
  
  if ('material_id' in result) {
    result.materialId = result.material_id;
    delete result.material_id;
  }
  
  if ('budget_id' in result) {
    result.budgetId = result.budget_id;
    delete result.budget_id;
  }
  
  if ('unit_price' in result) {
    result.unitPrice = result.unit_price;
    delete result.unit_price;
  }
  
  if ('created_at' in result) {
    result.createdAt = result.created_at;
    delete result.created_at;
  }
  
  if ('updated_at' in result) {
    result.updatedAt = result.updated_at;
    delete result.updated_at;
  }
  
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

// Mapeo de nombres de tablas (inicializado con valores por defecto)
const tableNames = {
  users: 'users',
  projects: 'projects',
  materials: 'materials', // Se detectará automáticamente si usamos 'materiales' o 'materials'
  tasks: 'tasks',
  taskMaterials: 'task_materials',
  budgets: 'budgets',
  budgetTasks: 'budget_tasks',
  categories: 'categories',
  units: 'units',
  transactions: 'transactions',
  organizations: 'organizations',
  organizationUsers: 'organization_users'
};

// Función asíncrona para inicializar y verificar tablas
(async function detectTables() {
  try {
    // Verificar qué tabla de materiales existe ('materials' o 'materiales')
    const { data: materialsTable, error: materialsError } = await supabase
      .from('materials')
      .select('id')
      .limit(1);
      
    if (materialsError && materialsError.code === '42P01') {
      console.log('Tabla "materials" no encontrada, verificando "materiales"...');
      
      const { data: materialesTable, error: materialesError } = await supabase
        .from('materiales')
        .select('id')
        .limit(1);
        
      if (!materialesError) {
        console.log('Usando tabla "materiales" (español) para compatibilidad');
        tableNames.materials = 'materiales';
      }
    } else {
      console.log('Usando tabla "materials" (inglés)');
    }
    
    // Verificar si existe la tabla transactions
    const { data: transactionsTable, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);
      
    if (transactionsError && transactionsError.code === '42P01') {
      console.log('ADVERTENCIA: La tabla "transactions" no existe. Las funciones de transacciones no funcionarán correctamente hasta que se cree la tabla.');
    } else {
      console.log('Tabla "transactions" encontrada correctamente.');
    }
  } catch (e) {
    console.error('Error detectando tablas:', e);
  }
})();

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
    
    // Convertir la estructura actual de la tabla "materiales" al formato esperado por la aplicación
    return data.map(item => {
      const material: any = {
        id: item.id,
        name: item.nombre || item.name || '',
        category: item.category || 'Materiales básicos',
        unit: item.unit || 'unidad',
        unitPrice: item.unit_price || item.unitPrice || 0,
        createdAt: item.created_at || item.createdAt || null,
        updatedAt: item.updated_at || item.updatedAt || null
      };
      return material as Material;
    });
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const { data, error } = await supabase
      .from(tableNames.materials)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    
    // Convertir la estructura actual de la tabla "materiales" al formato esperado por la aplicación
    const material: any = {
      id: data.id,
      name: data.nombre || data.name || '',
      category: data.category || 'Materiales básicos',
      unit: data.unit || 'unidad',
      unitPrice: data.unit_price || data.unitPrice || 0,
      createdAt: data.created_at || data.createdAt || null,
      updatedAt: data.updated_at || data.updatedAt || null
    };
    
    return material as Material;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    // Adaptar los campos del material según la estructura actual de la tabla
    let materialData;
    
    // Verificar si la tabla tiene la estructura nueva o vieja
    try {
      const { data: columnInfo, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', tableNames.materials)
        .eq('table_schema', 'public');
      
      const columns = columnInfo ? columnInfo.map(col => col.column_name) : [];
      
      if (columns.includes('nombre') && !columns.includes('name')) {
        // Estructura vieja (tabla "materiales")
        materialData = {
          nombre: material.name,
        };
      } else {
        // Estructura nueva o en transición
        materialData = prepareForDb(material);
      }
    } catch (e) {
      // Si no podemos verificar la estructura, intentamos con la adaptación más segura
      materialData = {
        nombre: material.name,
        name: material.name,
        category: material.category,
        unit: material.unit,
        unit_price: material.unitPrice
      };
    }
    
    const { data, error } = await supabase
      .from(tableNames.materials)
      .insert(materialData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear material: ${error.message}`);
    
    // Convertir la estructura actual de la tabla "materiales" al formato esperado por la aplicación
    const newMaterial: any = {
      id: data.id,
      name: data.nombre || data.name || '',
      category: data.category || 'Materiales básicos',
      unit: data.unit || 'unidad',
      unitPrice: data.unit_price || data.unitPrice || 0,
      createdAt: data.created_at || data.createdAt || null,
      updatedAt: data.updated_at || data.updatedAt || null
    };
    
    return newMaterial as Material;
  }

  async updateMaterial(id: number, materialData: Partial<InsertMaterial>): Promise<Material | undefined> {
    // Adaptar los campos del material según la estructura actual de la tabla
    let dbData;
    
    // Verificar si la tabla tiene la estructura nueva o vieja
    try {
      const { data: columnInfo, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', tableNames.materials)
        .eq('table_schema', 'public');
      
      const columns = columnInfo ? columnInfo.map(col => col.column_name) : [];
      
      if (columns.includes('nombre') && !columns.includes('name')) {
        // Estructura vieja (tabla "materiales")
        dbData = {
          nombre: materialData.name,
        };
      } else {
        // Estructura nueva o en transición
        dbData = prepareForDb(materialData);
      }
    } catch (e) {
      // Si no podemos verificar la estructura, intentamos con la adaptación más segura
      dbData = {
        nombre: materialData.name,
        name: materialData.name,
        category: materialData.category,
        unit: materialData.unit,
        unit_price: materialData.unitPrice
      };
    }
    
    const { data, error } = await supabase
      .from(tableNames.materials)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    
    // Convertir la estructura actual de la tabla "materiales" al formato esperado por la aplicación
    const updatedMaterial: any = {
      id: data.id,
      name: data.nombre || data.name || '',
      category: data.category || 'Materiales básicos',
      unit: data.unit || 'unidad',
      unitPrice: data.unit_price || data.unitPrice || 0,
      createdAt: data.created_at || data.createdAt || null,
      updatedAt: data.updated_at || data.updatedAt || null
    };
    
    return updatedMaterial as Material;
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

  // Categorías
  async getCategories(type?: string): Promise<Category[]> {
    let query = supabase
      .from(tableNames.categories)
      .select('*');
      
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query.order('position', { ascending: true });
    
    if (error) throw new Error(`Error al obtener categorías: ${error.message}`);
    
    const categories = convertArrayFromDb(data as Category[]);
    
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
    const { data, error } = await supabase
      .from(tableNames.categories)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    
    const category = convertFromDb(data as Category);
    
    // Buscar hijos de esta categoría
    const { data: children, error: childrenError } = await supabase
      .from(tableNames.categories)
      .select('*')
      .eq('parent_id', id)
      .order('position', { ascending: true });
      
    if (!childrenError && children && children.length > 0) {
      category.children = convertArrayFromDb(children as Category[]);
    }
    
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    // Convertir camelCase a snake_case para parentId
    const categoryData = { ...prepareForDb(category) };
    if ('parentId' in category) {
      categoryData.parent_id = category.parentId;
      delete categoryData.parentId;
    }
    
    const { data, error } = await supabase
      .from(tableNames.categories)
      .insert(categoryData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear categoría: ${error.message}`);
    return convertFromDb(data as Category);
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    // Convertir camelCase a snake_case para parentId
    const dbData = { ...prepareForDb(categoryData) };
    if ('parentId' in categoryData) {
      dbData.parent_id = categoryData.parentId;
      delete dbData.parentId;
    }
    
    const { data, error } = await supabase
      .from(tableNames.categories)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Category);
  }

  async updateCategoryPosition(id: number, newPosition: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.categories)
      .update({ position: newPosition })
      .eq('id', id);
      
    return !error;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Primero verificamos si hay categorías hijas
    const { data: children } = await supabase
      .from(tableNames.categories)
      .select('id')
      .eq('parent_id', id);
      
    // Si hay hijos, primero los eliminamos o los asignamos a otra categoría padre
    if (children && children.length > 0) {
      // Obtener el parent de la categoría que vamos a eliminar
      const { data: category } = await supabase
        .from(tableNames.categories)
        .select('parent_id')
        .eq('id', id)
        .single();
        
      // Asignar los hijos al parent de la categoría que estamos eliminando
      const parentId = category?.parent_id || null;
      
      const { error: updateError } = await supabase
        .from(tableNames.categories)
        .update({ parent_id: parentId })
        .eq('parent_id', id);
        
      if (updateError) return false;
    }
    
    // Ahora eliminamos la categoría
    const { error } = await supabase
      .from(tableNames.categories)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Unit operations
  async getUnits(): Promise<Unit[]> {
    const { data, error } = await supabase
      .from(tableNames.units)
      .select('*');
      
    if (error) throw new Error(`Error al obtener unidades: ${error.message}`);
    return convertArrayFromDb(data as Unit[]);
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    const { data, error } = await supabase
      .from(tableNames.units)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Unit);
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const unitData = prepareForDb(unit);
    
    const { data, error } = await supabase
      .from(tableNames.units)
      .insert(unitData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear unidad: ${error.message}`);
    return convertFromDb(data as Unit);
  }

  async updateUnit(id: number, unitData: Partial<InsertUnit>): Promise<Unit | undefined> {
    const dbData = prepareForDb(unitData);
    
    const { data, error } = await supabase
      .from(tableNames.units)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Unit);
  }

  async deleteUnit(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.units)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Métodos para transacciones
  async getTransactions(projectId: number): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from(tableNames.transactions)
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
      
    if (error) throw new Error(`Error al obtener transacciones: ${error.message}`);
    return convertArrayFromDb(data as Transaction[]);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from(tableNames.transactions)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Transaction);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const transactionData = prepareForDb(transaction);
    
    const { data, error } = await supabase
      .from(tableNames.transactions)
      .insert(transactionData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear transacción: ${error.message}`);
    return convertFromDb(data as Transaction);
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const dbData = prepareForDb(transactionData);
    
    const { data, error } = await supabase
      .from(tableNames.transactions)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Transaction);
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.transactions)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Organizaciones
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from(tableNames.organizations)
      .select('*');
      
    if (error) throw new Error(`Error al obtener organizaciones: ${error.message}`);
    return convertArrayFromDb(data as Organization[]);
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const { data, error } = await supabase
      .from(tableNames.organizations)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Organization);
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const orgData = prepareForDb(organization);
    
    const { data, error } = await supabase
      .from(tableNames.organizations)
      .insert(orgData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al crear organización: ${error.message}`);
    return convertFromDb(data as Organization);
  }

  async updateOrganization(id: number, organizationData: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const dbData = prepareForDb(organizationData);
    
    const { data, error } = await supabase
      .from(tableNames.organizations)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as Organization);
  }

  async deleteOrganization(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.organizations)
      .delete()
      .eq('id', id);
      
    return !error;
  }

  // Membresías de organizaciones
  async getOrganizationUsers(organizationId: number): Promise<OrganizationUser[]> {
    const { data, error } = await supabase
      .from(tableNames.organizationUsers)
      .select('*')
      .eq('organization_id', organizationId);
      
    if (error) throw new Error(`Error al obtener miembros de la organización: ${error.message}`);
    return convertArrayFromDb(data as OrganizationUser[]);
  }

  async getUserOrganizations(userId: number): Promise<Organization[]> {
    // Primero obtenemos los IDs de las organizaciones a las que pertenece el usuario
    const { data: userOrgs, error: orgsError } = await supabase
      .from(tableNames.organizationUsers)
      .select('organization_id')
      .eq('user_id', userId);
      
    if (orgsError) throw new Error(`Error al obtener organizaciones del usuario: ${orgsError.message}`);
    
    if (!userOrgs || userOrgs.length === 0) {
      return [];
    }
    
    // Extraemos los IDs de las organizaciones
    const orgIds = userOrgs.map(item => item.organization_id);
    
    // Obtenemos las organizaciones completas
    const { data: organizations, error: orgsDataError } = await supabase
      .from(tableNames.organizations)
      .select('*')
      .in('id', orgIds);
      
    if (orgsDataError) throw new Error(`Error al obtener datos de organizaciones: ${orgsDataError.message}`);
    
    return convertArrayFromDb(organizations as Organization[]);
  }

  async addUserToOrganization(orgUser: InsertOrganizationUser): Promise<OrganizationUser> {
    const userData = prepareForDb(orgUser);
    
    const { data, error } = await supabase
      .from(tableNames.organizationUsers)
      .insert(userData)
      .select()
      .single();
      
    if (error) throw new Error(`Error al añadir usuario a la organización: ${error.message}`);
    return convertFromDb(data as OrganizationUser);
  }

  async updateUserOrganizationRole(id: number, role: string): Promise<OrganizationUser | undefined> {
    const { data, error } = await supabase
      .from(tableNames.organizationUsers)
      .update({ role })
      .eq('id', id)
      .select()
      .single();
      
    if (error || !data) return undefined;
    return convertFromDb(data as OrganizationUser);
  }

  async removeUserFromOrganization(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(tableNames.organizationUsers)
      .delete()
      .eq('id', id);
      
    return !error;
  }
}