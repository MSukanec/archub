import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb, real, unique, numeric } from "drizzle-orm/pg-core";
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
  last_user_type: text("last_user_type", { enum: ["professional", "learner", "provider", "worker", "visitor"] }),
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

// Roles Table
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  type: text("type"),
});

export type Role = typeof roles.$inferSelect;

// Organization Members Table
export const organization_members = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  user_id: uuid("user_id"),
  role_id: uuid("role_id"),
  invited_by: uuid("invited_by"),
  is_active: boolean("is_active").default(true).notNull(),
  joined_at: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  last_active_at: timestamp("last_active_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type OrganizationMember = typeof organization_members.$inferSelect;

// Organization Invitations Table
export const organization_invitations = pgTable("organization_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  user_id: uuid("user_id"),
  email: text("email").notNull(),
  role_id: uuid("role_id"),
  invited_by: uuid("invited_by"),
  status: text("status").default("pending"),
  token: text("token"),
  accepted_at: timestamp("accepted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertOrganizationInvitationSchema = createInsertSchema(organization_invitations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type OrganizationInvitation = typeof organization_invitations.$inferSelect;
export type InsertOrganizationInvitation = z.infer<typeof insertOrganizationInvitationSchema>;

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data"),
  audience: text("audience").default("direct").notNull(),
  role_id: uuid("role_id"),
  org_id: uuid("org_id"),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  start_at: timestamp("start_at", { withTimezone: true }),
  expires_at: timestamp("expires_at", { withTimezone: true }),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code"),
  param_values: jsonb("param_values").notNull(), // JSONB con los valores de parámetros
  param_order: text("param_order").array(), // Array con el orden de parámetros
  name_rendered: text("name_rendered"),
  custom_name: text("custom_name"),
  task_template_id: uuid("task_template_id"),
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

// Organization Task Prices Table
export const organization_task_prices = pgTable("organization_task_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  task_id: uuid("task_id").notNull(),
  labor_unit_cost: real("labor_unit_cost"),
  material_unit_cost: real("material_unit_cost"),
  supply_unit_cost: real("supply_unit_cost"),
  total_unit_cost: real("total_unit_cost"),
  currency_code: text("currency_code"),
  note: text("note"),
  updated_at: timestamp("updated_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  unique_org_task: unique().on(table.organization_id, table.task_id),
}));

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

// Budgets Table
export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  status: text("status").notNull().default("draft"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: uuid("created_by"),
  version: integer("version").notNull().default(1),
  currency_id: uuid("currency_id").notNull(),
  exchange_rate: real("exchange_rate"),
  // New fields for discount and VAT at budget level
  discount_pct: real("discount_pct").default(0),
  tax_pct: real("tax_pct").default(21), // Default 21% IVA for Argentina
  tax_label: text("tax_label").default("IVA"), // IVA or VAT
});

// Budget Items Table
export const budget_items = pgTable("budget_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  budget_id: uuid("budget_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  task_id: uuid("task_id"),
  organization_id: uuid("organization_id").notNull(),
  project_id: uuid("project_id").notNull(),
  description: text("description"),
  quantity: real("quantity").notNull().default(1),
  unit_price: real("unit_price").notNull().default(0),
  currency_id: uuid("currency_id").notNull(),
  markup_pct: real("markup_pct").notNull().default(0),
  tax_pct: real("tax_pct").notNull().default(0),
  created_by: uuid("created_by").notNull(),
  cost_scope: text("cost_scope", { enum: ["materials_and_labor", "materials_only", "labor_only"] }).notNull().default("materials_and_labor"),
  sort_key: real("sort_key").notNull().default(0),
});

// Schemas for budgets
export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBudgetItemSchema = createInsertSchema(budget_items).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types for budgets
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type BudgetItem = typeof budget_items.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;

