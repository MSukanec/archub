import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { handleChat, handleHistory, handleHomeGreeting } from "../controllers/ai/ai.controller.js";

export function registerAIRoutes(app: Express, deps: RouteDeps) {
  app.get("/api/ai/home_greeting", handleHomeGreeting);
  app.post("/api/ai/chat", handleChat);
  app.get("/api/ai/history", handleHistory);
}
