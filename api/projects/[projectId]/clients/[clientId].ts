import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getClient, updateClient, deleteClient } from "../../../lib/handlers/projects/projectClients.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const projectId = req.query.projectId as string;
    const clientId = req.query.clientId as string;
    const organizationId = req.query.organization_id as string;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "projectId is required" });
    }

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: "clientId is required" });
    }

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "organization_id query param is required" });
    }

    if (req.method === "GET") {
      const result = await getClient(ctx, { projectId, clientId, organizationId });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    if (req.method === "PATCH") {
      const result = await updateClient(ctx, {
        projectId,
        clientId,
        organizationId,
        clientData: req.body
      });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    if (req.method === "DELETE") {
      const result = await deleteClient(ctx, { projectId, clientId, organizationId });

      if (result.success) {
        return res.status(200).json({ message: result.message });
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err: any) {
    console.error("Error in /api/projects/[projectId]/clients/[clientId]:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
