// /api/learning/courses-full.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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
    
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });
    
    // Get current auth user
    const { data: { user: authUser }, error: authUserError } = await authenticatedSupabase.auth.getUser();
    
    if (authUserError || !authUser) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(401)
        .json({ error: "Unauthorized" });
    }
    
    // Get user record
    const { data: userRecord, error: userRecordError } = await authenticatedSupabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    
    if (userRecordError || !userRecord) {
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(200)
        .json({ courses: [], enrollments: [], progress: [] });
    }
    
    // 🚀 Execute ALL queries in parallel for maximum speed
    const [coursesResult, enrollmentsResult, progressResult] = await Promise.all([
      // Get all active courses
      authenticatedSupabase
        .from('courses')
        .select('id, slug, title, short_description, cover_url, is_active, visibility')
        .eq('is_active', true)
        .neq('visibility', 'draft'),
      
      // Get user's enrollments
      authenticatedSupabase
        .from('course_enrollments')
        .select('id, course_id, user_id, status, created_at, updated_at, courses(slug)')
        .eq('user_id', userRecord.id),
      
      // Get user's progress from optimized view
      authenticatedSupabase
        .from('course_progress_view')
        .select('*')
        .eq('user_id', userRecord.id)
    ]);
    
    if (coursesResult.error) {
      console.error('[courses-full] Error fetching courses:', coursesResult.error);
      return res
        .setHeader("Access-Control-Allow-Origin", "*")
        .status(500)
        .json({ error: 'Failed to fetch courses' });
    }
    
    // Flatten enrollment data
    const enrollments = (enrollmentsResult.data || []).map((e: any) => ({
      ...e,
      course_slug: e.courses?.slug
    }));
    
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(200)
      .json({
        courses: coursesResult.data || [],
        enrollments: enrollments,
        progress: progressResult.data || []
      });
  } catch (error: any) {
    console.error('[courses-full] Internal error:', error);
    return res
      .setHeader("Access-Control-Allow-Origin", "*")
      .status(500)
      .json({ error: "Internal server error" });
  }
}
