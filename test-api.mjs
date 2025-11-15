#!/usr/bin/env node
// Test runner para endpoints serverless sin Express

import { createServer } from 'http';
import { parse } from 'url';
import { readdir } from 'fs/promises';
import { pathToFileURL } from 'url';
import path from 'path';

const PORT = 5001;

// Simular request/response de Vercel
class VercelRequest {
  constructor(req, query, params) {
    this.method = req.method;
    this.headers = req.headers;
    this.query = query;
    this.url = req.url;
    this.body = null;
  }
}

class VercelResponse {
  constructor(res) {
    this._res = res;
    this._statusCode = 200;
    this._headers = {};
  }

  status(code) {
    this._statusCode = code;
    return this;
  }

  json(data) {
    this._res.writeHead(this._statusCode, {
      'Content-Type': 'application/json',
      ...this._headers
    });
    this._res.end(JSON.stringify(data));
  }

  setHeader(name, value) {
    this._headers[name] = value;
    return this;
  }
}

// Servidor que ejecuta funciones serverless
const server = createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  console.log(`[serverless] ${req.method} ${pathname}`);
  
  if (!pathname.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not an API route');
    return;
  }

  try {
    // Encontrar el archivo correcto
    const apiPath = pathname.replace('/api/', '');
    const segments = apiPath.split('/');
    
    // Intentar encontrar el archivo
    let handlerPath = null;
    let params = {};
    
    // Buscar archivo exacto
    const exactPath = `./api/${apiPath}.ts`;
    const indexPath = `./api/${apiPath}/index.ts`;
    
    // TODO: Implementar búsqueda de rutas dinámicas [id].ts
    
    if (!handlerPath) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
      return;
    }
    
    // Importar el handler
    const module = await import(pathToFileURL(handlerPath));
    const handler = module.default;
    
    if (!handler) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'No default export found' }));
      return;
    }
    
    // Crear request/response de Vercel
    const vercelReq = new VercelRequest(req, query, params);
    const vercelRes = new VercelResponse(res);
    
    // Parsear body si es POST/PATCH/PUT
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          vercelReq.body = JSON.parse(body);
        } catch {
          vercelReq.body = body;
        }
        await handler(vercelReq, vercelRes);
      });
    } else {
      await handler(vercelReq, vercelRes);
    }
    
  } catch (error) {
    console.error('[serverless] Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   SERVERLESS API TESTER                   ║
║   Running on http://localhost:${PORT}        ║
║   Test your /api endpoints here           ║
╚════════════════════════════════════════════╝
  `);
});