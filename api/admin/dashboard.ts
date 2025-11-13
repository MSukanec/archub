// api/admin/dashboard.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminUser, HttpError } from "../lib/auth-helpers.js";
import { getDashboardStats } from "../lib/handlers/admin/dashboard.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verify admin access
    await verifyAdminUser(req.headers.authorization ?? "");

    // Get service role client (bypasses RLS)
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const ctx = { supabase };

    if (req.method === "GET") {
      // GET /api/admin/dashboard - Get admin dashboard stats
      const result = await getDashboardStats(ctx);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json(result.data);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
