import type { Express } from 'express';
import type { RouteDeps } from './_base';
import multer from 'multer';
import { savePin, savePinPreflight, getPins, getBoards, createBoard, createPinWithFile } from '../controllers/pins/pins.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function registerPinsRoutes(app: Express, deps: RouteDeps) {
  // Pins
  app.get('/api/pins', getPins);
  app.options('/api/pins/save', savePinPreflight);
  app.post('/api/pins/save', savePin);
  app.post('/api/pins/create', upload.single('file'), createPinWithFile);
  
  // Boards
  app.get('/api/pin-boards', getBoards);
  app.post('/api/pin-boards', createBoard);
}
