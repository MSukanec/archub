import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

// Simple .env file loader
async function loadEnv() {
  const envFiles = ['.env', '.env.local'];
  for (const file of envFiles) {
    if (existsSync(file)) {
      try {
        const content = await readFile(file, 'utf-8');
        content.split('\n').forEach(line => {
          const match = line.match(/^([^=#]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = value;
          }
        });
      } catch (e) {
        console.warn(`Warning: Could not load ${file}`);
      }
    }
  }
}

// Load environment variables before starting
await loadEnv();

const PORT = 3000;
const API_DIR = './api';

interface RoutePattern {
  pattern: RegExp;
  keys: string[];
  filePath: string;
  urlPath: string;
}

interface VercelRequest {
  method: string;
  url: string;
  headers: IncomingMessage['headers'];
  query: Record<string, string | string[]>;
  body?: any;
  cookies?: Record<string, string>;
}

interface VercelResponse {
  statusCode: number;
  headers: Record<string, string>;
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  json(data: any): void;
  send(data: any): void;
  redirect(url: string, statusCode?: number): void;
  end(data?: any): void;
}

// Simple path to regex converter - supports [id], [...slug], [[...slug]]
function pathToRegex(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = [];
  let pattern = path;
  
  // Handle catch-all routes: [...slug] and [[...slug]]
  pattern = pattern.replace(/\[\[\.\.\.([^\]]+)\]\]/g, (_, key) => {
    keys.push(key);
    return '(.*)?'; // Optional catch-all
  });
  
  pattern = pattern.replace(/\[\.\.\.([^\]]+)\]/g, (_, key) => {
    keys.push(key);
    return '(.+)'; // Required catch-all
  });
  
  // Handle regular dynamic segments: [id]
  pattern = pattern.replace(/\[([^\]]+)\]/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  
  // Escape slashes
  pattern = pattern.replace(/\//g, '\\/');
  
  return {
    pattern: new RegExp(`^${pattern}$`),
    keys,
  };
}

// Build route manifest from /api directory
async function buildRouteManifest(): Promise<RoutePattern[]> {
  const routes: RoutePattern[] = [];
  
  async function scanDirectory(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'lib') {
        await scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const relativePath = relative(API_DIR, fullPath);
        const routePath = relativePath
          .replace(/\.ts$/, '')
          .replace(/\/index$/, '');
        
        const apiPath = `/api/${routePath}`;
        const { pattern, keys } = pathToRegex(apiPath);
        
        routes.push({
          pattern,
          keys,
          filePath: fullPath,
          urlPath: apiPath,
        });
      }
    }
  }
  
  await scanDirectory(API_DIR);
  
  // Sort routes: specific routes before dynamic ones
  routes.sort((a, b) => {
    const aDynamic = a.keys.length;
    const bDynamic = b.keys.length;
    if (aDynamic !== bDynamic) return aDynamic - bDynamic;
    return b.urlPath.length - a.urlPath.length;
  });
  
  return routes;
}

// Parse request body
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) {
        resolve(undefined);
        return;
      }
      
      try {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          resolve(JSON.parse(body));
        } else {
          resolve(body);
        }
      } catch (e) {
        resolve(body);
      }
    });
  });
}

// Create Vercel-compatible response shim
function createVercelResponse(res: ServerResponse): VercelResponse {
  const vercelRes: any = {
    statusCode: 200,
    headers: {},
    
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    
    json(data: any) {
      this.headers['Content-Type'] = 'application/json';
      res.statusCode = this.statusCode;
      Object.entries(this.headers).forEach(([k, v]) => res.setHeader(k, v as string));
      res.end(JSON.stringify(data));
    },
    
    send(data: any) {
      res.statusCode = this.statusCode;
      Object.entries(this.headers).forEach(([k, v]) => res.setHeader(k, v as string));
      res.end(data);
    },
    
    redirect(url: string, statusCode = 302) {
      res.statusCode = statusCode;
      res.setHeader('Location', url);
      res.end();
    },
    
    end(data?: any) {
      res.statusCode = this.statusCode;
      Object.entries(this.headers).forEach(([k, v]) => res.setHeader(k, v as string));
      res.end(data);
    },
  };
  
  return vercelRes;
}

// Main server
async function startServer() {
  console.log('🔍 Scanning /api directory...');
  let routeManifest = await buildRouteManifest();
  console.log(`✅ Found ${routeManifest.length} API endpoints`);
  
  const server = createServer(async (req, res) => {
    const parsedUrl = parseUrl(req.url || '', true);
    const pathname = parsedUrl.pathname || '/';
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }
    
    // Find matching route
    let matchedRoute: RoutePattern | null = null;
    let params: Record<string, string> = {};
    
    for (const route of routeManifest) {
      const match = route.pattern.exec(pathname);
      if (match) {
        matchedRoute = route;
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        break;
      }
    }
    
    if (!matchedRoute) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'API endpoint not found', path: pathname }));
      return;
    }
    
    try {
      // Dynamic import with cache busting
      const timestamp = Date.now();
      const module = await import(`${matchedRoute.filePath}?v=${timestamp}`);
      const handler = module.default || module;
      
      if (typeof handler !== 'function') {
        throw new Error('Handler is not a function');
      }
      
      // Parse body
      const body = await parseBody(req);
      
      // Create Vercel-compatible request
      const vercelReq: VercelRequest = {
        method: req.method || 'GET',
        url: req.url || '',
        headers: req.headers,
        query: { ...parsedUrl.query, ...params } as Record<string, string>,
        body,
      };
      
      // Create Vercel-compatible response
      const vercelRes = createVercelResponse(res);
      
      // Execute handler
      await handler(vercelReq, vercelRes);
      
    } catch (error: any) {
      console.error(`❌ Error in ${pathname}:`, error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }));
    }
  });
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 Dev API Server running!');
    console.log(`📡 API: http://localhost:${PORT}/api/*`);
    console.log(`🔥 Hot reload: enabled\n`);
  });
  
  // Rebuild manifest on file changes (optional)
  setInterval(async () => {
    routeManifest = await buildRouteManifest();
  }, 5000);
}

startServer().catch(console.error);
