import type { Express } from "express";
import type { RouteDeps } from './_base';

// Helper function to send WhatsApp notification via Twilio
async function sendWhatsAppNotification(params: {
  userProfile: { full_name: string | null; email: string };
  amount: string;
  currency: string;
  receiptUrl: string;
}) {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., "whatsapp:+14155238886"
  const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER; // e.g., "whatsapp:+5491132273000"

  // If Twilio is not configured, skip silently
  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber || !adminWhatsAppNumber) {
    throw new Error("Twilio not configured");
  }

  const { userProfile, amount, currency, receiptUrl } = params;

  const message = `
🔔 *Nuevo comprobante de transferencia*

👤 Usuario: ${userProfile.full_name || userProfile.email}
💰 Monto: ${amount} ${currency}
📄 Comprobante: ${receiptUrl}

_Por favor revisar y aprobar el pago._
`.trim();

  // Send WhatsApp message via Twilio
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioWhatsAppNumber,
        To: adminWhatsAppNumber,
        Body: message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${error}`);
  }

  return await response.json();
}

export function registerBankTransferRoutes(app: Express, deps: RouteDeps) {
  const { extractToken, createAuthenticatedClient, getAdminClient } = deps;

  // Create bank transfer payment record
  app.post("/api/bank-transfer/create", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Get user profile (public.users id)
      const adminClient = getAdminClient();
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
        .eq('is_deleted', false)
        .eq('slug', course_slug)
        .maybeSingle();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return res.status(404).json({ error: "Course not found" });
      }

      const courseId = course.id;

      // ⚠️ NO creamos registro en payments aquí - solo cuando se suba el comprobante
      // Esto evita "pagos fantasma" de usuarios que seleccionan transferencia pero nunca suben comprobante

      // Crear solo registro en bank_transfer_payments (sin payment_id todavía)
      const { data: bankTransferPayment, error: insertError } = await adminClient
        .from('bank_transfer_payments')
        .insert({
          order_id,
          user_id: profile.id,
          course_id: courseId, // ✅ Guardamos el course_id aquí
          payment_id: null, // Se llenará cuando suba el comprobante
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
        payment_id: null, // No hay payment_id todavía
        btp_id: bankTransferPayment.id,
        status: bankTransferPayment.status,
      });
    } catch (error: any) {
      console.error("Error creating bank transfer payment:", error);
      return res.status(500).json({ error: error.message || "Failed to create bank transfer payment" });
    }
  });

  // Upload receipt for bank transfer payment
  app.post("/api/bank-transfer/upload", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Get user profile (public.users id)
      const adminClient = getAdminClient();
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

      // ✅ Usamos el course_id que guardamos al crear la transferencia
      let courseId = existingPayment.course_id;
      
      // 🛡️ Fallback: Si course_id es null (registro viejo), buscar desde checkout_sessions
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
      
      // ⚠️ VALIDATE EARLY: No courseId = fail before any uploads
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

      // Upload to bank-transfer-receipts with scalable structure:
      // receipts/{course_id}/{user_id}/{btp_id}{extension}
      const filePath = `receipts/${courseId}/${profile.id}/${btp_id}${fileExtension}`;
      const bucket = 'bank-transfer-receipts';
      
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: fileExtension === '.pdf' ? 'application/pdf' : `image/${fileExtension.substring(1)}`,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload file to storage" });
      }

      // Store the path reference (not public URL since it's a private bucket)
      // Format: bucket:path for easy retrieval and signed URL generation
      const receiptRef = `${bucket}:${filePath}`;

      // 1️⃣ Crear registro en payments SOLO si no existe todavía (evita duplicados en re-uploads)
      let paymentId = existingPayment.payment_id;
      
      if (!paymentId) {
        const { data: payment, error: paymentError } = await adminClient
          .from('payments')
          .insert({
            provider: 'bank_transfer',
            provider_payment_id: btp_id, // Usamos el btp_id como referencia
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

      // 2️⃣ Actualizar bank_transfer_payments con payment_id y receipt_url (bucket:path format)
      const { error: updateError } = await adminClient
        .from('bank_transfer_payments')
        .update({ 
          payment_id: paymentId,
          receipt_url: receiptRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', btp_id);

      if (updateError) {
        console.error("Update error:", updateError);
        // Rollback: eliminar el archivo si falla la actualización de DB
        await adminClient.storage.from(bucket).remove([filePath]);
        // Rollback: eliminar el payment si fue creado en este request
        if (paymentId !== existingPayment.payment_id) {
          await adminClient.from('payments').delete().eq('id', paymentId);
        }
        return res.status(500).json({ error: "Failed to update receipt URL" });
      }

      // Generate signed URL for WhatsApp notification (1 hour expiry)
      const { data: signedUrlData } = await adminClient.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
      const signedUrl = signedUrlData?.signedUrl || receiptRef;

      // Send WhatsApp notification (if Twilio is configured)
      try {
        await sendWhatsAppNotification({
          userProfile: profile,
          amount: String(existingPayment.amount),
          currency: existingPayment.currency,
          receiptUrl: signedUrl,
        });
      } catch (whatsappError: any) {
        console.log("WhatsApp notification skipped:", whatsappError?.message || "Twilio not configured");
      }

      return res.json({
        success: true,
        receipt_url: receiptRef,
      });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      return res.status(500).json({ error: error.message || "Failed to upload receipt" });
    }
  });

  // Get signed URL for receipt (admin only)
  app.get("/api/admin/bank-transfer/receipt/:btp_id", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Check if user is admin
      const adminClient = getAdminClient();
      const { data: profile } = await adminClient
        .from('users')
        .select('is_super_admin')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile?.is_super_admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { btp_id } = req.params;

      // Get the payment with receipt_url
      const { data: payment, error: fetchError } = await adminClient
        .from('bank_transfer_payments')
        .select('receipt_url')
        .eq('id', btp_id)
        .single();

      if (fetchError || !payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (!payment.receipt_url) {
        return res.status(404).json({ error: "No receipt uploaded" });
      }

      // Parse the receipt_url (format: bucket:path or legacy public URL)
      let signedUrl = payment.receipt_url;
      
      if (payment.receipt_url.startsWith('bank-transfer-receipts:')) {
        const filePath = payment.receipt_url.replace('bank-transfer-receipts:', '');
        const { data: signedUrlData, error: signError } = await adminClient.storage
          .from('bank-transfer-receipts')
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        if (signError) {
          console.error("Error generating signed URL:", signError);
          return res.status(500).json({ error: "Failed to generate signed URL" });
        }
        signedUrl = signedUrlData.signedUrl;
      } else if (payment.receipt_url.startsWith('http')) {
        // Legacy public URL - use as-is
        signedUrl = payment.receipt_url;
      }

      return res.json({ signed_url: signedUrl });
    } catch (error: any) {
      console.error("Error getting receipt signed URL:", error);
      return res.status(500).json({ error: error.message || "Failed to get receipt" });
    }
  });

  // Get bank transfer payment status (for user to check their payment)
  app.get("/api/bank-transfer/:btp_id", async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);
      
      // Get current user
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Get user profile (public.users id)
      const adminClient = getAdminClient();
      const { data: profile, error: profileError } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return res.status(404).json({ error: "User profile not found" });
      }

      const { btp_id } = req.params;

      const { data: payment, error: fetchError } = await adminClient
        .from('bank_transfer_payments')
        .select('*')
        .eq('id', btp_id)
        .eq('user_id', profile.id)
        .single();

      if (fetchError || !payment) {
        return res.status(404).json({ error: "Bank transfer payment not found" });
      }

      return res.json(payment);
    } catch (error: any) {
      console.error("Error fetching bank transfer payment:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch payment" });
    }
  });
}
