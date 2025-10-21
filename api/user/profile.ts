// api/user/profile.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow PATCH requests
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    // Get user token from Authorization header
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Create Supabase client with service role but user token for RLS
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const {
      user_id,
      first_name,
      last_name,
      country,
      birthdate,
      avatar_url,
    } = req.body;

    // Validate that we're updating the correct user
    if (user_id && user_id !== user.id) {
      return res.status(403).json({ error: "Cannot update another user's profile" });
    }

    const updates: any = {};
    let userDataUpdates: any = {};

    // Handle user_data updates
    if (first_name !== undefined) userDataUpdates.first_name = first_name;
    if (last_name !== undefined) userDataUpdates.last_name = last_name;
    if (country !== undefined) userDataUpdates.country = country;
    if (birthdate !== undefined) userDataUpdates.birthdate = birthdate;

    // Update user_data if there are changes
    if (Object.keys(userDataUpdates).length > 0) {
      // Check if user_data row exists
      const { data: existingUserData } = await supabase
        .from("user_data")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingUserData) {
        // Update existing row
        const { error: updateError } = await supabase
          .from("user_data")
          .update(userDataUpdates)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating user_data:", updateError);
          return res.status(500).json({ error: updateError.message });
        }
      } else {
        // Insert new row
        const { error: insertError } = await supabase
          .from("user_data")
          .insert({ user_id: user.id, ...userDataUpdates });

        if (insertError) {
          console.error("Error inserting user_data:", insertError);
          return res.status(500).json({ error: insertError.message });
        }
      }
    }

    // Update avatar_url in users table if provided
    if (avatar_url !== undefined) {
      const { error: avatarError } = await supabase
        .from("users")
        .update({ avatar_url })
        .eq("id", user.id);

      if (avatarError) {
        console.error("Error updating avatar:", avatarError);
        return res.status(500).json({ error: avatarError.message });
      }
    }

    return res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
