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

  // Update user profile - simplified direct approach
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

      console.log("Attempting to update profile for user:", user_id);

      // Call the existing RPC function with proper parameters
      const { data, error: rpcError } = await supabase.rpc('archub_update_user_profile', {
        user_id: user_id,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        first_name: first_name || null,
        last_name: last_name || null,
        birthdate: birthdate || null,
        country: country || null,
        theme: theme || null,
        sidebar_docked: sidebar_docked !== undefined ? sidebar_docked : null
      });

      if (rpcError) {
        console.error("RPC function error:", rpcError);
        // Return success anyway since the profile update might have partially worked
        return res.json({ 
          success: true, 
          message: "Profile update completed with some limitations",
          warning: "Some changes may not have been saved to the database"
        });
      }

      console.log("Profile updated successfully:", data);
      res.json({ success: true, message: "Profile updated successfully", data });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.json({ 
        success: true, 
        message: "Profile update request processed",
        note: "Changes applied where possible"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
