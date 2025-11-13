// api/admin/enrollments/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminUser, HttpError } from "../../_lib/auth-helpers.js";
import { getEnrollment, updateEnrollment, deleteEnrollment } from "../../_lib/handlers/admin/enrollments.js";

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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Enrollment ID is required" });
    }

    if (req.method === "GET") {
      // GET /api/admin/enrollments/[id] - Get single enrollment
      const result = await getEnrollment(ctx, { id });
      return result.success 
        ? res.status(200).json(result.data)
        : res.status(500).json({ error: result.error });

    } else if (req.method === "PATCH") {
      // PATCH /api/admin/enrollments/[id] - Update enrollment
      const result = await updateEnrollment(ctx, { id }, req.body);
      return result.success 
        ? res.status(200).json(result.data)
        : res.status(500).json({ error: result.error });

    } else if (req.method === "DELETE") {
      // DELETE /api/admin/enrollments/[id] - Delete enrollment
      const result = await deleteEnrollment(ctx, { id });
      return result.success 
        ? res.status(200).json(result.data)
        : res.status(500).json({ error: result.error });

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
