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
  name: text("name").notNull(),
  description: text("description"),
  file_path: text("file_path").notNull(),
  file_url: text("file_url").notNull(),
  file_name: text("file_name").notNull(),
  file_size: integer("file_size").notNull(),
  file_type: text("file_type").notNull(),
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
  name: true,
  description: true,
  file_path: true,
  file_url: true,
  file_name: true,
  file_size: true,
  file_type: true,
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
export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type DesignDocument = typeof design_documents.$inferSelect;
export type InsertDesignDocument = z.infer<typeof insertDesignDocumentSchema>;
