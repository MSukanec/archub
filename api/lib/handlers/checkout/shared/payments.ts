import { SupabaseClient } from "@supabase/supabase-js";

export type PaymentData = {
  providerPaymentId: string;
  userId?: string | null;
  courseId?: string | null;
  amount: number | null;
  currency: string;
  status: string;
  productType?: string | null;
  organizationId?: string | null;
  productId?: string | null;
  couponCode?: string | null;
  couponId?: string | null;
};

export async function insertPayment(
  supabase: SupabaseClient,
  provider: "mercadopago" | "paypal",
  data: PaymentData
): Promise<{ inserted: boolean; error?: string }> {
  const paymentData: any = {
    provider,
    provider_payment_id: data.providerPaymentId,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    product_type: data.productType || 'course',
  };

  if (!data.productType || data.productType === 'course') {
    paymentData.user_id = data.userId;
    paymentData.course_id = data.courseId;
    paymentData.product_id = data.courseId;
  }

  if (data.productType === 'subscription') {
    paymentData.user_id = data.userId; // ✅ CRITICAL: user_id is required even for subscriptions
    paymentData.organization_id = data.organizationId;
    paymentData.product_id = data.productId;
  }

  // Add coupon info if present (for both courses and subscriptions)
  if (data.couponCode) {
    paymentData.coupon_code = data.couponCode;
  }
  if (data.couponId) {
    paymentData.coupon_id = data.couponId;
  }

  const { error } = await supabase.from("payments").insert(paymentData);

  if (error) {
    if (error.code === '23505') {
      console.log('[payments] ⚠️ Payment ya existe (ignorado)');
      return { inserted: false }; // Duplicate, not inserted
    } else {
      console.error("[payments] payments insert error:", error);
      return { inserted: false, error: error.message };
    }
  } else {
    console.log("[payments] ✅ payment insertado", data.productType === 'subscription' ? '(subscription)' : '(course)');
    return { inserted: true }; // Successfully inserted
  }
}
