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

  // Update user profile - direct table updates
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const {
        user_id,
        full_name,
        avatar_url,
        first_name,
        last_name,
        birthdate,
        country,
        theme,
        sidebar_docked
      } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      console.log("Updating profile for user:", user_id);

      // Update user_data table directly - only birthdate and country exist
      if (birthdate !== undefined || country !== undefined) {
        // Check if user_data record exists
        const { data: existingData } = await supabase
          .from('user_data')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const updateData: any = {};
        if (birthdate !== undefined && birthdate !== "") updateData.birthdate = birthdate;
        if (country !== undefined && country !== "") updateData.country = country;

        if (existingData) {
          // Update existing record
          const { error } = await supabase
            .from('user_data')
            .update(updateData)
            .eq('user_id', user_id);
          
          if (error) {
            console.error("Error updating user_data:", error);
          } else {
            console.log("Updated user_data successfully");
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('user_data')
            .insert({
              user_id,
              ...updateData
            });
          
          if (error) {
            console.error("Error inserting user_data:", error);
          } else {
            console.log("Inserted user_data successfully");
          }
        }
      }

      // Update user_preferences table
      if (theme !== undefined || sidebar_docked !== undefined) {
        const { data: existingPrefs } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const prefsData: any = {};
        if (theme !== undefined) prefsData.theme = theme;
        if (sidebar_docked !== undefined) prefsData.sidebar_docked = sidebar_docked;

        if (existingPrefs) {
          const { error } = await supabase
            .from('user_preferences')
            .update(prefsData)
            .eq('user_id', user_id);
          
          if (error) {
            console.error("Error updating user_preferences:", error);
          } else {
            console.log("Updated user_preferences successfully");
          }
        } else {
          const { error } = await supabase
            .from('user_preferences')
            .insert({
              user_id,
              ...prefsData
            });
          
          if (error) {
            console.error("Error inserting user_preferences:", error);
          } else {
            console.log("Inserted user_preferences successfully");
          }
        }
      }

      // Update auth.users metadata for all user fields
      if (full_name !== undefined || avatar_url !== undefined || first_name !== undefined || last_name !== undefined) {
        const metadata: any = {};
        if (full_name !== undefined) metadata.full_name = full_name;
        if (avatar_url !== undefined) metadata.avatar_url = avatar_url;
        if (first_name !== undefined) metadata.first_name = first_name;
        if (last_name !== undefined) metadata.last_name = last_name;

        const { error } = await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: metadata
        });

        if (error) {
          console.error("Error updating auth metadata:", error);
        } else {
          console.log("Updated auth metadata successfully");
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
