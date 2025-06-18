import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { countries, user_data, user_preferences, users } from "../shared/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all countries
  app.get("/api/countries", async (req, res) => {
    try {
      const allCountries = await db.select().from(countries).orderBy(countries.name);
      res.json(allCountries);
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
        await db.update(users)
          .set({
            full_name,
            avatar_url,
            updated_at: new Date()
          })
          .where(eq(users.id, user_id));
      }

      // Update or insert user_data
      if (first_name !== undefined || last_name !== undefined || birthdate !== undefined || age !== undefined || country !== undefined) {
        const existingUserData = await db.select().from(user_data).where(eq(user_data.user_id, user_id)).limit(1);
        
        if (existingUserData.length > 0) {
          await db.update(user_data)
            .set({
              first_name,
              last_name,
              birthdate,
              age,
              country,
              updated_at: new Date()
            })
            .where(eq(user_data.user_id, user_id));
        } else {
          await db.insert(user_data).values([{
            user_id,
            first_name,
            last_name,
            birthdate,
            age,
            country
          }]);
        }
      }

      // Update user_preferences
      if (theme !== undefined || sidebar_docked !== undefined) {
        const existingPreferences = await db.select().from(user_preferences).where(eq(user_preferences.user_id, user_id)).limit(1);
        
        if (existingPreferences.length > 0) {
          await db.update(user_preferences)
            .set({
              theme,
              sidebar_docked,
              updated_at: new Date()
            })
            .where(eq(user_preferences.user_id, user_id));
        } else {
          await db.insert(user_preferences).values([{
            user_id,
            theme,
            sidebar_docked
          }]);
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