// Movement General Costs Junction Table
export const movement_general_costs = pgTable("movement_general_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  movement_id: uuid("movement_id").notNull(),
  general_cost_id: uuid("general_cost_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Project Installments Table
export const project_installments = pgTable("project_installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  date: text("date").notNull(), // Fecha de vencimiento de la cuota
  number: integer("number").notNull(), // Número de cuota
  index_reference: integer("index_reference").default(0), // Índice de la cuota
  created_at: timestamp("created_at").defaultNow(),
});

// Project Personnel Table
export const project_personnel = pgTable("project_personnel", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  contact_id: uuid("contact_id").notNull(),
  labor_type_id: uuid("labor_type_id"),
  notes: text("notes"),
  start_date: text("start_date"), // Fecha de inicio del personal en el proyecto (date type)
  end_date: text("end_date"), // Fecha de finalización del personal en el proyecto (date type)
  status: text("status"), // 'active' | 'absent' | 'inactive'
  created_by: uuid("created_by"), // FK to organization_members
  organization_id: uuid("organization_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Personnel Attendees Table
export const personnel_attendees = pgTable("personnel_attendees", {
  id: uuid("id").primaryKey().defaultRandom(),
  site_log_id: uuid("site_log_id"), // Nullable - puede ser null para asistencias sin log
  personnel_id: uuid("personnel_id").notNull(), // FK to project_personnel
  attendance_type: text("attendance_type").notNull(), // 'full' | 'half'
  hours_worked: real("hours_worked").notNull(),
  description: text("description"),
  created_by: uuid("created_by"), // FK to organization_members
  project_id: uuid("project_id").notNull(),
  organization_id: uuid("organization_id").notNull(), // Nueva columna agregada
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Personnel Rates Table
export const personnel_rates = pgTable("personnel_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  personnel_id: uuid("personnel_id"), // FK to project_personnel, nullable (can be by labor_type instead)
  labor_type_id: uuid("labor_type_id"), // FK to labor_types, nullable (can be by personnel instead)
  rate_hour: numeric("rate_hour", { precision: 12, scale: 2 }),
  rate_day: numeric("rate_day", { precision: 12, scale: 2 }),
  rate_month: numeric("rate_month", { precision: 12, scale: 2 }),
  pay_type: text("pay_type").notNull().default("hour"), // 'hour' | 'day' | 'month'
  currency_id: uuid("currency_id").notNull(),
  valid_from: text("valid_from").notNull(), // fecha en formato YYYY-MM-DD
  valid_to: text("valid_to"), // nullable, fecha en formato YYYY-MM-DD
  is_active: boolean("is_active").notNull().default(true),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
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

export const insertOrganizationTaskPriceSchema = createInsertSchema(organization_task_prices).omit({
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

export const insertMovementGeneralCostSchema = createInsertSchema(movement_general_costs).omit({
  id: true,
  created_at: true,
});

export const insertProjectInstallmentSchema = createInsertSchema(project_installments).omit({
  id: true,
  created_at: true,
});

export const insertProjectPersonnelSchema = createInsertSchema(project_personnel).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPersonnelAttendeesSchema = createInsertSchema(personnel_attendees).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPersonnelRatesSchema = createInsertSchema(personnel_rates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPersonnelAttendeeSchema = createInsertSchema(personnel_attendees).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type PersonnelAttendee = typeof personnel_attendees.$inferSelect;
export type InsertPersonnelAttendee = z.infer<typeof insertPersonnelAttendeeSchema>;

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
export type OrganizationTaskPrice = typeof organization_task_prices.$inferSelect;
export type InsertOrganizationTaskPrice = z.infer<typeof insertOrganizationTaskPriceSchema>;
export type MovementTask = typeof movement_tasks.$inferSelect;
export type InsertMovementTask = z.infer<typeof insertMovementTaskSchema>;
export type MovementSubcontract = typeof movement_subcontracts.$inferSelect;
export type InsertMovementSubcontract = z.infer<typeof insertMovementSubcontractSchema>;
export type MovementClient = typeof movement_clients.$inferSelect;
export type InsertMovementClient = z.infer<typeof insertMovementClientSchema>;

export type MovementGeneralCost = typeof movement_general_costs.$inferSelect;
export type ProjectPersonnel = typeof project_personnel.$inferSelect;
export type InsertProjectPersonnel = z.infer<typeof insertProjectPersonnelSchema>;
export type PersonnelRate = typeof personnel_rates.$inferSelect;
export type InsertPersonnelRate = z.infer<typeof insertPersonnelRatesSchema>;
export type InsertMovementGeneralCost = z.infer<typeof insertMovementGeneralCostSchema>;
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

// Learning/Courses Tables
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  short_description: text("short_description"),
  long_description: text("long_description"),
  cover_url: text("cover_url"),
  is_active: boolean("is_active").notNull().default(true),
  visibility: text("visibility").notNull().default("public"),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const course_modules = pgTable("course_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sort_index: integer("sort_index").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const course_lessons = pgTable("course_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  module_id: uuid("module_id").notNull(),
  title: text("title").notNull(),
  vimeo_video_id: text("vimeo_video_id"),
  duration_sec: integer("duration_sec"),
  free_preview: boolean("free_preview").notNull().default(false),
  sort_index: integer("sort_index").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const course_lesson_progress = pgTable("course_lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  lesson_id: uuid("lesson_id").notNull(),
  progress_pct: numeric("progress_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  last_position_sec: integer("last_position_sec").notNull().default(0),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  is_completed: boolean("is_completed"),
  is_favorite: boolean("is_favorite").notNull().default(false), // 🌟 NUEVO: Lecciones favoritas
}, (table) => ({
  lesson_progress_unique: unique().on(table.user_id, table.lesson_id),
}));

export const course_lesson_notes = pgTable("course_lesson_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  lesson_id: uuid("lesson_id").notNull(),
  body: text("body").notNull(),
  time_sec: integer("time_sec"),
  is_pinned: boolean("is_pinned").notNull().default(false),
  note_type: text("note_type").notNull().default("marker"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  user_lesson_note_type_unique: unique().on(table.user_id, table.lesson_id, table.note_type),
}));

// Schemas for courses
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCourseModuleSchema = createInsertSchema(course_modules).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertLessonSchema = createInsertSchema(course_lessons).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCourseLessonProgressSchema = createInsertSchema(course_lesson_progress).omit({
  id: true,
  updated_at: true,
});

export const selectCourseLessonProgressSchema = createInsertSchema(course_lesson_progress);

export const insertCourseLessonNoteSchema = createInsertSchema(course_lesson_notes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types for courses
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseModule = typeof course_modules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type Lesson = typeof course_lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type CourseLessonProgress = typeof course_lesson_progress.$inferSelect;
export type InsertCourseLessonProgress = z.infer<typeof insertCourseLessonProgressSchema>;
export type CourseLessonNote = typeof course_lesson_notes.$inferSelect;
export type InsertCourseLessonNote = z.infer<typeof insertCourseLessonNoteSchema>;

// Payment Tables
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  provider_payment_id: text("provider_payment_id"),
  user_id: uuid("user_id").notNull(),
  course_id: uuid("course_id"), // Ahora nullable para soportar suscripciones
  // 🆕 Nuevas columnas para suscripciones/planes
  product_type: text("product_type"), // 'course' | 'subscription' | 'plan'
  product_id: uuid("product_id"),
  organization_id: uuid("organization_id"),
  approved_at: timestamp("approved_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  // Existentes
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("completed"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payment_events = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  provider_event_id: text("provider_event_id"),
  provider_event_type: text("provider_event_type"),
  status: text("status"),
  raw_payload: jsonb("raw_payload"),
  raw_headers: jsonb("raw_headers"),
  order_id: text("order_id"),
  custom_id: text("custom_id"),
  user_hint: text("user_hint"),
  course_hint: text("course_hint"),
  provider_payment_id: text("provider_payment_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bank_transfer_payments = pgTable("bank_transfer_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").notNull(),
  user_id: uuid("user_id").notNull(),
  course_id: uuid("course_id"), // ID del curso (guardado al crear)
  course_price_id: uuid("course_price_id"),
  payment_id: uuid("payment_id"), // FK a payments
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  receipt_url: text("receipt_url"),
  payer_name: text("payer_name"),
  payer_note: text("payer_note"),
  status: text("status").notNull().default("pending"),
  reviewed_by: uuid("reviewed_by"),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  review_reason: text("review_reason"),
  discount_percent: numeric("discount_percent", { precision: 5, scale: 2 }).default("5.0"),
  discount_amount: numeric("discount_amount", { precision: 14, scale: 2 }).default("0"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Schemas for payments
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  created_at: true,
});

export const insertPaymentEventSchema = createInsertSchema(payment_events).omit({
  id: true,
  created_at: true,
});

export const insertBankTransferPaymentSchema = createInsertSchema(bank_transfer_payments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types for payments
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type PaymentEvent = typeof payment_events.$inferSelect;
export type InsertPaymentEvent = z.infer<typeof insertPaymentEventSchema>;
export type BankTransferPayment = typeof bank_transfer_payments.$inferSelect;
export type InsertBankTransferPayment = z.infer<typeof insertBankTransferPaymentSchema>;

// Global Announcements Table
export const global_announcements = pgTable("global_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'info', 'warning', 'error', 'success'
  link_text: text("link_text"),
  link_url: text("link_url"),
  primary_button_text: text("primary_button_text"),
  primary_button_url: text("primary_button_url"),
  secondary_button_text: text("secondary_button_text"),
  secondary_button_url: text("secondary_button_url"),
  audience: text("audience").default("all"), // 'all', 'free', 'pro', 'teams'
  is_active: boolean("is_active").default(true),
  starts_at: timestamp("starts_at", { withTimezone: true }).defaultNow(),
  ends_at: timestamp("ends_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  created_by: uuid("created_by"),
});

export const insertGlobalAnnouncementSchema = createInsertSchema(global_announcements).omit({
  id: true,
  created_at: true,
});

export type GlobalAnnouncement = typeof global_announcements.$inferSelect;
export type InsertGlobalAnnouncement = z.infer<typeof insertGlobalAnnouncementSchema>;

// Support Messages Table
export const support_messages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  message: text("message").notNull(),
  sender: text("sender").notNull(), // 'user' o 'admin'
  read_by_admin: boolean("read_by_admin").default(false).notNull(),
  read_by_user: boolean("read_by_user").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertSupportMessageSchema = createInsertSchema(support_messages).omit({
  id: true,
  created_at: true,
});

export type SupportMessage = typeof support_messages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// User Presence Tracking Table
// Tracks real-time user presence and current location
export const user_presence = pgTable("user_presence", {
  user_id: uuid("user_id").primaryKey().notNull(),
  status: text("status").default("online"), // 'online', 'offline', 'away'
  current_view: text("current_view"), // Current page/view the user is on
  user_agent: text("user_agent"),
  locale: text("locale"),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  organization_id: uuid("organization_id"),
});

export type UserPresence = typeof user_presence.$inferSelect;

// User View History Table  
// Tracks historical analytics of user page views and time spent
export const user_view_history = pgTable("user_view_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  view_name: text("view_name").notNull(),
  entered_at: timestamp("entered_at", { withTimezone: true }).notNull(),
  exited_at: timestamp("exited_at", { withTimezone: true }),
  duration_seconds: integer("duration_seconds"),
  organization_id: uuid("organization_id"),
});

export type UserViewHistory = typeof user_view_history.$inferSelect;
