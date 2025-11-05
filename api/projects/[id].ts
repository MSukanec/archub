// api/projects/[id].ts
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

    // Extraer ID del proyecto de la URL
    const { id: projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Manejo de diferentes métodos HTTP
    if (req.method === "PATCH") {
      // PATCH /api/projects/[id] - Actualizar proyecto
      const updateData = req.body;

      // Update main project
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          name: updateData.name,
          status: updateData.status,
          color: updateData.color || "#84cc16",
          use_custom_color: updateData.use_custom_color || false,
          custom_color_h: updateData.custom_color_h || null,
          custom_color_hex: updateData.custom_color_hex || null,
        })
        .eq('id', projectId);

      if (projectError) {
        console.error("Error updating project:", projectError);
        return res.status(500).json({ 
          error: "Failed to update project",
          details: projectError.message 
        });
      }

      // Update project_data if it exists, create if it doesn't
      const { data: existingProjectData } = await supabase
        .from('project_data')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (existingProjectData) {
        const { error: dataError } = await supabase
          .from('project_data')
          .update({
            project_type_id: updateData.project_type_id || null,
            modality_id: updateData.modality_id || null,
          })
          .eq('project_id', projectId);

        if (dataError) {
          console.error("Error updating project_data:", dataError);
          return res.status(500).json({ 
            error: "Failed to update project data",
            details: dataError.message 
          });
        }
      } else if (updateData.project_type_id || updateData.modality_id) {
        // Create project_data if doesn't exist and we have data to insert
        const { error: dataError } = await supabase
          .from('project_data')
          .upsert({
            project_id: projectId,
            organization_id: updateData.organization_id,
            project_type_id: updateData.project_type_id || null,
            modality_id: updateData.modality_id || null,
          }, {
            onConflict: 'project_id'
          });

        if (dataError) {
          console.error("Error creating project_data:", dataError);
          return res.status(500).json({ 
            error: "Failed to create project data",
            details: dataError.message 
          });
        }
      }

      // Get updated project
      const { data: updatedProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        console.error("Error fetching updated project:", fetchError);
        return res.status(500).json({ 
          error: "Project updated but failed to fetch result",
          details: fetchError.message 
        });
      }

      return res.status(200).json(updatedProject);

    } else if (req.method === "DELETE") {
      // DELETE /api/projects/[id] - Eliminar proyecto
      const { organizationId } = req.query;

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // First delete project_data (if exists)
      await supabase
        .from('project_data')
        .delete()
        .eq('project_id', projectId);

      // Delete the main project with organization verification
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', organizationId);

      if (projectError) {
        console.error("Error deleting project:", projectError);
        return res.status(500).json({ 
          error: "Failed to delete project",
          details: projectError.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Project deleted successfully" 
      });

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error in /api/projects/[id]:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
