import express, { type Request, Response, NextFunction } from "express";
// import { registerRoutes } from "./routes";  // DESHABILITADO - usando serverless
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// ====================================================================
// SERVIDOR CONFIGURADO PARA USAR ENDPOINTS SERVERLESS
// ====================================================================
// Este servidor SOLO maneja el frontend con Vite.
// Todos los endpoints /api/* se sirven desde archivos en /api/*.ts
// como funciones serverless, igual que en Vercel.
// ====================================================================

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Solo loggear rutas no-API y no-Vite
    if (!path.startsWith("/api") && !path.startsWith("/@") && !path.includes(".")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
});

(async () => {
  // NO registrar rutas Express para API
  // const server = await registerRoutes(app);  // DESHABILITADO
  
  // Crear servidor HTTP
  const server = createServer(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Solo configurar Vite para el frontend
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Servir en puerto 5000
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`===================================================`);
    log(`MODO: SERVERLESS API`);
    log(`FRONTEND: http://localhost:${port}`);
    log(`API: /api/*.ts (funciones serverless)`);
    log(`===================================================`);
  });
})();