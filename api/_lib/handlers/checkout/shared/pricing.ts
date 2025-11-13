import { SupabaseClient } from "@supabase/supabase-js";

export type CoursePriceResult = 
  | { success: true; price: number; months: number; provider: string }
  | { success: false; error: string; details?: any };

export async function getCoursePrice(
  supabase: SupabaseClient,
  courseSlug: string,
  currency: string,
  provider: "mercadopago" | "paypal"
): Promise<CoursePriceResult> {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, slug, short_description, is_active")
    .eq("slug", courseSlug)
    .single();

  if (courseError || !course?.is_active) {
    return { success: false, error: "Curso no encontrado o inactivo" };
  }

  const { data: priceRows, error: priceError } = await supabase
    .from("course_prices")
    .select("amount, currency_code, provider, is_active, months")
    .eq("course_id", course.id)
    .eq("currency_code", currency)
    .in("provider", [provider, "any"])
    .eq("is_active", true);

  if (priceError) {
    return { success: false, error: "Error leyendo precios", details: priceError };
  }

  const chosen = priceRows?.find((r) => r.provider === provider) ?? priceRows?.[0];
  if (!chosen) {
    return { success: false, error: "No hay precio activo para ese curso + moneda" };
  }

  const price = Number(chosen.amount);
  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, error: "Precio inválido" };
  }

  return { 
    success: true, 
    price, 
    months: chosen.months || 12,
    provider: chosen.provider
  };
}

export type PlanPriceResult = 
  | { success: true; price: number; provider: string }
  | { success: false; error: string; details?: any };

export async function getPlanPrice(
  supabase: SupabaseClient,
  planSlug: string,
  currency: string,
  billingPeriod: "monthly" | "annual",
  provider: "mercadopago" | "paypal"
): Promise<PlanPriceResult> {
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, name, slug, is_active")
    .eq("slug", planSlug)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    return { success: false, error: "Plan no encontrado o inactivo" };
  }

  const { data: planPrices, error: priceError } = await supabase
    .from("plan_prices")
    .select("monthly_amount, annual_amount, currency_code, provider")
    .eq("plan_id", plan.id)
    .eq("currency_code", currency)
    .in("provider", [provider, "any"])
    .eq("is_active", true);

  if (priceError || !planPrices || planPrices.length === 0) {
    return { 
      success: false, 
      error: `Precio no encontrado para este plan (${provider}/${currency})`,
      details: priceError 
    };
  }

  const chosenPrice = planPrices.find((p: any) => p.provider === provider) ?? planPrices[0];
  const priceAmount = billingPeriod === 'monthly' 
    ? chosenPrice.monthly_amount 
    : chosenPrice.annual_amount;

  const price = Number(priceAmount);
  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, error: "Precio inválido en plan_prices" };
  }

  return { 
    success: true, 
    price,
    provider: chosenPrice.provider
  };
}
