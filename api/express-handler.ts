import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

let app: express.Express | null = null;

async function getApp() {
  if (!app) {
    app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false, limit: '50mb' }));
    
    await registerRoutes(app);
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        console.error('Express handler error:', err);
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
