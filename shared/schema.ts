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
  country: uuid("country"),
  birthdate: text("birthdate"),
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
  onboarding_completed: boolean("onboarding_completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Design tables
export const design_phases = pgTable("design_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const design_tasks = pgTable("design_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  design_phase_id: uuid("design_phase_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  start_date: text("start_date"),
  end_date: text("end_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  assigned_to: uuid("assigned_to"),
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

export const insertDesignPhaseSchema = createInsertSchema(design_phases).pick({
  project_id: true,
  name: true,
  description: true,
});

export const insertDesignTaskSchema = createInsertSchema(design_tasks).pick({
  design_phase_id: true,
  name: true,
  description: true,
  start_date: true,
  end_date: true,
  status: true,
  assigned_to: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type UserData = typeof user_data.$inferSelect;
export type UserPreferences = typeof user_preferences.$inferSelect;
export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type DesignPhase = typeof design_phases.$inferSelect;
export type DesignTask = typeof design_tasks.$inferSelect;
export type InsertDesignPhase = z.infer<typeof insertDesignPhaseSchema>;
export type InsertDesignTask = z.infer<typeof insertDesignTaskSchema>;
