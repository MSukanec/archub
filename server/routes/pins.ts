import type { Express } from 'express';
import type { RouteDeps } from './_base';
import { savePin } from '../controllers/pins/pins.controller';

export function registerPinsRoutes(app: Express, deps: RouteDeps) {
  app.post('/api/pins/save', savePin);
}
