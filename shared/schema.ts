import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
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
  discovered_by: text("discovered_by", { enum: ["YouTube", "Instagram", "TikTok", "Google", "Recomendación", "LinkedIn", "Twitter/X", "Otro"] }),
  discovered_by_other_text: text("discovered_by_other_text"),
  main_use: text("main_use", { enum: ["Documentación técnica", "Presupuestos de obra", "Organización de proyectos", "Seguimiento de obra", "Colaboración con clientes", "Capacitación / aprendizaje", "Exploración / curiosidad", "Otro"] }),
  user_role: text("user_role", { enum: ["Arquitecto/a", "Ingeniero/a", "Maestro Mayor de Obras", "Estudiante", "Estudio de arquitectura", "Empresa constructora", "Proveedor de materiales", "Oficio profesional (instalador, herrero, carpintero, etc.)", "Otro"] }),
  user_role_other: text("user_role_other"),
  team_size: text("team_size", { enum: ["Trabajo solo/a", "2–5 personas", "6–15 personas", "Más de 15 personas"] }),
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
  name: text("name").notNull(), // e.g., "brick-type"
  label: text("label").notNull(), // e.g., "Tipo de Ladrillo / Bloque"
  type: text("type", { enum: ["text", "number", "select", "boolean"] }).notNull(),
  required: boolean("required").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const task_parameter_values = pgTable("task_parameter_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  parameter_id: uuid("parameter_id").notNull(),
  name: text("name").notNull(), // e.g., "acindar"
  label: text("label").notNull(), // e.g., "Acindar"
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
  parameter_value_id: uuid("parameter_value_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Task Templates System
export const task_templates = pgTable("task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code_prefix: text("code_prefix").notNull(),
  name_template: text("name_template").notNull(),
  category_id: uuid("category_id").notNull(),
  action_id: uuid("action_id"),
  created_at: timestamp("created_at").defaultNow(),
});

export const task_template_parameters = pgTable("task_template_parameters", {
  id: uuid("id").primaryKey().defaultRandom(),
  template_id: uuid("template_id").notNull(),
  parameter_id: uuid("parameter_id").notNull(),
  option_group_id: uuid("option_group_id"),
  is_required: boolean("is_required").default(false),
  position: integer("position").notNull(),
  role: text("role"),
  expression_template: text("expression_template"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertTaskParameterSchema = createInsertSchema(task_parameters).omit({
  id: true,
  created_at: true,
});

export const insertTaskParameterValueSchema = createInsertSchema(task_parameter_values).omit({
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

export const insertTaskTemplateSchema = createInsertSchema(task_templates).omit({
  id: true,
  created_at: true,
});

export const insertTaskTemplateParameterSchema = createInsertSchema(task_template_parameters).omit({
  id: true,
  created_at: true,
});

export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type DesignDocument = typeof design_documents.$inferSelect;
export type InsertDesignDocument = z.infer<typeof insertDesignDocumentSchema>;
export type TaskParameter = typeof task_parameters.$inferSelect;
export type TaskParameterValue = typeof task_parameter_values.$inferSelect;
export type TaskParameterOptionGroup = typeof task_parameter_option_groups.$inferSelect;
export type TaskParameterOptionGroupItem = typeof task_parameter_option_group_items.$inferSelect;
export type InsertTaskParameter = z.infer<typeof insertTaskParameterSchema>;
export type InsertTaskParameterValue = z.infer<typeof insertTaskParameterValueSchema>;
export type InsertTaskParameterOptionGroup = z.infer<typeof insertTaskParameterOptionGroupSchema>;
export type InsertTaskParameterOptionGroupItem = z.infer<typeof insertTaskParameterOptionGroupItemSchema>;
export type TaskTemplate = typeof task_templates.$inferSelect;
export type TaskTemplateParameter = typeof task_template_parameters.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type InsertTaskTemplateParameter = z.infer<typeof insertTaskTemplateParameterSchema>;
