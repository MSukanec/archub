import type { Express } from "express";
import type { RouteDeps } from "./_base";

/**
 * Register reference data endpoints (public, read-only data like countries, task parameters)
 */
export function registerReferenceRoutes(app: Express, deps: RouteDeps): void {
  const { supabase } = deps;

  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Get all countries (public reference data, no auth required)
  app.get("/api/countries", async (req, res) => {
    try {
      const { data: countries, error } = await supabase
        .from("countries")
        .select("id, name, country_code, alpha_3")
        .order("name");

      if (error) {
        console.error("Error fetching countries:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.json(countries || []);
    } catch (err: any) {
      console.error("Countries API error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get task parameter values with expression templates
  app.get("/api/task-parameter-values", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select(`
          name, 
          label,
          task_parameters!inner(expression_template)
        `);
      
      if (error) {
        console.error("Error fetching task parameter values:", error);
        return res.status(500).json({ error: "Failed to fetch task parameter values" });
      }
      
      // Flatten the data structure to include expression_template directly
      const flattenedData = data?.map((item: any) => ({
        name: item.name,
        label: item.label,
        expression_template: item.task_parameters?.expression_template || null
      })) || [];

      res.json(flattenedData);
    } catch (error) {
      console.error("Error fetching task parameter values:", error);
      res.status(500).json({ error: "Failed to fetch task parameter values" });
    }
  });
}
