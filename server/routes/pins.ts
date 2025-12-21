import type { Express } from 'express';
import type { RouteDeps } from './_base';
import { savePin, savePinPreflight, getPins } from '../controllers/pins/pins.controller';

export function registerPinsRoutes(app: Express, deps: RouteDeps) {
  app.get('/api/pins', getPins);
  app.options('/api/pins/save', savePinPreflight);
  app.post('/api/pins/save', savePin);
}
