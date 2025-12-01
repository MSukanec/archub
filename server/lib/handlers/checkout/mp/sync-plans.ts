import type { Request } from "express";
import { getAuthenticatedClient } from "../shared/auth.js";
import {
  createMPPreapprovalPlan,
  getMPPreapprovalPlan,
} from "./subscriptions-api.js";

export type SyncMPPlansResult =
  | {
      success: true;
      results: Array<{
        planSlug: string;
        monthlyPlanId: string | null;
        annualPlanId: string | null;
        created: boolean;
      }>;
    }
  | { success: false; error: string; status?: number };

export async function syncMPPlans(req: Request): Promise<SyncMPPlansResult> {
  try {
    const authResult = getAuthenticatedClient(req);
    if (!authResult.success) {
      // In development, allow without auth; in production, require it
      if (process.env.NODE_ENV === 'production') {
        return { success: false, error: authResult.error, status: 401 };
      }
    }

    const { supabase } = authResult.success ? authResult : 
      // Use service role client in development if no auth
      { supabase: getServiceSupabaseClient() };

    if (process.env.NODE_ENV === 'production') {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: "Autenticación fallida", status: 401 };
      }

      const { data: dbUser } = await supabase
        .from("users")
        .select("is_admin")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!dbUser?.is_admin) {
        return { success: false, error: "Se requiere acceso de administrador", status: 403 };
      }
    }

    const { data: exchangeRate, error: exchangeError } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", "USD")
      .eq("to_currency", "ARS")
      .eq("is_active", true)
      .single();

    if (exchangeError || !exchangeRate) {
      console.error("[MP sync-plans] Tasa de cambio no encontrada:", exchangeError);
      return { success: false, error: "Tasa de cambio USD/ARS no encontrada", status: 500 };
    }

    const arsRate = Number(exchangeRate.rate);
    console.log(`[MP sync-plans] Usando tasa de cambio USD/ARS: ${arsRate}`);

    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, name, slug, monthly_amount, annual_amount, is_active, mp_plan_monthly_id, mp_plan_annual_id")
      .eq("is_active", true)
      .neq("slug", "free");

    if (plansError) {
      console.error("[MP sync-plans] Error obteniendo planes:", plansError);
      return { success: false, error: "Error al obtener planes", status: 500 };
    }

    if (!plans || plans.length === 0) {
      return { success: false, error: "No se encontraron planes de pago activos", status: 404 };
    }

    const results: Array<{
      planSlug: string;
      monthlyPlanId: string | null;
      annualPlanId: string | null;
      created: boolean;
    }> = [];

    const backUrl = process.env.NODE_ENV === 'production'
      ? 'https://app.seencel.com/checkout/success'
      : 'https://0.0.0.0:5000/checkout/success';

    for (const plan of plans) {
      let monthlyPlanId = plan.mp_plan_monthly_id;
      let annualPlanId = plan.mp_plan_annual_id;
      let created = false;

      if (monthlyPlanId) {
        const existingPlan = await getMPPreapprovalPlan(monthlyPlanId);
        if (!existingPlan.success) {
          console.log(`[MP sync-plans] Plan mensual ${monthlyPlanId} no encontrado en MP, creando nuevo`);
          monthlyPlanId = null;
        }
      }

      if (!monthlyPlanId && plan.monthly_amount && Number(plan.monthly_amount) > 0) {
        const monthlyPriceARS = Math.round(Number(plan.monthly_amount) * arsRate * 100) / 100;
        
        const monthlyResult = await createMPPreapprovalPlan({
          reason: `Seencel ${plan.name} - Mensual`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: monthlyPriceARS,
            currency_id: "ARS",
          },
          back_url: backUrl,
          external_reference: `seencel_plan_${plan.slug}_monthly`,
        });

        if (monthlyResult.success) {
          monthlyPlanId = monthlyResult.planId;
          created = true;
          console.log(`[MP sync-plans] Plan mensual creado ${monthlyPlanId} para ${plan.slug} - ARS $${monthlyPriceARS}`);
        } else {
          console.error(`[MP sync-plans] Error creando plan mensual para ${plan.slug}:`, monthlyResult.error);
        }
      }

      if (annualPlanId) {
        const existingPlan = await getMPPreapprovalPlan(annualPlanId);
        if (!existingPlan.success) {
          console.log(`[MP sync-plans] Plan anual ${annualPlanId} no encontrado en MP, creando nuevo`);
          annualPlanId = null;
        }
      }

      if (!annualPlanId && plan.annual_amount && Number(plan.annual_amount) > 0) {
        const annualPriceARS = Math.round(Number(plan.annual_amount) * arsRate * 100) / 100;
        
        const annualResult = await createMPPreapprovalPlan({
          reason: `Seencel ${plan.name} - Anual`,
          auto_recurring: {
            frequency: 12,
            frequency_type: "months",
            transaction_amount: annualPriceARS,
            currency_id: "ARS",
          },
          back_url: backUrl,
          external_reference: `seencel_plan_${plan.slug}_annual`,
        });

        if (annualResult.success) {
          annualPlanId = annualResult.planId;
          created = true;
          console.log(`[MP sync-plans] Plan anual creado ${annualPlanId} para ${plan.slug} - ARS $${annualPriceARS}`);
        } else {
          console.error(`[MP sync-plans] Error creando plan anual para ${plan.slug}:`, annualResult.error);
        }
      }

      if (created) {
        const { error: updateError } = await supabase
          .from("plans")
          .update({
            mp_plan_monthly_id: monthlyPlanId,
            mp_plan_annual_id: annualPlanId,
          })
          .eq("id", plan.id);

        if (updateError) {
          console.error(`[MP sync-plans] Error actualizando plan ${plan.slug}:`, updateError);
        } else {
          console.log(`[MP sync-plans] Plan ${plan.slug} actualizado en DB`);
        }
      }

      results.push({
        planSlug: plan.slug,
        monthlyPlanId,
        annualPlanId,
        created,
      });
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("[MP sync-plans] Error fatal:", error);
    return { success: false, error: error.message || "Error desconocido", status: 500 };
  }
}
