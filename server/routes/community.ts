import type { Express } from "express";
import type { RouteDeps } from "./_base";
import {
  handleGetActiveUsers,
  handleGetOrganizations,
  handleGetProjects,
  handleGetStats
} from '../controllers/community/community.controller.js';

/**
 * Register community-related endpoints (active users, organizations, projects, stats)
 */
export function registerCommunityRoutes(app: Express, deps: RouteDeps): void {
  // ========== COMMUNITY ENDPOINTS ==========
  
  // GET /api/community/active-users - Get active users in the community
  app.get("/api/community/active-users", handleGetActiveUsers);
  
  // GET /api/community/organizations - Get all organizations for the community map
  app.get("/api/community/organizations", handleGetOrganizations);
  
  // GET /api/community/projects - Get all projects for the community map
  app.get("/api/community/projects", handleGetProjects);
  
  // GET /api/community/stats - Get community statistics
  app.get("/api/community/stats", handleGetStats);
}
