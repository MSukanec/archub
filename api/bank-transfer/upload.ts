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

    const { btp_id, file_name, file_data } = req.body;

    // Validate required fields
    if (!btp_id || !file_name || !file_data) {
      return res.status(400).json({ error: "btp_id, file_name, and file_data are required" });
    }

    // Verify that the bank transfer payment belongs to the user and is still pending
    const { data: existingPayment, error: fetchError } = await adminClient
      .from('bank_transfer_payments')
      .select('*')
      .eq('id', btp_id)
      .eq('user_id', profile.id)
      .single();

    if (fetchError || !existingPayment) {
      return res.status(404).json({ error: "Bank transfer payment not found or access denied" });
    }

    if (existingPayment.status !== 'pending') {
      return res.status(400).json({ error: "Cannot upload receipt for non-pending payment" });
    }

    // Usamos el course_id que guardamos al crear la transferencia
    let courseId = existingPayment.course_id;

    // Fallback: Si course_id es null (registro viejo), buscar desde checkout_sessions
    if (!courseId && existingPayment.order_id) {
      console.warn('[bank-transfer/upload] course_id is null, attempting fallback from checkout_sessions');
      const { data: session } = await adminClient
        .from('checkout_sessions')
        .select('course_id')
        .eq('id', existingPayment.order_id)
        .maybeSingle();

      if (session?.course_id) {
        courseId = session.course_id;
        console.log('[bank-transfer/upload] Fallback successful, found course_id:', courseId);
      }
    }

    console.log('[bank-transfer/upload] Using course_id:', courseId);

    // VALIDATE EARLY: No courseId = fail before any uploads
    if (!courseId) {
      console.error('❌ [bank-transfer/upload] Missing courseId - cannot process upload');
      return res.status(400).json({
        error: "Cannot process payment upload",
        details: "Course ID not found. Please contact support - this payment may have corrupted data."
      });
    }

    // Validate file extension
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExtension = file_name.substring(file_name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
      });
    }

    // Decode base64 file data
    const base64Data = file_data.replace(/^data:.+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const filePath = `${btp_id}${fileExtension}`;
    const { data: uploadData, error: uploadError } = await authenticatedSupabase.storage
      .from('bank-transfer-receipts')
      .upload(filePath, buffer, {
        contentType: fileExtension === '.pdf' ? 'application/pdf' : `image/${fileExtension.substring(1)}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload file to storage" });
    }

    // Get public URL
    const { data: { publicUrl } } = authenticatedSupabase.storage
      .from('bank-transfer-receipts')
      .getPublicUrl(filePath);

    // Crear registro en payments SOLO si no existe todavía
    let paymentId = existingPayment.payment_id;

    if (!paymentId) {
      const { data: payment, error: paymentError } = await adminClient
        .from('payments')
        .insert({
          provider: 'bank_transfer',
          provider_payment_id: btp_id,
          user_id: profile.id,
          course_id: courseId,
          product_type: courseId ? 'course' : null,
          product_id: courseId,
          amount: String(existingPayment.amount),
          currency: existingPayment.currency,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError || !payment) {
        console.error("Error creating payment:", paymentError);
        return res.status(500).json({ error: "Failed to create payment record" });
      }

      paymentId = payment.id;
    } else {
      console.log('[bank-transfer/upload] Payment already exists, reusing:', paymentId);
    }

    // Actualizar bank_transfer_payments con payment_id y receipt_url
    const { error: updateError } = await authenticatedSupabase
      .from('bank_transfer_payments')
      .update({
        payment_id: paymentId,
        receipt_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', btp_id);

    if (updateError) {
      console.error("Update error:", updateError);
      // Rollback: eliminar el payment si fue creado en este request
      if (paymentId !== existingPayment.payment_id) {
        await adminClient.from('payments').delete().eq('id', paymentId);
      }
      return res.status(500).json({ error: "Failed to update receipt URL" });
    }

    return res.json({
      success: true,
      receipt_url: publicUrl,
    });
  } catch (error: any) {
    console.error("Error uploading receipt:", error);
    return res.status(500).json({ error: error.message || "Failed to upload receipt" });
  }
}
