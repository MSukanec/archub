// api/countries.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
    }

    // Get user token from Authorization header - REQUIRED for RLS
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Create Supabase client with anon key and user token (RLS applies)
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify the token is valid
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Fetch all countries ordered by name
    const { data: countries, error } = await supabase
      .from("countries")
      .select("id, name, country_code, alpha_3")
      .order("name");

    if (error) {
      console.error("Error fetching countries:", error);
      // Check if it's an auth-related error
      if (error.message?.includes("JWT") || error.message?.includes("token")) {
        return res.status(401).json({ error: "Authentication failed" });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(countries || []);
  } catch (err: any) {
    console.error("Countries API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
