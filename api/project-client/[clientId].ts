import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../lib/auth-helpers.js";
import { updateClient, deleteClient } from "../lib/handlers/projects/projectClients.js";

/**
 * Handler for updating or deleting a project client
 * PATCH/DELETE /api/project-client/:clientId?project_id=xxx&organization_id=xxx
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { supabase } = userResult;
    const ctx = { supabase };

    // clientId comes from path, project_id and organization_id from query
    const clientId = req.query.clientId as string;
    const projectId = req.query.project_id as string;
    const organizationId = req.query.organization_id as string;

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: "clientId is required" });
    }

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "project_id query param is required" });
    }

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "organization_id query param is required" });
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

  } catch (err: any) {
    console.error("Error in /api/project-client/[clientId]:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}