// api/lessons/[id]/progress.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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

    const lessonId = req.query.id as string;

    if (req.method === "POST") {
      const { progress_pct, last_position_sec, completed_at, is_completed } = req.body;

      // Get current user from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // CRITICAL: Get user from users table by EMAIL (not by id!)
      // auth.users.id ≠ users.id, must use .ilike() for case-insensitive email matching
      const { data: existingUser, error: userLookupError } = await supabase
        .from('users')
        .select('id')
        .ilike('email', user.email!)
        .single();
      
      if (userLookupError || !existingUser) {
        console.error("User not found in users table:", user.email, userLookupError);
        return res.status(404).json({ error: "User not found in database" });
      }
      
      // Use the CORRECT user_id from users table
      const dbUserId = existingUser.id;
      
      // Upsert progress
      // Auto-complete when progress >= 95%
      const normalizedProgress = progress_pct || 0;
      const shouldAutoComplete = normalizedProgress >= 95;
      const finalIsCompleted = is_completed !== undefined ? is_completed : shouldAutoComplete;
      const finalCompletedAt = (finalIsCompleted || shouldAutoComplete) ? (completed_at || new Date().toISOString()) : null;
      
      const { data, error } = await supabase
        .from('course_lesson_progress')
        .upsert({
          user_id: dbUserId,
          lesson_id: lessonId,
          progress_pct: normalizedProgress,
          last_position_sec: last_position_sec || 0,
          completed_at: finalCompletedAt,
          is_completed: finalIsCompleted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error upserting lesson progress:", error);
        return res.status(500).json({ error: "Failed to update progress" });
      }
      
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error updating lesson progress:", err);
    return res.status(500).json({ error: "Failed to update progress" });
  }
}
