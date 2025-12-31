import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb, real, unique, numeric, varchar } from "drizzle-orm/pg-core";
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
  role_id: uuid("role_id"),
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

export const user_organization_preferences = pgTable("user_organization_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  last_project_id: uuid("last_project_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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

// Status enum for courses and plans
export const itemStatusEnum = ['available', 'coming_soon', 'maintenance'] as const;
export type ItemStatus = typeof itemStatusEnum[number];

// Plans Table
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  features: jsonb("features"),
  price: numeric("price", { precision: 10, scale: 2 }), // Deprecated - mantener para compatibilidad
  monthly_amount: numeric("monthly_amount", { precision: 10, scale: 2 }),
  annual_amount: numeric("annual_amount", { precision: 10, scale: 2 }),
  is_active: boolean("is_active").default(true),
  status: text("status").notNull().default("available"), // available | coming_soon | maintenance
  billing_type: text("billing_type").default("per_user"),
  // PayPal Billing Plans - Production
  paypal_product_id: text("paypal_product_id"),
  paypal_plan_monthly_id: text("paypal_plan_monthly_id"),
  paypal_plan_annual_id: text("paypal_plan_annual_id"),
  // PayPal Billing Plans - Sandbox
  paypal_product_id_sandbox: text("paypal_product_id_sandbox"),
  paypal_plan_monthly_id_sandbox: text("paypal_plan_monthly_id_sandbox"),
  paypal_plan_annual_id_sandbox: text("paypal_plan_annual_id_sandbox"),
  // MercadoPago Preapproval Plans (for recurring subscriptions)
  mp_plan_monthly_id: text("mp_plan_monthly_id"),
  mp_plan_annual_id: text("mp_plan_annual_id"),
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

// Exchange Rates Table
export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniquePair: unique().on(table.fromCurrency, table.toCurrency),
}));

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

// Organizations Table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  name: text("name").notNull(),
  created_by: uuid("created_by").notNull(),
  is_active: boolean("is_active").default(true),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  plan_id: uuid("plan_id"),
  is_system: boolean("is_system").default(false),
  logo_url: text("logo_url"),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// Organization Data Table (extended information for organizations)
