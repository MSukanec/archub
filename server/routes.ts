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

      // Update user_data table - now includes first_name, last_name, birthdate and country
      if (birthdate !== undefined || country !== undefined || first_name !== undefined || last_name !== undefined) {
        // Check if user_data record exists
        const { data: existingData } = await supabase
          .from('user_data')
          .select('id')
          .eq('user_id', user_id)
          .single();

        const updateData: any = {};
        if (birthdate !== undefined && birthdate !== "") updateData.birthdate = birthdate;
        if (country !== undefined && country !== "") updateData.country = country;
        if (first_name !== undefined && first_name !== "") updateData.first_name = first_name;
        if (last_name !== undefined && last_name !== "") updateData.last_name = last_name;

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

      // Update users table for user profile fields (excluding first_name/last_name which are now in user_data)
      if (full_name !== undefined || avatar_url !== undefined) {
        const userUpdateData: any = {};
        if (full_name !== undefined) userUpdateData.full_name = full_name;
        if (avatar_url !== undefined) userUpdateData.avatar_url = avatar_url;

        if (Object.keys(userUpdateData).length > 0) {
          const { error } = await supabase
            .from('users')
            .update(userUpdateData)
            .eq('auth_id', user_id);

          if (error) {
            console.error("Error updating users table:", error);
          } else {
            console.log("Updated users table successfully");
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
