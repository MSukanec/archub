import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { supabase } from "./lib/supabase";

// Expose Supabase client to window for Chrome extension access
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}

createRoot(document.getElementById("root")!).render(<App />);
