// api/learning/courses-full.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getCoursesFull } from "../_lib/handlers/learning/getCoursesFull.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
      .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
      .send("ok");
  }

  if (req.method !== "GET") {
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(405)
      .json({ error: "Method not allowed" });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!token) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(401)
        .json({ error: "No authorization token provided" });
    }
    
    // Create authenticated Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ error: "Supabase configuration missing" });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });

    const ctx = { supabase };
    const result = await getCoursesFull(ctx);

    if (result.success) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(200)
        .json(result.data);
    } else {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ error: result.error });
    }

  } catch (error: any) {
    console.error('Error in courses-full endpoint:', error);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ error: "Internal server error" });
  }
}