export const organization_data = pgTable("organization_data", {
  organization_id: uuid("organization_id").primaryKey().notNull(),
  
  // Profile fields (from OrganizationProfileView)
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  tax_id: text("tax_id"),
  
  // Location - Basic Fields
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postal_code: text("postal_code"),
  
  // Location - Google Places Integration
  address_full: text("address_full"),
  place_id: text("place_id"),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  
  // Location - Additional Info
  timezone: text("timezone"),
  location_type: text("location_type", { enum: ["urban", "rural", "industrial", "other"] }),
  accessibility_notes: text("accessibility_notes"),
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type OrganizationData = typeof organization_data.$inferSelect;
export type InsertOrganizationData = typeof organization_data.$inferInsert;

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
  is_billable: boolean("is_billable").default(true).notNull(),
  is_over_limit: boolean("is_over_limit").default(false).notNull(),
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

// Projects Table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code"),
  organization_id: uuid("organization_id").notNull(),
  created_by: uuid("created_by").notNull(),
  status: text("status").notNull().default("active"),
  is_active: boolean("is_active").notNull().default(true),
  is_over_limit: boolean("is_over_limit").notNull().default(false),
  color: text("color"),
  use_custom_color: boolean("use_custom_color").notNull().default(false),
  custom_color_h: integer("custom_color_h"),
  custom_color_hex: text("custom_color_hex"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  last_active_at: timestamp("last_active_at", { withTimezone: true }),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Project Data Table (extended information for projects)
export const project_data = pgTable("project_data", {
  project_id: uuid("project_id").primaryKey().notNull(),
  organization_id: uuid("organization_id"),
  
  // Surface/Area
  surface_total: numeric("surface_total", { precision: 12, scale: 2 }),
  surface_covered: numeric("surface_covered", { precision: 12, scale: 2 }),
  surface_semi: numeric("surface_semi", { precision: 12, scale: 2 }),
  
  // Dates
  start_date: timestamp("start_date", { mode: 'date' }),
  estimated_end: timestamp("estimated_end", { mode: 'date' }),
  
  // Project Classification
  project_type_id: uuid("project_type_id"),
  project_modality_id: uuid("project_modality_id"),
  
  // Image (cover image only - 1:1 relationship)
  image_bucket: text("image_bucket"),
  image_path: text("image_path"),
  is_public: boolean("is_public").notNull().default(true), // RLS: controls storage access
  
  // Location - Basic Fields
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zip_code: text("zip_code"),
  
  // Location - Google Places Integration
  address_full: text("address_full"),
  place_id: text("place_id"),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  
  // Location - Additional Info
  timezone: text("timezone"),
  location_type: text("location_type", { enum: ["urban", "rural", "industrial", "other"] }),
  accessibility_notes: text("accessibility_notes"),
  
  // Client Info
  client_name: text("client_name"),
  contact_phone: text("contact_phone"),
  email: text("email"),
  
  // Project Details
  description: text("description"),
  internal_notes: text("internal_notes"),
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type ProjectData = typeof project_data.$inferSelect;
export type InsertProjectData = typeof project_data.$inferInsert;

// Client Portal Settings Table (per-project configuration)
export const client_portal_settings = pgTable("client_portal_settings", {
  project_id: uuid("project_id").primaryKey().notNull(),
  organization_id: uuid("organization_id").notNull(),
  
  // Visible sections
  show_dashboard: boolean("show_dashboard").notNull().default(true),
  show_installments: boolean("show_installments").notNull().default(true),
  show_payments: boolean("show_payments").notNull().default(true),
  show_logs: boolean("show_logs").notNull().default(true),
  
  // Additional options
  show_amounts: boolean("show_amounts").notNull().default(true),
  show_progress: boolean("show_progress").notNull().default(true),
  allow_comments: boolean("allow_comments").notNull().default(false),
  
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updated_by: uuid("updated_by"),
});

export const insertClientPortalSettingsSchema = createInsertSchema(client_portal_settings).omit({
  updated_at: true,
});

export type ClientPortalSettings = typeof client_portal_settings.$inferSelect;
export type InsertClientPortalSettings = typeof client_portal_settings.$inferInsert;

// Project Types Table
export const project_types = pgTable("project_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category"),
  icon: text("icon"),
  color: text("color"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  is_default: boolean("is_default").notNull().default(false),
  organization_id: uuid("organization_id"),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  created_by: uuid("created_by"),
});

export const insertProjectTypeSchema = createInsertSchema(project_types).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export type ProjectType = typeof project_types.$inferSelect;
export type InsertProjectType = z.infer<typeof insertProjectTypeSchema>;

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

// ============================================
// CLIENT MANAGEMENT TABLES
// ============================================

// Currencies Table (Reference table for multi-currency support)
export const currencies = pgTable("currencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimal_places: integer("decimal_places").notNull().default(2),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Organization Wallets Table (For client payments)
export const organization_wallets = pgTable("organization_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  currency_id: uuid("currency_id").notNull(),
  type: text("type").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Contacts Table (Clients, Suppliers, etc.)
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  full_name: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  company_name: text("company_name"),
  location: text("location"),
  notes: text("notes"),
  national_id: text("national_id"),
  linked_user_id: uuid("linked_user_id"),
  image_bucket: text("image_bucket"),
  image_path: text("image_path"),
  avatar_updated_at: timestamp("avatar_updated_at", { withTimezone: true }),
  is_local: boolean("is_local").default(true),
  display_name_override: text("display_name_override"),
  linked_at: timestamp("linked_at", { withTimezone: true }),
  sync_status: text("sync_status").default("local"),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Client Roles Table
export const client_roles = pgTable("client_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id"),
  name: text("name").notNull(),
  description: text("description"),
  is_default: boolean("is_default").default(true),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Project Clients Table (Links contacts to projects as clients)
export const project_clients = pgTable("project_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  contact_id: uuid("contact_id"),
  organization_id: uuid("organization_id").notNull(),
  unit: text("unit"),
  is_primary: boolean("is_primary").notNull().default(true),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  client_role_id: uuid("client_role_id"),
  created_by: uuid("created_by"),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Client Commitments Table (Financial commitments from clients)
export const client_commitments = pgTable("client_commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  client_id: uuid("client_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency_id: uuid("currency_id").notNull(),
  exchange_rate: numeric("exchange_rate").notNull(),
  commitment_method: text("commitment_method", { 
    enum: ["fixed", "installments_fixed", "installments_indexed", "milestones", "custom"] 
  }).notNull().default("fixed"),
  installments_count: integer("installments_count"),
  installments_frequency: text("installments_frequency", { enum: ["monthly", "bimonthly", "quarterly", "yearly"] }),
  installments_start_date: timestamp("installments_start_date", { mode: 'date' }),
  installments_distribution: text("installments_distribution", { enum: ["equal", "custom"] }),
  index_type: text("index_type", { enum: ["cac", "uvi", "ipc", "custom_index"] }),
  index_frequency: text("index_frequency", { enum: ["monthly", "quarterly"] }),
  created_by: uuid("created_by"),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Client Payment Schedule Table (Installments and due dates)
export const client_payment_schedule = pgTable("client_payment_schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  commitment_id: uuid("commitment_id").notNull(),
  due_date: timestamp("due_date", { mode: 'date' }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency_id: uuid("currency_id").notNull(),
  status: text("status").notNull().default("pending"),
  paid_at: timestamp("paid_at", { withTimezone: true }),
  payment_method: text("payment_method"),
  notes: text("notes"),
  organization_id: uuid("organization_id").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Client Payments Table (Actual payments received from clients)
export const client_payments = pgTable("client_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  commitment_id: uuid("commitment_id"),
  schedule_id: uuid("schedule_id"),
  organization_id: uuid("organization_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency_id: uuid("currency_id").notNull(),
  exchange_rate: numeric("exchange_rate"),
  payment_date: timestamp("payment_date", { mode: 'date' }).notNull().defaultNow(),
  notes: text("notes"),
  reference: text("reference"),
  wallet_id: uuid("wallet_id").notNull(),
  client_id: uuid("client_id"),
  status: text("status").notNull().default("confirmed"),
  created_by: uuid("created_by"),
  file_url: text("file_url"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// CLIENT MANAGEMENT SCHEMAS AND TYPES
// ============================================

// Currency Schemas
export const insertCurrencySchema = createInsertSchema(currencies).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;

// Organization Wallet Schemas
export const insertOrganizationWalletSchema = createInsertSchema(organization_wallets).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type OrganizationWallet = typeof organization_wallets.$inferSelect;
export type InsertOrganizationWallet = z.infer<typeof insertOrganizationWalletSchema>;

// Contact Schemas
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Client Role Schemas
export const insertClientRoleSchema = createInsertSchema(client_roles).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export type ClientRole = typeof client_roles.$inferSelect;
export type InsertClientRole = z.infer<typeof insertClientRoleSchema>;

// Project Client Schemas
export const insertProjectClientSchema = createInsertSchema(project_clients).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export type ProjectClient = typeof project_clients.$inferSelect;
export type InsertProjectClient = z.infer<typeof insertProjectClientSchema>;

// Client Commitment Schemas
export const insertClientCommitmentSchema = createInsertSchema(client_commitments).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export type ClientCommitment = typeof client_commitments.$inferSelect;
export type InsertClientCommitment = z.infer<typeof insertClientCommitmentSchema>;

// Client Payment Schedule Schemas
export const insertClientPaymentScheduleSchema = createInsertSchema(client_payment_schedule).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ClientPaymentSchedule = typeof client_payment_schedule.$inferSelect;
export type InsertClientPaymentSchedule = z.infer<typeof insertClientPaymentScheduleSchema>;

// Client Payment Schemas
export const insertClientPaymentSchema = createInsertSchema(client_payments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ClientPayment = typeof client_payments.$inferSelect;
export type InsertClientPayment = z.infer<typeof insertClientPaymentSchema>;

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
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
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


export const insertProjectPersonnelSchema = createInsertSchema(project_personnel).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
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
export type ProjectPersonnel = typeof project_personnel.$inferSelect;
export type InsertProjectPersonnel = z.infer<typeof insertProjectPersonnelSchema>;
export type PersonnelRate = typeof personnel_rates.$inferSelect;
export type InsertPersonnelRate = z.infer<typeof insertPersonnelRatesSchema>;


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
  cover_url: text("cover_url"), // LEGACY - will be removed after media migration
  is_active: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("available"), // available | coming_soon | maintenance
  visibility: text("visibility").notNull().default("public"),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  price: numeric("price", { precision: 10, scale: 2 }), // Price in USD (like plans table)
  // Soft delete
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  // 🎓 Instructor fields for landing pages (LEGACY - moved to course_details)
  instructor_name: text("instructor_name"),
  instructor_title: text("instructor_title"),
  instructor_bio: text("instructor_bio"),
  instructor_photo_url: text("instructor_photo_url"),
  // 🎨 Marketing fields for landing pages (LEGACY - moved to course_details)
  badge_text: text("badge_text"),
  highlights: text("highlights").array(),
  preview_video_id: text("preview_video_id"),
  // 🔍 SEO fields for landing pages (LEGACY - moved to course_details)
  seo_keywords: text("seo_keywords").array(),
  og_image_url: text("og_image_url"),
  // 📄 Landing page section customization (LEGACY - moved to course_details)
  landing_sections: jsonb("landing_sections"),
});

export const course_details = pgTable("course_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").notNull().unique(),
  // 🎓 Instructor fields for landing pages
  instructor_name: text("instructor_name"),
  instructor_title: text("instructor_title"),
  instructor_bio: text("instructor_bio"),
  // 🎨 Marketing fields for landing pages
  badge_text: text("badge_text"),
  highlights: text("highlights").array(),
  preview_video_id: text("preview_video_id"),
  // 🔍 SEO fields for landing pages
  seo_keywords: text("seo_keywords").array(),
  // 📄 Landing page section customization
  landing_sections: jsonb("landing_sections"),
  // 🖼️ Course cover image (1:1 relationship - metadata stored here)
  image_bucket: text("image_bucket"),
  image_path: text("image_path"),
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

export const course_faqs = pgTable("course_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sort_index: integer("sort_index").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id"),
  course_id: uuid("course_id"),
  organization_id: uuid("organization_id"),
  product_id: uuid("product_id"),
  author_name: text("author_name").notNull(),
  author_title: text("author_title"),
  author_avatar_url: text("author_avatar_url"),
  content: text("content").notNull(),
  rating: integer("rating"),
  is_featured: boolean("is_featured").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  sort_index: integer("sort_index").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  is_deleted: boolean("is_deleted").notNull().default(false),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

// Schemas for courses
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

export const insertCourseDetailsSchema = createInsertSchema(course_details).omit({
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

export const insertCourseFaqSchema = createInsertSchema(course_faqs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
  deleted_at: true,
});

// Landing Sections Schema
export const landingSectionSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
});

export const landingSectionsSchema = z.object({
  instructor: landingSectionSchema.optional(),
  modules: landingSectionSchema.optional(),
  features: landingSectionSchema.optional(),
  testimonials: landingSectionSchema.optional(),
  faq: landingSectionSchema.optional(),
}).optional();

// Types for courses
export type LandingSection = z.infer<typeof landingSectionSchema>;
export type LandingSections = z.infer<typeof landingSectionsSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseDetails = typeof course_details.$inferSelect;
export type InsertCourseDetails = z.infer<typeof insertCourseDetailsSchema>;
// Extended type for admin API responses with computed fields
export type CourseWithEnrolledCount = Course & { enrolled_count: number };
export type CourseModule = typeof course_modules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type Lesson = typeof course_lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type CourseLessonProgress = typeof course_lesson_progress.$inferSelect;
export type InsertCourseLessonProgress = z.infer<typeof insertCourseLessonProgressSchema>;
export type CourseLessonNote = typeof course_lesson_notes.$inferSelect;
export type InsertCourseLessonNote = z.infer<typeof insertCourseLessonNoteSchema>;
export type CourseFaq = typeof course_faqs.$inferSelect;
export type InsertCourseFaq = z.infer<typeof insertCourseFaqSchema>;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

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
  exchange_rate: numeric("exchange_rate", { precision: 10, scale: 4 }), // Cotización del día de la transacción
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
  image_bucket: text("image_bucket"), // Storage bucket name (e.g., 'private-assets')
  image_path: text("image_path"), // Full path within bucket (e.g., 'marketplace/receipts/...')
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

// Plan Prices Table
export const plan_prices = pgTable("plan_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan_id: uuid("plan_id").notNull(),
  currency_code: text("currency_code").notNull(),
  monthly_amount: numeric("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  annual_amount: numeric("annual_amount", { precision: 10, scale: 2 }).notNull(),
  provider: text("provider").default("any"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertPlanPriceSchema = createInsertSchema(plan_prices).omit({
  id: true,
  created_at: true,
});

// Organization Subscriptions Table
export const organization_subscriptions = pgTable("organization_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  plan_id: uuid("plan_id").notNull(),
  payment_id: uuid("payment_id"),
  status: text("status").notNull().default("active"),
  billing_period: text("billing_period").notNull(),
  started_at: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
  scheduled_downgrade_plan_id: uuid("scheduled_downgrade_plan_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  // Provider subscription tracking (for PayPal/MercadoPago recurring subscriptions)
  provider: text("provider"), // 'paypal' | 'mercadopago' | 'bank_transfer'
  provider_subscription_id: text("provider_subscription_id"), // PayPal subscription ID or MP preapproval ID
  payer_email: text("payer_email"), // Email used for MP payments (required for seat billing)
  // Coupon tracking
  coupon_id: uuid("coupon_id"),
  coupon_code: text("coupon_code"),
});

export const insertOrganizationSubscriptionSchema = createInsertSchema(organization_subscriptions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Organization Billing Cycles Table
export const organization_billing_cycles = pgTable("organization_billing_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  subscription_id: uuid("subscription_id"),
  plan_id: uuid("plan_id").notNull(),
  
  seats: integer("seats").notNull(),
  billed_seats: integer("billed_seats").notNull().default(1),
  amount_per_seat: numeric("amount_per_seat", { precision: 10, scale: 2 }).notNull(),
  seat_price_source: text("seat_price_source"),
  
  base_amount: numeric("base_amount", { precision: 10, scale: 2 }).notNull(),
  proration_adjustment: numeric("proration_adjustment", { precision: 10, scale: 2 }).default("0"),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  billing_period: text("billing_period").notNull(),
  period_start: timestamp("period_start", { withTimezone: true }).notNull(),
  period_end: timestamp("period_end", { withTimezone: true }).notNull(),
  
  paid: boolean("paid").default(false),
  status: text("status").default("pending"),
  payment_provider: text("payment_provider"),
  payment_id: text("payment_id"),
  currency_code: text("currency_code").notNull().default("USD"),
  
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertOrganizationBillingCycleSchema = createInsertSchema(organization_billing_cycles).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Organization Member Events Table
export const organization_member_events = pgTable("organization_member_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  subscription_id: uuid("subscription_id"),
  member_id: uuid("member_id").notNull(),
  user_id: uuid("user_id"),
  
  event_type: text("event_type").notNull(), // 'member_added', 'member_removed', 'billable_enabled', 'billable_disabled'
  
  was_billable: boolean("was_billable"),
  is_billable: boolean("is_billable"),
  
  event_date: timestamp("event_date", { withTimezone: true }).notNull().defaultNow(),
  performed_by: uuid("performed_by"),
  
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertOrganizationMemberEventSchema = createInsertSchema(organization_member_events).omit({
  id: true,
  created_at: true,
});

// System Job Logs Table - For auditing automated system processes
export const system_job_logs = pgTable("system_job_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").notNull(),
  subscription_id: uuid("subscription_id"),
  job_type: text("job_type").notNull(), // 'execute_downgrade', 'auto_renewal', etc.
  details: jsonb("details"), // { from_plan, to_plan, reason, etc. }
  status: text("status").notNull(), // 'success', 'error'
  error_message: text("error_message"),
  processed_at: timestamp("processed_at", { withTimezone: true }).defaultNow(),
});

export const insertSystemJobLogSchema = createInsertSchema(system_job_logs).omit({
  id: true,
  processed_at: true,
});

// Types for payments
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type PaymentEvent = typeof payment_events.$inferSelect;
export type InsertPaymentEvent = z.infer<typeof insertPaymentEventSchema>;
export type BankTransferPayment = typeof bank_transfer_payments.$inferSelect;
export type InsertBankTransferPayment = z.infer<typeof insertBankTransferPaymentSchema>;
export type PlanPrice = typeof plan_prices.$inferSelect;
export type InsertPlanPrice = z.infer<typeof insertPlanPriceSchema>;
export type OrganizationSubscription = typeof organization_subscriptions.$inferSelect;
export type InsertOrganizationSubscription = z.infer<typeof insertOrganizationSubscriptionSchema>;
export type OrganizationBillingCycle = typeof organization_billing_cycles.$inferSelect;
export type InsertOrganizationBillingCycle = z.infer<typeof insertOrganizationBillingCycleSchema>;
export type OrganizationMemberEvent = typeof organization_member_events.$inferSelect;
export type InsertOrganizationMemberEvent = z.infer<typeof insertOrganizationMemberEventSchema>;
export type SystemJobLog = typeof system_job_logs.$inferSelect;
export type InsertSystemJobLog = z.infer<typeof insertSystemJobLogSchema>;

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

// Media Files Table (Centralized file storage)
export const media_files = pgTable("media_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id"),
  created_by: uuid("created_by"),
  bucket: text("bucket").notNull().default("media"),
  file_path: text("file_path").notNull(),
  file_name: text("file_name").notNull(),
  file_url: text("file_url").notNull(),
  file_type: text("file_type", { enum: ["image", "video", "pdf", "doc", "other"] }).notNull(),
  file_size: integer("file_size"),
  is_public: boolean("is_public").default(false).notNull(),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertMediaFileSchema = createInsertSchema(media_files).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type MediaFile = typeof media_files.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

// Media Links Table (Relationships between files and entities)
export const media_links = pgTable("media_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  media_file_id: uuid("media_file_id").notNull(),
  organization_id: uuid("organization_id"),
  project_id: uuid("project_id"),
  site_log_id: uuid("site_log_id"),
  movement_id: uuid("movement_id"),
  contact_id: uuid("contact_id"),
  course_lesson_id: uuid("course_lesson_id"),
  general_cost_id: uuid("general_cost_id"),
  general_cost_payment_id: uuid("general_cost_payment_id"),
  client_payment_id: uuid("client_payment_id"),
  course_id: uuid("course_id"),
  course_module_id: uuid("course_module_id"),
  hero_section_id: uuid("hero_section_id"),
  created_by: uuid("created_by"),
  visibility: text("visibility", { enum: ["public", "organization", "private"] }).default("organization").notNull(),
  description: text("description"),
  category: text("category"),
  is_cover: boolean("is_cover").default(false),
  position: integer("position"),
  metadata: jsonb("metadata"),
  is_public: boolean("is_public").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertMediaLinkSchema = createInsertSchema(media_links).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type MediaLink = typeof media_links.$inferSelect;
export type InsertMediaLink = z.infer<typeof insertMediaLinkSchema>;

// Hero Sections Table (for dynamic carousel hero content - admin only)
export const hero_sections = pgTable("hero_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  section_type: text("section_type").notNull().default("learning_dashboard"),
  order_index: integer("order_index").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  primary_button_text: text("primary_button_text"),
  primary_button_action: text("primary_button_action"),
  primary_button_action_type: text("primary_button_action_type", { enum: ["url", "internal_route", "external"] }).default("url"),
  secondary_button_text: text("secondary_button_text"),
  secondary_button_action: text("secondary_button_action"),
  secondary_button_action_type: text("secondary_button_action_type", { enum: ["url", "internal_route", "external"] }).default("url"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertHeroSectionSchema = createInsertSchema(hero_sections).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type HeroSection = typeof hero_sections.$inferSelect;
export type InsertHeroSection = z.infer<typeof insertHeroSectionSchema>;

// MP Course Preferences (corto external_reference, datos guardados en BD)
export const mp_course_preferences = pgTable("mp_course_preferences", {
  id: varchar("id", { length: 64 }).primaryKey(), // mp_pref_xxxxx
  preference_id: text("preference_id"), // Mercado Pago preference ID
  user_id: uuid("user_id").notNull(),
  course_id: uuid("course_id").notNull(),
  coupon_id: uuid("coupon_id"),
  coupon_code: text("coupon_code"),
  student_price_usd: numeric("student_price_usd", { precision: 10, scale: 2 }),
  original_price_usd: numeric("original_price_usd", { precision: 10, scale: 2 }),
  currency: text("currency").notNull(),
  access_months: integer("access_months").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMpCoursePreferenceSchema = createInsertSchema(mp_course_preferences).omit({
  id: true,
  created_at: true,
});

export type MpCoursePreference = typeof mp_course_preferences.$inferSelect;
export type InsertMpCoursePreference = z.infer<typeof insertMpCoursePreferenceSchema>;

// MP Subscription Preferences (short external_reference, data stored in DB)
// Used for: subscriptions, subscription upgrades, and seat payments
export const mp_subscription_preferences = pgTable("mp_subscription_preferences", {
  id: varchar("id", { length: 64 }).primaryKey(), // mps_xxxxx, mpu_xxxxx, or mpseat_xxxxx (short ID)
  preference_id: text("preference_id"), // Mercado Pago preference ID
  preapproval_id: text("preapproval_id"), // Mercado Pago preapproval ID (for recurring)
  user_id: uuid("user_id").notNull(), // users.id (internal table ID)
  organization_id: uuid("organization_id").notNull(),
  plan_id: uuid("plan_id"), // null for seat payments
  plan_slug: text("plan_slug"), // null for seat payments
  billing_period: text("billing_period", { enum: ["monthly", "annual"] }).notNull(),
  amount_ars: numeric("amount_ars", { precision: 10, scale: 2 }),
  is_upgrade: boolean("is_upgrade").default(false),
  previous_subscription_id: uuid("previous_subscription_id"),
  proration_credit: numeric("proration_credit", { precision: 10, scale: 2 }),
  product_type: text("product_type"), // 'subscription' | 'subscription_upgrade' | 'seat'
  invitee_email: text("invitee_email"), // for seat payments
  role_id: uuid("role_id"), // for seat payments
  subscription_id: uuid("subscription_id"), // for seat payments (existing subscription to update)
  payer_email: text("payer_email"), // Email used for MP payments (persisted for seat billing)
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMpSubscriptionPreferenceSchema = createInsertSchema(mp_subscription_preferences).omit({
  id: true,
  created_at: true,
});

export type MpSubscriptionPreference = typeof mp_subscription_preferences.$inferSelect;
export type InsertMpSubscriptionPreference = z.infer<typeof insertMpSubscriptionPreferenceSchema>;

// PayPal Upgrade Preferences (for prorated upgrade payments)
export const paypal_upgrade_preferences = pgTable("paypal_upgrade_preferences", {
  id: varchar("id", { length: 64 }).primaryKey(), // ppu_xxxxx (short ID)
  order_id: text("order_id"), // PayPal order ID
  user_id: uuid("user_id").notNull(), // auth_id from supabase.auth.getUser()
  organization_id: uuid("organization_id").notNull(),
  plan_id: uuid("plan_id"),
  plan_slug: text("plan_slug"),
  billing_period: text("billing_period", { enum: ["monthly", "annual"] }).notNull(),
  amount_usd: numeric("amount_usd", { precision: 10, scale: 2 }),
  previous_subscription_id: uuid("previous_subscription_id"),
  proration_credit: numeric("proration_credit", { precision: 10, scale: 2 }),
  full_price_usd: numeric("full_price_usd", { precision: 10, scale: 2 }),
  target_paypal_plan_id: text("target_paypal_plan_id"), // PayPal billing plan ID for new subscription
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPaypalUpgradePreferenceSchema = createInsertSchema(paypal_upgrade_preferences).omit({
  id: true,
  created_at: true,
});

export type PaypalUpgradePreference = typeof paypal_upgrade_preferences.$inferSelect;
export type InsertPaypalUpgradePreference = z.infer<typeof insertPaypalUpgradePreferenceSchema>;

// PayPal Seat Preferences (for prorated seat payments when adding organization members)
export const paypal_seat_preferences = pgTable("paypal_seat_preferences", {
  id: varchar("id", { length: 64 }).primaryKey(), // pps_xxxxx (short ID)
  order_id: text("order_id"), // PayPal order ID (filled after order created)
  user_id: uuid("user_id").notNull(), // users.id (internal table ID)
  organization_id: uuid("organization_id").notNull(),
  invitee_email: text("invitee_email").notNull(),
  role_id: uuid("role_id").notNull(),
  subscription_id: uuid("subscription_id"), // existing subscription to update
  prorated_amount_usd: numeric("prorated_amount_usd", { precision: 10, scale: 2 }).notNull(),
  billing_period: text("billing_period", { enum: ["monthly", "annual"] }).notNull(),
  status: text("status", { enum: ["pending", "completed"] }).default("pending"),
  created_at: timestamp("created_at").defaultNow(),
  captured_at: timestamp("captured_at"),
});

export const insertPaypalSeatPreferenceSchema = createInsertSchema(paypal_seat_preferences).omit({
  id: true,
  created_at: true,
  captured_at: true,
});

export type PaypalSeatPreference = typeof paypal_seat_preferences.$inferSelect;
export type InsertPaypalSeatPreference = z.infer<typeof insertPaypalSeatPreferenceSchema>;

// PDF Templates Table - Organization-level PDF customization
export const pdf_templates = pgTable("pdf_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id"),
  name: text("name").notNull().default("Plantilla por defecto"),
  
  // Logo configuration
  logo_width: integer("logo_width").default(80),
  logo_height: integer("logo_height").default(60),
  
  // Company info display
  company_name_show: boolean("company_name_show").default(true),
  company_name_size: integer("company_name_size").default(24),
  company_name_color: text("company_name_color").default("#1f2937"),
  company_address: text("company_address"),
  company_email: text("company_email"),
  company_phone: text("company_phone"),
  company_info_size: integer("company_info_size").default(10),
  
  // Color scheme
  primary_color: text("primary_color").default("#4f9eff"),
  secondary_color: text("secondary_color").default("#e5e7eb"),
  text_color: text("text_color").default("#1f2937"),
  background_color: text("background_color").default("#ffffff"),
  
  // Typography
  font_family: text("font_family").default("Arial"),
  title_size: integer("title_size").default(18),
  subtitle_size: integer("subtitle_size").default(14),
  body_size: integer("body_size").default(12),
  
  // Page layout
  page_size: varchar("page_size", { length: 10 }).default("A4"),
  page_orientation: varchar("page_orientation", { length: 10 }).default("portrait"),
  custom_width: numeric("custom_width"),
  custom_height: numeric("custom_height"),
  margin_top: integer("margin_top").default(20),
  margin_bottom: integer("margin_bottom").default(20),
  margin_left: integer("margin_left").default(20),
  margin_right: integer("margin_right").default(20),
  
  // Section toggles
  show_client_section: boolean("show_client_section").default(true),
  show_project_section: boolean("show_project_section").default(true),
  show_details_section: boolean("show_details_section").default(true),
  show_signature_section: boolean("show_signature_section").default(true),
  
  // Footer configuration
  footer_text: text("footer_text"),
  footer_info: text("footer_info").default("Documento generado por Seencel. www.seencel.com"),
  show_footer_info: boolean("show_footer_info").default(true),
  footer_show_page_numbers: boolean("footer_show_page_numbers").default(true),
  footer_show_date: boolean("footer_show_date").default(true),
  
  // Signature configuration
  signature_text: text("signature_text"),
  show_signature_fields: boolean("show_signature_fields").default(true),
  signature_layout: varchar("signature_layout", { length: 20 }).default("vertical"),
  show_clarification_field: boolean("show_clarification_field").default(true),
  show_date_field: boolean("show_date_field").default(true),
  
  // Document metadata
  document_number: text("document_number"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertPdfTemplateSchema = createInsertSchema(pdf_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type PdfTemplate = typeof pdf_templates.$inferSelect;
export type InsertPdfTemplate = z.infer<typeof insertPdfTemplateSchema>;

// ======================= FOUNDERS PORTAL =======================

// Founder Portal Events Table
export const founder_portal_events = pgTable("founder_portal_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  event_type: text("event_type", { enum: ["webinar", "meeting", "workshop", "announcement"] }).default("webinar"),
  event_date: timestamp("event_date", { withTimezone: true }).notNull(),
  event_end_date: timestamp("event_end_date", { withTimezone: true }),
  location: text("location"),
  is_virtual: boolean("is_virtual").default(true),
  max_attendees: integer("max_attendees"),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  is_deleted: boolean("is_deleted").default(false),
});

export const insertFounderPortalEventSchema = createInsertSchema(founder_portal_events).omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_deleted: true,
});

export type FounderPortalEvent = typeof founder_portal_events.$inferSelect;
export type InsertFounderPortalEvent = z.infer<typeof insertFounderPortalEventSchema>;

// Founder Event Registrations Table
export const founder_event_registrations = pgTable("founder_event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_id: uuid("event_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  user_id: uuid("user_id").notNull(),
  registered_at: timestamp("registered_at").defaultNow(),
  attended: boolean("attended").default(false),
});

export const insertFounderEventRegistrationSchema = createInsertSchema(founder_event_registrations).omit({
  id: true,
  registered_at: true,
});

export type FounderEventRegistration = typeof founder_event_registrations.$inferSelect;
export type InsertFounderEventRegistration = z.infer<typeof insertFounderEventRegistrationSchema>;

// Founder Vote Topics Table
export const founder_vote_topics = pgTable("founder_vote_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "active", "closed"] }).default("active"),
  voting_deadline: timestamp("voting_deadline", { withTimezone: true }),
  allow_multiple_votes: boolean("allow_multiple_votes").default(false),
  created_by: uuid("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  closed_at: timestamp("closed_at", { withTimezone: true }),
  is_deleted: boolean("is_deleted").default(false),
});

export const insertFounderVoteTopicSchema = createInsertSchema(founder_vote_topics).omit({
  id: true,
  created_at: true,
  is_deleted: true,
});

export type FounderVoteTopic = typeof founder_vote_topics.$inferSelect;
export type InsertFounderVoteTopic = z.infer<typeof insertFounderVoteTopicSchema>;

// Founder Vote Options Table
export const founder_vote_options = pgTable("founder_vote_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic_id: uuid("topic_id").notNull(),
  option_text: text("option_text").notNull(),
  option_order: integer("option_order").default(0),
});

export const insertFounderVoteOptionSchema = createInsertSchema(founder_vote_options).omit({
  id: true,
});

export type FounderVoteOption = typeof founder_vote_options.$inferSelect;
export type InsertFounderVoteOption = z.infer<typeof insertFounderVoteOptionSchema>;

// Founder Vote Ballots Table
export const founder_vote_ballots = pgTable("founder_vote_ballots", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic_id: uuid("topic_id").notNull(),
  option_id: uuid("option_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  user_id: uuid("user_id").notNull(),
  voted_at: timestamp("voted_at").defaultNow(),
});

export const insertFounderVoteBallotSchema = createInsertSchema(founder_vote_ballots).omit({
  id: true,
  voted_at: true,
});

export type FounderVoteBallot = typeof founder_vote_ballots.$inferSelect;
export type InsertFounderVoteBallot = z.infer<typeof insertFounderVoteBallotSchema>;

// ============================================================
// FORUM SYSTEM TABLES (Global Reusable Forum Module)
// ============================================================

// Forum Categories Table
export const forum_categories = pgTable("forum_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color").default("#000000"),
  sort_order: integer("sort_order").default(0),
  allowed_roles: text("allowed_roles").array().default(["public"]),
  is_read_only: boolean("is_read_only").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertForumCategorySchema = createInsertSchema(forum_categories).omit({
  id: true,
  created_at: true,
});

export type ForumCategory = typeof forum_categories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;

// Forum Threads Table
export const forum_threads = pgTable("forum_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  category_id: uuid("category_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  author_id: uuid("author_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: jsonb("content").notNull(),
  view_count: integer("view_count").default(0),
  reply_count: integer("reply_count").default(0),
  last_activity_at: timestamp("last_activity_at").defaultNow(),
  is_pinned: boolean("is_pinned").default(false),
  is_locked: boolean("is_locked").default(false),
  is_deleted: boolean("is_deleted").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertForumThreadSchema = createInsertSchema(forum_threads).omit({
  id: true,
  view_count: true,
  reply_count: true,
  last_activity_at: true,
  is_deleted: true,
  created_at: true,
  updated_at: true,
});

export type ForumThread = typeof forum_threads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;

// Forum Posts Table (Replies with nested support)
export const forum_posts = pgTable("forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  thread_id: uuid("thread_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
  author_id: uuid("author_id").notNull(),
  parent_id: uuid("parent_id"),
  content: jsonb("content").notNull(),
  is_accepted_answer: boolean("is_accepted_answer").default(false),
  is_deleted: boolean("is_deleted").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertForumPostSchema = createInsertSchema(forum_posts).omit({
  id: true,
  is_accepted_answer: true,
  is_deleted: true,
  created_at: true,
  updated_at: true,
});

export type ForumPost = typeof forum_posts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

// Forum Reactions Table (Like/Upvote system)
export const forum_reactions = pgTable("forum_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  item_type: text("item_type", { enum: ["thread", "post"] }).notNull(),
  item_id: uuid("item_id").notNull(),
  reaction_type: text("reaction_type").default("like"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertForumReactionSchema = createInsertSchema(forum_reactions).omit({
  id: true,
  created_at: true,
});

export type ForumReaction = typeof forum_reactions.$inferSelect;
export type InsertForumReaction = z.infer<typeof insertForumReactionSchema>;

// ============================================================
// FEATURE FLAGS TABLE (Admin Ops Center)
// ============================================================

export const feature_flags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: boolean("value").notNull().default(true),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(feature_flags).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type FeatureFlag = typeof feature_flags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
