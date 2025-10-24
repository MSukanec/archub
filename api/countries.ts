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

    // Create Supabase client with anon key only (no RLS required for public reference table)
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false }
    });

    // Fetch all countries ordered by name
    const { data: countries, error } = await supabase
      .from("countries")
      .select("id, name, country_code, alpha_3")
      .order("name");

    if (error) {
      console.error("Error fetching countries:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(countries || []);
  } catch (err: any) {
    console.error("Countries API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
