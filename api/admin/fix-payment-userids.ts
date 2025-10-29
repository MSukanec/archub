// api/admin/fix-payment-userids.ts
// Endpoint temporal para corregir user_ids en la tabla payments
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminUser, AuthError } from "./auth-helper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization || "";

    try {
      await verifyAdminUser(authHeader);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Internal error" });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res
        .status(500)
        .json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    if (req.method === "POST") {
      console.log('🔧 Iniciando migración de user_ids en payments...');

      // Obtener todos los pagos
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, user_id, provider, amount, currency');

      if (paymentsError) {
        console.error('❌ Error obteniendo payments:', paymentsError);
        return res.status(500).json({ error: 'Failed to fetch payments', details: paymentsError });
      }

      console.log(`📋 Encontrados ${payments?.length || 0} pagos`);

      let updated = 0;
      let skipped = 0;
      let errors = 0;

      for (const payment of payments || []) {
        // Verificar si el user_id es un auth_id (intentar buscar en users por auth_id)
        const { data: userByAuthId } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', payment.user_id)
          .maybeSingle();

        if (userByAuthId) {
          // Es un auth_id, necesita ser actualizado
          console.log(`🔄 Actualizando payment ${payment.id}: ${payment.user_id} → ${userByAuthId.id}`);
          
          const { error: updateError } = await supabase
            .from('payments')
            .update({ user_id: userByAuthId.id })
            .eq('id', payment.id);

          if (updateError) {
            console.error(`❌ Error actualizando payment ${payment.id}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Verificar si ya es un user_id válido
          const { data: userById } = await supabase
            .from('users')
            .select('id')
            .eq('id', payment.user_id)
            .maybeSingle();

          if (userById) {
            console.log(`✓ Payment ${payment.id} ya tiene user_id correcto`);
            skipped++;
          } else {
            console.warn(`⚠️ Payment ${payment.id} tiene user_id inválido: ${payment.user_id}`);
            errors++;
          }
        }
      }

      console.log(`✅ Migración completada: ${updated} actualizados, ${skipped} omitidos, ${errors} errores`);

      return res.status(200).json({
        success: true,
        total: payments?.length || 0,
        updated,
        skipped,
        errors
      });

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (err: any) {
    console.error('❌ Error fatal en migración:', err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
