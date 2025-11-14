// api/projects/[projectId]/clients/summary.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getClientsSummary } from "../../../lib/handlers/projects/projectClients.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { projectId } = req.query;
    const { organization_id } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "Project ID is required" });
    }

    if (!organization_id || typeof organization_id !== 'string') {
      return res.status(400).json({ error: "organization_id is required" });
    }

    const ctx = { supabase };
    const params = {
      projectId,
      organizationId: organization_id
    };

    const result = await getClientsSummary(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }

  } catch (err: any) {
    console.error("Error in /api/projects/[projectId]/clients/summary:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
