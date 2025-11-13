import { supabase } from "./supabase";

export type PriceRow = {
  amount: number;
  currency_code: string;
  provider: string | null;
  months: number | null;
};

/**
 * Obtiene el precio de un curso por slug usando el sistema unificado:
 * - Lee el precio base en USD desde courses.price
 * - Si la moneda es ARS, convierte usando exchange_rates
 * - Retorna null si el curso no existe o no está activo
 */
export async function getCoursePriceBySlug(
  courseSlug: string,
  opts: { currency: string; provider?: string } = { currency: "ARS" }
): Promise<PriceRow | null> {
  const currency = opts.currency;

  // 1. Obtener curso y precio base en USD
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("price, is_active")
    .eq("slug", courseSlug)
    .single();

  if (courseError || !course?.is_active) {
    return null;
  }

  let finalAmount = Number(course.price);

  // 2. Si la moneda es ARS, convertir usando exchange_rates
  if (currency === 'ARS') {
    const { data: exchangeRate, error: exchangeError } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", "USD")
      .eq("to_currency", "ARS")
      .eq("is_active", true)
      .single();

    if (exchangeError || !exchangeRate) {
      console.error('[getCoursePrice] Exchange rate not found:', exchangeError);
      return null;
    }

    finalAmount = finalAmount * Number(exchangeRate.rate);
  }

  return {
    amount: finalAmount,
    currency_code: currency,
    provider: opts.provider ?? null,
    months: null
  };
}
