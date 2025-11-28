import type { Express } from "express";
import type { RouteDeps } from './_base';
import * as heroSectionsController from '../controllers/layout/hero-sections.controller.js';

export function registerLayoutRoutes(app: Express, deps: RouteDeps): void {
  app.get("/api/layout/hero-sections", heroSectionsController.getHeroSections);
  app.post("/api/layout/hero-sections", heroSectionsController.createHeroSection);
  app.patch("/api/layout/hero-sections/:id", heroSectionsController.updateHeroSection);
  app.delete("/api/layout/hero-sections/:id", heroSectionsController.deleteHeroSection);
  app.post("/api/layout/hero-sections/reorder", heroSectionsController.reorderHeroSections);
}
