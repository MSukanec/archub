import type { Express } from "express";
import type { RouteDeps } from './_base';

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

      const { order_id, amount, currency, payer_name, payer_note } = req.body;

      // Validate required fields
      if (!order_id || !amount || !currency) {
        return res.status(400).json({ error: "order_id, amount, and currency are required" });
      }

      // Insert bank transfer payment record
      const { data: bankTransferPayment, error: insertError } = await authenticatedSupabase
        .from('bank_transfer_payments')
        .insert({
          order_id,
          user_id: user.id,
          amount: String(amount),
          currency,
          payer_name: payer_name || null,
          payer_note: payer_note || null,
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

      const { btp_id, file_name, file_data } = req.body;

      // Validate required fields
      if (!btp_id || !file_name || !file_data) {
        return res.status(400).json({ error: "btp_id, file_name, and file_data are required" });
      }

      // Verify that the bank transfer payment belongs to the user and is still pending
      const { data: existingPayment, error: fetchError } = await authenticatedSupabase
        .from('bank_transfer_payments')
        .select('*')
        .eq('id', btp_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingPayment) {
        return res.status(404).json({ error: "Bank transfer payment not found or access denied" });
      }

      if (existingPayment.status !== 'pending') {
        return res.status(400).json({ error: "Cannot upload receipt for non-pending payment" });
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

      // Update receipt_url in database
      const { error: updateError } = await authenticatedSupabase
        .from('bank_transfer_payments')
        .update({ 
          receipt_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', btp_id);

      if (updateError) {
        console.error("Update error:", updateError);
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

      const { btp_id } = req.params;

      const { data: payment, error: fetchError } = await authenticatedSupabase
        .from('bank_transfer_payments')
        .select('*')
        .eq('id', btp_id)
        .eq('user_id', user.id)
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
