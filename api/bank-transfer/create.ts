import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type")
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = extractToken(req.headers.authorization as string);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const authenticatedSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get current user
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user profile (public.users id)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('id, full_name, email')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return res.status(404).json({ error: "User profile not found" });
    }

    const { order_id, course_slug, amount, currency, payer_name, payer_note, discount_percent, discount_amount } = req.body;

    // Validate required fields
    if (!order_id || !course_slug || !amount || !currency) {
      return res.status(400).json({ error: "order_id, course_slug, amount, and currency are required" });
    }

    // Get course info from course_slug
    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id')
      .eq('slug', course_slug)
      .maybeSingle();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return res.status(404).json({ error: "Course not found" });
    }

    const courseId = course.id;

    // Crear solo registro en bank_transfer_payments (sin payment_id todavía)
    const { data: bankTransferPayment, error: insertError } = await adminClient
      .from('bank_transfer_payments')
      .insert({
        order_id,
        user_id: profile.id,
        course_id: courseId,
        payment_id: null,
        amount: String(amount),
        currency,
        payer_name: payer_name || null,
        payer_note: payer_note || null,
        discount_percent: discount_percent ? String(discount_percent) : "5.0",
        discount_amount: discount_amount ? String(discount_amount) : "0",
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !bankTransferPayment) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to create bank transfer payment" });
    }

    return res.json({
      success: true,
      payment_id: null,
      btp_id: bankTransferPayment.id,
      status: bankTransferPayment.status,
    });
  } catch (error: any) {
    console.error("Error creating bank transfer payment:", error);
    return res.status(500).json({ error: error.message || "Failed to create bank transfer payment" });
  }
}
