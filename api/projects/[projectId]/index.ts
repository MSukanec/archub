// api/projects/[projectId]/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { updateProject, deleteProject } from "../../lib/handlers/projects/projects.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const ctx = { supabase };

    if (req.method === "PATCH") {
      const params = {
        projectId,
        ...req.body
      };
      const result = await updateProject(ctx, params);

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }

    } else if (req.method === "DELETE") {
      const { organizationId } = req.query;

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const params = {
        projectId,
        organizationId
      };
      const result = await deleteProject(ctx, params);

      if (result.success) {
        return res.status(200).json({ success: true, message: result.message });
      } else {
        return res.status(500).json({ error: result.error });
      }

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error in /api/projects/[projectId]:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
