import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { handleSuggestMapping, handleSaveMappings } from "../controllers/import/importAI.controller";

export function registerImportRoutes(app: Express, deps: RouteDeps) {
  app.post("/api/import/ai-suggest-mapping", handleSuggestMapping);
  app.post("/api/import/save-mappings", handleSaveMappings);
}
