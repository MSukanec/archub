import type { Express } from 'express';
import type { RouteDeps } from './_base';
import { savePin, savePinPreflight } from '../controllers/pins/pins.controller';

export function registerPinsRoutes(app: Express, deps: RouteDeps) {
  app.options('/api/pins/save', savePinPreflight);
  app.post('/api/pins/save', savePin);
}
