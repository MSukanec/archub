// server/vercelAdapter.ts
// Adapter to run Vercel Edge Functions as Express middleware in development

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

export function vercelToExpress(handler: (req: Request) => Promise<Response>) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      // Convert Express request to Web API Request
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost';
      const url = `${protocol}://${host}${req.originalUrl || req.url}`;
      
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      });

      let body: string | null = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        body = JSON.stringify(req.body);
      }

      const webRequest = new Request(url, {
        method: req.method,
        headers,
        body: body ? body : undefined,
      });

      // Call the Vercel handler
      const webResponse = await handler(webRequest);

      // Convert Web API Response back to Express response
      res.status(webResponse.status);
      
      // Copy headers
      webResponse.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Send body
      const responseBody = await webResponse.text();
      
      // If it's JSON, try to parse and send as JSON
      if (webResponse.headers.get('content-type')?.includes('application/json')) {
        try {
          const jsonData = JSON.parse(responseBody);
          res.json(jsonData);
        } catch {
          res.send(responseBody);
        }
      } else {
        res.send(responseBody);
      }
    } catch (error: any) {
      console.error('Vercel adapter error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };
}
