import { pgTable, text, serial, numeric, timestamp, integer, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planning"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").notNull(),
});

// Materials table
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task materials join table
export const taskMaterials = pgTable("task_materials", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  materialId: integer("material_id").notNull(),
  quantity: numeric("quantity").notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget tasks join table
export const budgetTasks = pgTable("budget_tasks", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  taskId: integer("task_id").notNull(),
  quantity: numeric("quantity").notNull(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  avatarUrl: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  status: true,
  userId: true,
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  name: true,
  category: true,
  unit: true,
  unitPrice: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  name: true,
  category: true,
  unit: true,
  unitPrice: true,
});

export const insertTaskMaterialSchema = createInsertSchema(taskMaterials).pick({
  taskId: true,
  materialId: true,
  quantity: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).pick({
  name: true,
  description: true,
  projectId: true,
});

export const insertBudgetTaskSchema = createInsertSchema(budgetTasks).pick({
  budgetId: true,
  taskId: true,
  quantity: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskMaterial = typeof taskMaterials.$inferSelect;
export type InsertTaskMaterial = z.infer<typeof insertTaskMaterialSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type BudgetTask = typeof budgetTasks.$inferSelect;
export type InsertBudgetTask = z.infer<typeof insertBudgetTaskSchema>;
