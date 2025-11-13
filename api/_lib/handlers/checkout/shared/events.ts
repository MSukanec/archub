import { SupabaseClient } from "@supabase/supabase-js";

export type PaymentEventData = {
  providerEventId?: string | null;
  providerEventType: string;
  status: string;
  rawPayload: any;
  orderId?: string | null;
  customId?: string | null;
  userHint?: string | null;
  courseHint?: string | null;
  providerPaymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
};

export async function logPaymentEvent(
  supabase: SupabaseClient,
  provider: "mercadopago" | "paypal",
  data: PaymentEventData
): Promise<void> {
  const insert = {
    provider,
    provider_event_id: data.providerEventId ?? null,
    provider_event_type: data.providerEventType,
    status: data.status,
    raw_payload: data.rawPayload ?? {},
    order_id: data.orderId ?? null,
    custom_id: data.customId ?? null,
    user_hint: data.userHint ?? null,
    course_hint: data.courseHint ?? null,
    provider_payment_id: data.providerPaymentId ?? null,
    amount: data.amount ?? null,
    currency: data.currency ?? null,
  };

  const { error } = await supabase.from("payment_events").insert(insert);
  
  if (error) {
    console.error("[events] payment_events insert error:", error, insert);
  } else {
    console.log("[events] ✅ payment_event insertado");
  }
}
