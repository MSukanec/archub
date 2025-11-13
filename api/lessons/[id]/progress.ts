// api/lessons/[id]/progress.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { updateLessonProgress } from "../../lib/handlers/learning/updateLessonProgress.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
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

    const lessonId = req.query.id as string;
    const { progress_pct, last_position_sec, completed_at, is_completed } = req.body;

    const ctx = { supabase };
    const params = {
      lessonId,
      progress_pct,
      last_position_sec,
      completed_at,
      is_completed
    };
    const result = await updateLessonProgress(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }

  } catch (err: any) {
    console.error("Error in lesson progress endpoint:", err);
    return res.status(500).json({ error: "Failed to update progress" });
  }
}
