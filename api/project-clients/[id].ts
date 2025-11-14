import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getClient, updateClient, deleteClient } from "../lib/handlers/projects/projectClients.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "PATCH" && req.method !== "DELETE") {
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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Client ID is required" });
    }

    // Handle GET request
    if (req.method === "GET") {
      const { projectId, organizationId } = req.query;

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: "organizationId is required" });
      }

      const result = await getClient(ctx, { projectId, clientId: id, organizationId });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    // Handle PATCH request
    if (req.method === "PATCH") {
      const { projectId, organizationId, ...clientData } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!organizationId) {
        return res.status(400).json({ error: "organizationId is required" });
      }

      const result = await updateClient(ctx, { projectId, clientId: id, organizationId, clientData });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    // Handle DELETE request
    if (req.method === "DELETE") {
      const { projectId, organizationId } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!organizationId) {
        return res.status(400).json({ error: "organizationId is required" });
      }

      const result = await deleteClient(ctx, { projectId, clientId: id, organizationId });

      if (result.success) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

  } catch (err: any) {
    console.error("Error in /api/project-clients/[id]:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
