import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase credentials are not set");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all countries
  app.get("/api/countries", async (req, res) => {
    try {
      const { data: countries, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) {
        console.error("Supabase error fetching countries:", error);
        return res.status(500).json({ error: "Failed to fetch countries" });
      }

      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const {
        user_id,
        full_name,
        avatar_url,
        first_name,
        last_name,
        birthdate,
        age,
        country,
        theme,
        sidebar_docked
      } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Update users table
      if (full_name !== undefined || avatar_url !== undefined) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name,
            avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user_id);

        if (error) {
          console.error("Error updating users table:", error);
          return res.status(500).json({ error: "Failed to update user" });
        }
      }

      // Update or insert user_data
      if (first_name !== undefined || last_name !== undefined || birthdate !== undefined || age !== undefined || country !== undefined) {
        const { data: existingUserData } = await supabase
          .from('user_data')
          .select('id')
          .eq('user_id', user_id)
          .single();
        
        if (existingUserData) {
          const { error } = await supabase
            .from('user_data')
            .update({
              first_name,
              last_name,
              birthdate,
              age,
              country,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id);

          if (error) {
            console.error("Error updating user_data:", error);
            return res.status(500).json({ error: "Failed to update user data" });
          }
        } else {
          const { error } = await supabase
            .from('user_data')
            .insert({
              user_id,
              first_name,
              last_name,
              birthdate,
              age,
              country
            });

          if (error) {
            console.error("Error inserting user_data:", error);
            return res.status(500).json({ error: "Failed to create user data" });
          }
        }
      }

      // Update user_preferences
      if (theme !== undefined || sidebar_docked !== undefined) {
        const { data: existingPreferences } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user_id)
          .single();
        
        if (existingPreferences) {
          const { error } = await supabase
            .from('user_preferences')
            .update({
              theme,
              sidebar_docked,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id);

          if (error) {
            console.error("Error updating user_preferences:", error);
            return res.status(500).json({ error: "Failed to update preferences" });
          }
        } else {
          const { error } = await supabase
            .from('user_preferences')
            .insert({
              user_id,
              theme,
              sidebar_docked
            });

          if (error) {
            console.error("Error inserting user_preferences:", error);
            return res.status(500).json({ error: "Failed to create preferences" });
          }
        }
      }

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
