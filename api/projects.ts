// api/projects.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Esta función corre en Vercel como Serverless Function (Node.js)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    // Esperamos Authorization: Bearer <access_token_del_usuario>
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Cliente admin pero aplicando el token del usuario para que las RLS se respeten
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Manejo de diferentes métodos HTTP
    if (req.method === "POST") {
      // POST /api/projects - Crear nuevo proyecto
      const projectData = req.body;

      if (!projectData.organization_id || !projectData.name) {
        return res.status(400).json({ 
          error: "organization_id and name are required" 
        });
      }

      // Create new project using upsert
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .upsert({
          organization_id: projectData.organization_id,
          name: projectData.name,
          status: projectData.status || 'active',
          created_by: projectData.created_by,
          created_at: new Date().toISOString(),
          is_active: true,
          color: projectData.color || "#84cc16",
          use_custom_color: projectData.use_custom_color || false,
          custom_color_h: projectData.custom_color_h || null,
          custom_color_hex: projectData.custom_color_hex || null,
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (projectError) {
        console.error("Error creating project:", projectError);
        return res.status(500).json({ 
          error: "Failed to create project",
          details: projectError.message 
        });
      }

      // ALWAYS create project_data with organization_id (required for RLS)
      const { error: dataError } = await supabase
        .from('project_data')
        .insert({
          project_id: newProject.id,
          organization_id: projectData.organization_id,
          project_type_id: projectData.project_type_id || null,
          modality_id: projectData.modality_id || null,
        });

      if (dataError) {
        console.error("Error creating project_data:", dataError);
        // Rollback: delete the project we just created
        await supabase.from('projects').delete().eq('id', newProject.id);
        return res.status(500).json({ 
          error: "Failed to create project data",
          details: dataError.message 
        });
      }

      return res.status(200).json(newProject);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error in /api/projects:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
