// api/lessons/[id]/notes.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getLessonNotes } from "../../lib/handlers/learning/getLessonNotes.js";
import { createOrUpdateLessonNote } from "../../lib/handlers/learning/createOrUpdateLessonNote.js";

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
    const ctx = { supabase };

    if (req.method === "GET") {
      const params = { lessonId };
      const result = await getLessonNotes(ctx, params);

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }

    } else if (req.method === "POST") {
      const { body, time_sec, is_pinned } = req.body;
      const params = { lessonId, body, time_sec, is_pinned };
      const result = await createOrUpdateLessonNote(ctx, params);

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        if (result.error === 'Body must be a string') {
          return res.status(400).json({ error: result.error });
        }
        if (result.error === 'User not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(500).json({ error: result.error });
      }

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error("Error in lesson notes endpoint:", err);
    return res.status(500).json({ error: "Failed to process notes" });
  }
}
