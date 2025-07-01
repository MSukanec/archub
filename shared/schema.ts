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

// Design tables - New 5-table architecture
export const design_phases = pgTable("design_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id"),
  name: text("name").notNull(),
  description: text("description"),
  is_system: boolean("is_system").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const design_project_phases = pgTable("design_project_phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  design_phase_id: uuid("design_phase_id").notNull(),
  name: text("name").notNull(),
  start_date: text("start_date"),
  end_date: text("end_date"),
  position: integer("position"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const design_tasks = pgTable("design_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id"),
  name: text("name").notNull(),
  description: text("description"),
  is_system: boolean("is_system").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const design_phase_tasks = pgTable("design_phase_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_phase_id: uuid("project_phase_id").notNull(),
  design_task_id: uuid("design_task_id").notNull(),
  name: text("name"),
  start_date: text("start_date"),
  end_date: text("end_date"),
  status: text("status").notNull().default("todo"), // todo, in_progress, completed
  assigned_to: uuid("assigned_to"),
  priority: text("priority").default("medium"), // low, medium, high
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const design_gantt_links = pgTable("design_gantt_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  source_task_id: uuid("source_task_id").notNull(),
  target_task_id: uuid("target_task_id").notNull(),
  link_type: text("link_type").default("finish_to_start"), // finish_to_start, start_to_start, etc
  lag_days: integer("lag_days").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
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
  organization_id: true,
  name: true,
  description: true,
});

export const insertDesignProjectPhaseSchema = createInsertSchema(design_project_phases).pick({
  project_id: true,
  design_phase_id: true,
  name: true,
  start_date: true,
  end_date: true,
  position: true,
});

export const insertDesignTaskSchema = createInsertSchema(design_tasks).pick({
  organization_id: true,
  name: true,
  description: true,
});

export const insertDesignPhaseTaskSchema = createInsertSchema(design_phase_tasks).pick({
  project_phase_id: true,
  design_task_id: true,
  name: true,
  start_date: true,
  end_date: true,
  status: true,
  assigned_to: true,
  priority: true,
});

export const insertDesignGanttLinkSchema = createInsertSchema(design_gantt_links).pick({
  source_task_id: true,
  target_task_id: true,
  link_type: true,
  lag_days: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type UserData = typeof user_data.$inferSelect;
export type UserPreferences = typeof user_preferences.$inferSelect;
export type InsertUserData = z.infer<typeof insertUserDataSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Design types
export type DesignPhase = typeof design_phases.$inferSelect;
export type DesignProjectPhase = typeof design_project_phases.$inferSelect;
export type DesignTask = typeof design_tasks.$inferSelect;
export type DesignPhaseTask = typeof design_phase_tasks.$inferSelect;
export type DesignGanttLink = typeof design_gantt_links.$inferSelect;

export type InsertDesignPhase = z.infer<typeof insertDesignPhaseSchema>;
export type InsertDesignProjectPhase = z.infer<typeof insertDesignProjectPhaseSchema>;
export type InsertDesignTask = z.infer<typeof insertDesignTaskSchema>;
export type InsertDesignPhaseTask = z.infer<typeof insertDesignPhaseTaskSchema>;
export type InsertDesignGanttLink = z.infer<typeof insertDesignGanttLinkSchema>;
