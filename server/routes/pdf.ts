import type { Express } from "express";
import type { RouteDeps } from "./_base";
import {
  handleGetPdfTemplate,
  handleCreatePdfTemplate,
  handleUpdatePdfTemplate,
} from '../controllers/organization/pdfTemplates.controller';

/**
 * Register PDF template endpoints for organization-level document customization
 */
export function registerPdfRoutes(app: Express, deps: RouteDeps): void {
  // GET /api/organizations/:organizationId/pdf-template - Get organization's PDF template
  app.get("/api/organizations/:organizationId/pdf-template", handleGetPdfTemplate);
  
  // POST /api/organizations/:organizationId/pdf-template - Create PDF template for organization
  app.post("/api/organizations/:organizationId/pdf-template", handleCreatePdfTemplate);
  
  // PATCH /api/organizations/:organizationId/pdf-template - Update organization's PDF template
  app.patch("/api/organizations/:organizationId/pdf-template", handleUpdatePdfTemplate);
}
