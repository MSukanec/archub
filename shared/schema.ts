import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  auth_id: uuid("auth_id").notNull().unique(),
  email: text("email").notNull().unique(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  avatar_source: text("avatar_source"),
  created_at: timestamp("created_at").defaultNow(),
});

export const countries = pgTable("countries", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  alpha_3: text("alpha_3").notNull(),
  country_code: text("country_code").notNull(),
});

export const user_data = pgTable("user_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  country: uuid("country"),
  birthdate: text("birthdate"),
  discovered_by: text("discovered_by"),
  discovered_by_other_text: text("discovered_by_other_text"),
  main_use: text("main_use"),
  main_use_other: text("main_use_other"),
  user_role: text("user_role"),
  user_role_other: text("user_role_other"),
  team_size: text("team_size"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const user_preferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  theme: text("theme").default("light"),
  sidebar_docked: boolean("sidebar_docked").default(true),
  last_organization_id: uuid("last_organization_id"),
  last_project_id: uuid("last_project_id"),
  last_budget_id: uuid("last_budget_id"),
  last_kanban_board_id: uuid("last_kanban_board_id"),
  last_user_type: text("last_user_type", { enum: ["professional", "provider", "worker", "visitor"] }),
  onboarding_completed: boolean("onboarding_completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  full_name: true,
  avatar_url: true,
});

export const insertUserDataSchema = createInsertSchema(user_data).pick({
  user_id: true,
  country: true,
  birthdate: true,
});

export const insertUserPreferencesSchema = createInsertSchema(user_preferences).pick({
  user_id: true,
  theme: true,
  sidebar_docked: true,
  last_organization_id: true,
});

// Design Documents Table
export const design_documents = pgTable("design_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  file_name: text("file_name").notNull(),
  description: text("description"),
  file_path: text("file_path").notNull(),
  file_url: text("file_url").notNull(),
  file_type: text("file_type").notNull(),
  file_size: integer("file_size"),
  version_number: integer("version_number").default(1),
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  design_phase_id: uuid("design_phase_id"),
  folder: text("folder").notNull(),
  status: text("status").default("pendiente"), // pendiente, en_revision, aprobado, rechazado
  visibility: text("visibility").default("public"), // public, private
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertDesignDocumentSchema = createInsertSchema(design_documents).pick({
  file_name: true,
  description: true,
  file_path: true,
  file_url: true,
  file_type: true,
  file_size: true,
  version_number: true,
  project_id: true,
  organization_id: true,
  design_phase_id: true,
  folder: true,
  status: true,
  visibility: true,
  created_by: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type UserData = typeof user_data.$inferSelect;
export type UserPreferences = typeof user_preferences.$inferSelect;
// Task Parameters System
export const task_parameters = pgTable("task_parameters", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(), // e.g., "brick-type"
  label: text("label").notNull(), // e.g., "Tipo de Ladrillo / Bloque"
  type: text("type", { enum: ["text", "number", "select", "boolean"] }).notNull(),
  required: boolean("required").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const task_parameter_options = pgTable("task_parameter_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  parameter_id: uuid("parameter_id").notNull(),
  name: text("name").notNull(), // e.g., "acindar"
  label: text("label").notNull(), // e.g., "Acindar"
  description: text("description"), // e.g., "Descripción detallada de la opción"
  created_at: timestamp("created_at").defaultNow(),
});

export const task_parameter_option_groups = pgTable("task_parameter_option_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  parameter_id: uuid("parameter_id").notNull(),
  name: text("name").notNull(), // e.g., "Griferías"
  created_at: timestamp("created_at").defaultNow(),
});

export const task_parameter_option_group_items = pgTable("task_parameter_option_group_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  option_group_id: uuid("option_group_id").notNull(),
  parameter_option_id: uuid("parameter_option_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Task Templates System - ELIMINADO (ya no se usa)

// Task Parameter Dependencies System
export const task_parameter_dependencies = pgTable("task_parameter_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  parent_parameter_id: uuid("parent_parameter_id").notNull(),
  parent_option_id: uuid("parent_option_id").notNull(),
  child_parameter_id: uuid("child_parameter_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const task_parameter_dependency_options = pgTable("task_parameter_dependency_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  dependency_id: uuid("dependency_id").notNull(),
  child_option_id: uuid("child_option_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertTaskParameterSchema = createInsertSchema(task_parameters).omit({
  id: true,
  created_at: true,
});

export const insertTaskParameterOptionSchema = createInsertSchema(task_parameter_options).omit({
  id: true,
  created_at: true,
});

export const insertTaskParameterOptionGroupSchema = createInsertSchema(task_parameter_option_groups).omit({
  id: true,
  created_at: true,
});

export const insertTaskParameterOptionGroupItemSchema = createInsertSchema(task_parameter_option_group_items).omit({
  id: true,
  created_at: true,
});

// Task Templates schemas eliminados

export const insertTaskParameterDependencySchema = createInsertSchema(task_parameter_dependencies).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTaskParameterDependencyOptionSchema = createInsertSchema(task_parameter_dependency_options).omit({
  id: true,
  created_at: true,
  updated_at: true,
})

// Task Parameter Positions Table
export const task_parameter_positions = pgTable("task_parameter_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  parameter_id: uuid("parameter_id"), // Puede ser null para nodos duplicados
  original_parameter_id: uuid("original_parameter_id"), // Referencia al parámetro original para duplicados
  x: integer("x").notNull().default(0),
  y: integer("y").notNull().default(0),
  visible_options: text("visible_options").array().notNull().default([]),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Task Parametric Table - Para guardar tareas generadas con configuración paramétrica
export const task_parametric = pgTable("task_parametric", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code"),
  template_id: uuid("template_id"),
  param_values: jsonb("param_values").notNull(), // JSONB con los valores de parámetros
  param_order: text("param_order").array(), // Array con el orden de parámetros
  organization_id: uuid("organization_id"),
  unit_id: uuid("unit_id"),
  task_group_id: uuid("task_group_id"),
  task_group_name: text("task_group_name"),
  category_id: uuid("category_id"),
  category_name: text("category_name"),
  category_code: text("category_code"),
  subcategory_id: uuid("subcategory_id"),
  subcategory_name: text("subcategory_name"),
  subcategory_code: text("subcategory_code"),
  rubro_id: uuid("rubro_id"),
  rubro_name: text("rubro_name"),
  rubro_code: text("rubro_code"),
  display_name: text("display_name"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertTaskParameterPositionSchema = createInsertSchema(task_parameter_positions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTaskParametricSchema = createInsertSchema(task_parametric).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type DesignDocument = typeof design_documents.$inferSelect;
export type InsertDesignDocument = z.infer<typeof insertDesignDocumentSchema>;
export type TaskParameter = typeof task_parameters.$inferSelect;
export type TaskParameterOption = typeof task_parameter_options.$inferSelect;
export type TaskParameterOptionGroup = typeof task_parameter_option_groups.$inferSelect;
export type TaskParameterOptionGroupItem = typeof task_parameter_option_group_items.$inferSelect;
export type InsertTaskParameter = z.infer<typeof insertTaskParameterSchema>;
export type InsertTaskParameterOption = z.infer<typeof insertTaskParameterOptionSchema>;
export type InsertTaskParameterOptionGroup = z.infer<typeof insertTaskParameterOptionGroupSchema>;
export type InsertTaskParameterOptionGroupItem = z.infer<typeof insertTaskParameterOptionGroupItemSchema>;
// Task Templates types eliminados
export type TaskParameterDependency = typeof task_parameter_dependencies.$inferSelect;
export type TaskParameterDependencyOption = typeof task_parameter_dependency_options.$inferSelect;
export type InsertTaskParameterDependency = z.infer<typeof insertTaskParameterDependencySchema>;
export type InsertTaskParameterDependencyOption = z.infer<typeof insertTaskParameterDependencyOptionSchema>;
export type TaskParameterPosition = typeof task_parameter_positions.$inferSelect;
export type InsertTaskParameterPosition = z.infer<typeof insertTaskParameterPositionSchema>;
export type TaskParametric = typeof task_parametric.$inferSelect;
export type InsertTaskParametric = z.infer<typeof insertTaskParametricSchema>;
