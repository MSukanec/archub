import { supabase } from "./supabase";

export type PriceRow = {
  amount: number;
  currency_code: string;
  provider: string | null;
};

/**
 * Busca el precio de un curso por slug, priorizando:
 *  (A) provider específico (p.ej. "mercadopago") + currency
 *  (B) provider "any" + currency
 * Retorna null si no hay precio activo.
 */
export async function getCoursePriceBySlug(
  courseSlug: string,
  opts: { currency: string; provider?: string } = { currency: "ARS" }
): Promise<PriceRow | null> {
  const provider = opts.provider ?? "mercadopago";
  const currency = opts.currency;

  // A) provider específico + currency
  const qA = await supabase
    .from("course_prices")
    .select("amount, currency_code, provider, courses!inner(slug)")
    .eq("courses.slug", courseSlug)
    .eq("is_active", true)
    .eq("currency_code", currency)
    .eq("provider", provider)
    .limit(1)
    .maybeSingle();
    
  if (qA.data) {
    return {
      amount: Number(qA.data.amount),
      currency_code: qA.data.currency_code,
      provider: qA.data.provider
    };
  }

  // B) provider "any" + currency
  const qB = await supabase
    .from("course_prices")
    .select("amount, currency_code, provider, courses!inner(slug)")
    .eq("courses.slug", courseSlug)
    .eq("is_active", true)
    .eq("currency_code", currency)
    .eq("provider", "any")
    .limit(1)
    .maybeSingle();
    
  if (qB.data) {
    return {
      amount: Number(qB.data.amount),
      currency_code: qB.data.currency_code,
      provider: qB.data.provider
    };
  }

  return null;
}
