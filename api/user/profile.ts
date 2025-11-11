// api/user/profile.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../_lib/auth-helpers.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow PATCH requests
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, supabase } = userResult;

    const {
      user_id,
      first_name,
      last_name,
      country,
      birthdate,
      avatar_url,
      phone_e164,
      sidebar_docked,
      theme,
    } = req.body;

    // Validate that we're updating the correct user
    if (user_id && user_id !== userId) {
      return res.status(403).json({ error: "Cannot update another user's profile" });
    }

    console.log('Updating profile for user:', userId);

    // Handle user_data updates
    let userDataUpdates: any = {};
    if (first_name !== undefined) userDataUpdates.first_name = first_name;
    if (last_name !== undefined) userDataUpdates.last_name = last_name;
    if (country !== undefined) userDataUpdates.country = country;
    if (birthdate !== undefined) userDataUpdates.birthdate = birthdate;
    if (phone_e164 !== undefined) userDataUpdates.phone_e164 = phone_e164;

    // Update user_data if there are changes
    if (Object.keys(userDataUpdates).length > 0) {
      // Check if user_data row exists (NO .single())
      const { data: existingUserData } = await supabase
        .from("user_data")
        .select("id")
        .eq("user_id", userId);

      if (existingUserData && existingUserData.length > 0) {
        // Update existing row
        const { error: updateError } = await supabase
          .from("user_data")
          .update(userDataUpdates)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating user_data:", updateError);
          return res.status(500).json({ error: updateError.message });
        }
        console.log('Updated user_data successfully');
      } else {
        // Insert new row
        const { error: insertError } = await supabase
          .from("user_data")
          .insert({ user_id: userId, ...userDataUpdates });

        if (insertError) {
          console.error("Error inserting user_data:", insertError);
          return res.status(500).json({ error: insertError.message });
        }
        console.log('Inserted new user_data successfully');
      }
    }

    // Handle user_preferences updates
    let preferencesUpdates: any = {};
    if (sidebar_docked !== undefined) preferencesUpdates.sidebar_docked = sidebar_docked;
    if (theme !== undefined) preferencesUpdates.theme = theme;

    if (Object.keys(preferencesUpdates).length > 0) {
      // Check if preferences row exists (NO .single())
      const { data: existingPrefs } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId);

      if (existingPrefs && existingPrefs.length > 0) {
        // Update existing row
        const { error: updateError } = await supabase
          .from("user_preferences")
          .update(preferencesUpdates)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating user_preferences:", updateError);
          return res.status(500).json({ error: updateError.message });
        }
      } else {
        // Insert new row
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({ user_id: userId, ...preferencesUpdates });

        if (insertError) {
          console.error("Error inserting user_preferences:", insertError);
          return res.status(500).json({ error: insertError.message });
        }
      }
    }

    // Update avatar_url in users table if provided
    if (avatar_url !== undefined) {
      const { error: avatarError } = await supabase
        .from("users")
        .update({ avatar_url })
        .eq("id", userId);

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
