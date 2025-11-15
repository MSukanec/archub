import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../../../lib/auth-helpers.js";
import { createClient as createProjectClient, listClients } from "../../../lib/handlers/projects/projectClients.js";

// Force Node.js runtime to avoid Edge Function issues
export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    
    const projectId = req.query.projectId as string;
    const organizationId = req.query.organization_id as string;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "projectId is required" });
    }

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "organization_id query param is required" });
    }

    if (req.method === "GET") {
      const result = await listClients(ctx, { projectId, organizationId });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    if (req.method === "POST") {
      const result = await createProjectClient(ctx, {
        projectId,
        organizationId,
        clientData: req.body
      });

      if (result.success) {
        return res.status(201).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err: any) {
    console.error("Error in /api/projects/[projectId]/clients:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
