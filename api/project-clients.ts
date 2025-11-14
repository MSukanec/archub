import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { listClients, createClient as createProjectClient } from "./lib/handlers/projects/projectClients.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

    const ctx = { supabase };

    // Handle GET request
    if (req.method === "GET") {
      const { projectId, organizationId } = req.query;

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: "organizationId is required" });
      }

      const result = await listClients(ctx, { projectId, organizationId });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    // Handle POST request
    if (req.method === "POST") {
      const { projectId, organizationId, ...clientData } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!organizationId) {
        return res.status(400).json({ error: "organizationId is required" });
      }

      const result = await createProjectClient(ctx, { projectId, organizationId, clientData });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

  } catch (err: any) {
    console.error("Error in /api/project-clients:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
