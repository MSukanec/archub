// api/diag/check-env.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing',
        DATABASE_URL: process.env.DATABASE_URL ? '✅ Present' : '❌ Missing',
        NODE_ENV: process.env.NODE_ENV || 'not set',
      },
      imports: {
        authHelpers: 'checking...',
        handlers: 'checking...',
      },
      errors: [] as string[],
    };

    // Test importing auth helpers
    try {
      const { extractToken, requireUser } = await import('../lib/auth-helpers');
      diagnostics.imports.authHelpers = '✅ Import successful';
    } catch (err: any) {
      diagnostics.imports.authHelpers = `❌ ${err.message}`;
      diagnostics.errors.push(`auth-helpers import: ${err.message}`);
    }

    // Test importing handlers
    try {
      const { getOrganizationMembers } = await import('../lib/handlers/organization/getOrganizationMembers');
      diagnostics.imports.handlers = '✅ Import successful';
    } catch (err: any) {
      diagnostics.imports.handlers = `❌ ${err.message}`;
      diagnostics.errors.push(`handlers import: ${err.message}`);
    }

    return res.status(200).json(diagnostics);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Diagnostic failed',
      message: err.message,
      stack: err.stack,
    });
  }
}
