import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb, real } from "drizzle-orm/pg-core";
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
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  file_name: text("file_name").notNull(),
  description: text("description"),
  file_path: text("file_path").notNull(),
  file_url: text("file_url").notNull(),
  file_type: text("file_type").notNull(),
  file_size: integer("file_size"),
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  folder_id: uuid("folder_id"),
  status: text("status").default("pendiente"), // pendiente, en_revision, aprobado, rechazado
  name: text("name"),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  file_name: true,
  description: true,
  file_path: true,
  file_url: true,
  file_type: true,
  file_size: true,
  project_id: true,
  organization_id: true,
  folder_id: true,
  status: true,
  name: true,
  created_by: true,
});

// Document Folders Table (renamed from design_document_folders)
export const design_document_folders = pgTable("document_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  project_id: uuid("project_id").notNull(),
  parent_id: uuid("parent_id"),
  created_by: uuid("created_by").notNull(),
});

export const insertDesignDocumentFolderSchema = createInsertSchema(design_document_folders).pick({
  organization_id: true,
  name: true,
  description: true,
  project_id: true,
  parent_id: true,
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
  expression_template: text("expression_template").notNull().default("{value}"),
  is_required: boolean("is_required").default(false),
  parent_id: uuid("parent_id"), // Referencia al parámetro padre
  order: integer("order").default(0), // Orden relativo dentro del nivel
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const task_parameter_options = pgTable("task_parameter_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  parameter_id: uuid("parameter_id").notNull(),
  name: text("name").notNull(), // e.g., "acindar"
  label: text("label").notNull(), // e.g., "Acindar"
  description: text("description"), // e.g., "Descripción detallada de la opción"
  unit_id: uuid("unit_id"), // For TIPO DE TAREA parameter: linked unit
  category_id: uuid("category_id"), // For TIPO DE TAREA parameter: linked category
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
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

// Task Templates System
export const task_templates = pgTable("task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  unit_id: uuid("unit_id"),
  name_expression: text("name_expression").notNull(),
  is_active: boolean("is_active").default(true),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const task_template_parameters = pgTable("task_template_parameters", {
  id: uuid("id").primaryKey().defaultRandom(),
  template_id: uuid("template_id").notNull(),
  parameter_id: uuid("parameter_id").notNull(),
  order_index: integer("order_index").default(0),
  is_required: boolean("is_required").default(true),
  condition_json: jsonb("condition_json"), // Usar jsonb en lugar de json para consistencia
  created_at: timestamp("created_at").defaultNow(),
});

export const insertTaskTemplateSchema = createInsertSchema(task_templates).omit({
  id: true,
  created_at: true,
});

export const insertTaskTemplateParameterSchema = createInsertSchema(task_template_parameters).omit({
  id: true,
  created_at: true,
});

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
  updated_at: true,
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

// Tasks table (renamed from task_parametric)
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code"),
  param_values: jsonb("param_values").notNull(), // JSONB con los valores de parámetros
  param_order: text("param_order").array(), // Array con el orden de parámetros
  name_rendered: text("name_rendered"),
  custom_name: text("custom_name"),
  is_system: boolean("is_system").default(true),
  organization_id: uuid("organization_id"),
  unit_id: uuid("unit_id"),
  category_id: uuid("category_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Task View - Para SELECT queries con información expandida
export type TaskView = {
  id: string;
  created_at: string;
  updated_at: string;
  param_values: Record<string, any>;
  param_order: string[];
  name_rendered: string;
  custom_name: string | null;
  code: string;
  is_system: boolean;
  organization_id: string | null;
  unit_id: string;
  unit_name: string;
  element_category_id: string;
  element_category_name: string;
  subcategory_id: string;
  subcategory_name: string;
  category_id: string;
  category_name: string;
  display_name: string;
};

export const organization_material_prices = pgTable("organization_material_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  material_id: uuid("material_id").notNull(),
  unit_price: real("unit_price").notNull(),
  currency_id: uuid("currency_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Movement Tasks Junction Table
export const movement_tasks = pgTable("movement_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  movement_id: uuid("movement_id").notNull(),
  task_id: uuid("task_id").notNull(), // construction_tasks.id
  created_at: timestamp("created_at").defaultNow(),
});

// Movement Subcontracts Junction Table
export const movement_subcontracts = pgTable("movement_subcontracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  movement_id: uuid("movement_id").notNull(),
  subcontract_id: uuid("subcontract_id").notNull(),
  amount: real("amount"),
  created_at: timestamp("created_at").defaultNow(),
});

// Movement Clients Junction Table
export const movement_clients = pgTable("movement_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  movement_id: uuid("movement_id").notNull(),
  project_client_id: uuid("project_client_id").notNull(),
  project_installment_id: uuid("project_installment_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Project Installments Table
export const project_installments = pgTable("project_installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  date: text("date").notNull(), // Fecha de vencimiento de la cuota
  number: integer("number").notNull(), // Número de cuota
  index: integer("index").notNull().default(0), // Índice de la cuota
  created_at: timestamp("created_at").defaultNow(),
});



export const insertTaskParameterPositionSchema = createInsertSchema(task_parameter_positions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export const insertOrganizationMaterialPriceSchema = createInsertSchema(organization_material_prices).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMovementTaskSchema = createInsertSchema(movement_tasks).omit({
  id: true,
  created_at: true,
});

export const insertMovementSubcontractSchema = createInsertSchema(movement_subcontracts).omit({
  id: true,
  created_at: true,
});

export const insertMovementClientSchema = createInsertSchema(movement_clients).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProjectInstallmentSchema = createInsertSchema(project_installments).omit({
  id: true,
  created_at: true,
});



export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type DesignDocument = typeof documents.$inferSelect;
export type InsertDesignDocument = z.infer<typeof insertDocumentSchema>;
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
// TaskParametric types removed - now using tasks table
export type OrganizationMaterialPrice = typeof organization_material_prices.$inferSelect;
export type InsertOrganizationMaterialPrice = z.infer<typeof insertOrganizationMaterialPriceSchema>;
export type MovementTask = typeof movement_tasks.$inferSelect;
export type InsertMovementTask = z.infer<typeof insertMovementTaskSchema>;
export type MovementSubcontract = typeof movement_subcontracts.$inferSelect;
export type InsertMovementSubcontract = z.infer<typeof insertMovementSubcontractSchema>;
export type MovementClient = typeof movement_clients.$inferSelect;
export type InsertMovementClient = z.infer<typeof insertMovementClientSchema>;
export type ProjectInstallment = typeof project_installments.$inferSelect;
export type InsertProjectInstallment = z.infer<typeof insertProjectInstallmentSchema>;


// Subcontracts tables
export const subcontracts = pgTable("subcontracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  contact_id: uuid("contact_id"),
  code: text("code"),
  title: text("title").notNull(),
  date: text("date").notNull(),
  currency_id: uuid("currency_id"),
  amount_total: real("amount_total"),
  exchange_rate: real("exchange_rate"),
  status: text("status").default("draft"),
  notes: text("notes"),
  winner_bid_id: uuid("winner_bid_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const subcontract_tasks = pgTable("subcontract_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  subcontract_id: uuid("subcontract_id").notNull(),
  task_id: uuid("task_id").notNull(),
  amount: real("amount").default(0),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// Subcontract Bids/Offers table - Based on actual Supabase structure
export const subcontract_bids = pgTable("subcontract_bids", {
  id: uuid("id").primaryKey().defaultRandom(),
  contact_id: uuid("contact_id"), // El subcontratista que hace la oferta
  amount: real("amount").notNull(), // Monto de la oferta
  currency_id: uuid("currency_id"),
  exchange_rate: real("exchange_rate"),
  notes: text("notes"), // Detalles adicionales de la oferta
  submitted_at: text("submitted_at"), // Fecha de envío de la oferta
  status: text("status").default("pendiente"), // pendiente, aceptada, rechazada
  created_by: uuid("created_by"), // Usuario que creó la oferta
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Schemas for subcontracts
export const insertSubcontractSchema = createInsertSchema(subcontracts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSubcontractTaskSchema = createInsertSchema(subcontract_tasks).omit({
  id: true,
  created_at: true,
});

export const insertSubcontractBidSchema = createInsertSchema(subcontract_bids).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types for subcontracts
export type Subcontract = typeof subcontracts.$inferSelect;
export type InsertSubcontract = z.infer<typeof insertSubcontractSchema>;
export type SubcontractTask = typeof subcontract_tasks.$inferSelect;
export type InsertSubcontractTask = z.infer<typeof insertSubcontractTaskSchema>;
export type SubcontractBid = typeof subcontract_bids.$inferSelect;
export type InsertSubcontractBid = z.infer<typeof insertSubcontractBidSchema>;
