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
    .select("price, is_active")
    .eq("slug", courseSlug)
    .single();

  if (courseError || !course?.is_active) {
    return { success: false, error: "Curso no encontrado o inactivo" };
  }

  let price = Number(course.price);

  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, error: "Precio inválido" };
  }

  // If currency is ARS, convert using exchange_rates
  if (currency === 'ARS') {
    const { data: exchangeRate, error: exchangeError } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", "USD")
      .eq("to_currency", "ARS")
      .eq("is_active", true)
      .single();

    if (exchangeError || !exchangeRate) {
      return { success: false, error: "Tasa de cambio no disponible", details: exchangeError };
    }

    price = price * Number(exchangeRate.rate);
  }

  return { 
    success: true, 
    price, 
    months: 12,
    provider
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
    .select("monthly_amount, annual_amount, is_active")
    .eq("slug", planSlug)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    return { success: false, error: "Plan no encontrado o inactivo" };
  }

  const priceAmount = billingPeriod === 'monthly' 
    ? plan.monthly_amount 
    : plan.annual_amount;

  let price = Number(priceAmount);
  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, error: "Precio inválido" };
  }

  // If currency is ARS, convert using exchange_rates
  if (currency === 'ARS') {
    const { data: exchangeRate, error: exchangeError } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", "USD")
      .eq("to_currency", "ARS")
      .eq("is_active", true)
      .single();

    if (exchangeError || !exchangeRate) {
      return { 
        success: false, 
        error: "Tasa de cambio no disponible",
        details: exchangeError 
      };
    }

    price = price * Number(exchangeRate.rate);
  }

  return { 
    success: true, 
    price,
    provider
  };
}
