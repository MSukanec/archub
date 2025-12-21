import type { Express } from 'express';
import type { RouteDeps } from './_base';
import { getExtensionContext, extensionContextPreflight } from '../controllers/extension/extension.controller';

export function registerExtensionRoutes(app: Express, deps: RouteDeps) {
  // Extension context - returns user, organization, projects with default boards
  app.options('/api/extension/context', extensionContextPreflight);
  app.get('/api/extension/context', getExtensionContext);
}
