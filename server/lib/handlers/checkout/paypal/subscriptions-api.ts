import { getPayPalAccessToken } from "./auth.js";
import { PAYPAL_BASE_URL } from "./config.js";


export type PayPalProductResult =
  | { success: true; productId: string; product: any }
  | { success: false; error: string; status?: number; details?: any };

export type PayPalBillingPlanResult =
  | { success: true; planId: string; plan: any }
  | { success: false; error: string; status?: number; details?: any };

export type PayPalSubscriptionResult =
  | { success: true; subscriptionId: string; approvalUrl: string; subscription: any }
  | { success: false; error: string; status?: number; details?: any };

export type PayPalSubscriptionDetailsResult =
  | { success: true; subscription: any }
  | { success: false; error: string; status?: number };

export async function createPayPalProduct(params: {
  name: string;
  description: string;
  type?: "SERVICE" | "PHYSICAL" | "DIGITAL";
  category?: string;
}): Promise<PayPalProductResult> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        type: params.type || "SERVICE",
        category: params.category || "SOFTWARE",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error("[PayPal Subscriptions API] Error creating product:", data);
      return {
        success: false,
        error: data.message || "Error creating PayPal product",
        status: response.status,
        details: data,
      };
    }

    return {
      success: true,
      productId: data.id,
      product: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error creating product:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function createPayPalBillingPlan(params: {
  productId: string;
  name: string;
  description: string;
  billingCycles: Array<{
    frequency: {
      interval_unit: "DAY" | "WEEK" | "MONTH" | "YEAR";
      interval_count: number;
    };
    tenure_type: "TRIAL" | "REGULAR";
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
  paymentPreferences?: {
    auto_bill_outstanding?: boolean;
    setup_fee?: {
      value: string;
      currency_code: string;
    };
    setup_fee_failure_action?: "CONTINUE" | "CANCEL";
    payment_failure_threshold?: number;
  };
}): Promise<PayPalBillingPlanResult> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      body: JSON.stringify({
        product_id: params.productId,
        name: params.name,
        description: params.description,
        billing_cycles: params.billingCycles,
        payment_preferences: params.paymentPreferences || {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error("[PayPal Subscriptions API] Error creating billing plan:", data);
      return {
        success: false,
        error: data.message || "Error creating PayPal billing plan",
        status: response.status,
        details: data,
      };
    }

    return {
      success: true,
      planId: data.id,
      plan: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error creating billing plan:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function createPayPalSubscription(params: {
  planId: string;
  subscriber?: {
    name?: {
      given_name?: string;
      surname?: string;
    };
    email_address?: string;
  };
  customId?: string;
  returnUrl: string;
  cancelUrl: string;
  brandName?: string;
  planOverride?: {
    billing_cycles: Array<{
      frequency?: {
        interval_unit: "DAY" | "WEEK" | "MONTH" | "YEAR";
        interval_count: number;
      };
      tenure_type?: "TRIAL" | "REGULAR";
      sequence: number;
      total_cycles?: number;
      pricing_scheme?: {
        fixed_price: {
          value: string;
          currency_code: string;
        };
      };
    }>;
  };
}): Promise<PayPalSubscriptionResult> {
  try {
    const token = await getPayPalAccessToken();

    const body: any = {
      plan_id: params.planId,
      application_context: {
        brand_name: params.brandName || "Seencel",
        locale: "es-ES",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    };

    if (params.subscriber) {
      body.subscriber = params.subscriber;
    }

    if (params.customId) {
      body.custom_id = params.customId;
    }

    if (params.planOverride) {
      body.plan = params.planOverride;
      console.log("[PayPal Subscriptions API] Using plan override:", JSON.stringify(params.planOverride, null, 2));
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error("[PayPal Subscriptions API] Error creating subscription:", data);
      return {
        success: false,
        error: data.message || "Error creating PayPal subscription",
        status: response.status,
        details: data,
      };
    }

    const approvalUrl = data.links?.find((l: any) => l.rel === "approve")?.href;

    if (!approvalUrl) {
      console.error("[PayPal Subscriptions API] No approval URL in response:", data);
      return {
        success: false,
        error: "No approval URL in PayPal response",
        status: response.status,
        details: data,
      };
    }

    return {
      success: true,
      subscriptionId: data.id,
      approvalUrl,
      subscription: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error creating subscription:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function getPayPalSubscription(
  subscriptionId: string
): Promise<PayPalSubscriptionDetailsResult> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "[PayPal Subscriptions API] Error fetching subscription:",
        response.status
      );
      return {
        success: false,
        error: `Failed to fetch subscription: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      subscription: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error fetching subscription:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason || "Customer requested cancellation",
        }),
      }
    );

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "[PayPal Subscriptions API] Error cancelling subscription:",
        response.status,
        errorData
      );
      return {
        success: false,
        error: `Failed to cancel subscription: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error cancelling subscription:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export type ReviseSubscriptionResult =
  | { success: true; requiresApproval: false; subscription: any }
  | { success: true; requiresApproval: true; approvalUrl: string; subscription: any }
  | { success: false; error: string; status?: number; details?: any };

export async function revisePayPalSubscription(params: {
  subscriptionId: string;
  newPlanId: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<ReviseSubscriptionResult> {
  try {
    const token = await getPayPalAccessToken();

    const body: any = {
      plan_id: params.newPlanId,
    };

    if (params.returnUrl && params.cancelUrl) {
      body.application_context = {
        brand_name: "Seencel",
        locale: "es-ES",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      };
    }

    console.log("[PayPal Subscriptions API] Revising subscription:", {
      subscriptionId: params.subscriptionId,
      newPlanId: params.newPlanId,
    });

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${params.subscriptionId}/revise`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[PayPal Subscriptions API] Error revising subscription:", data);
      return {
        success: false,
        error: data.message || "Error revising PayPal subscription",
        status: response.status,
        details: data,
      };
    }

    const approvalUrl = data.links?.find((l: any) => l.rel === "approve")?.href;

    if (approvalUrl) {
      console.log("[PayPal Subscriptions API] Revision requires user approval");
      return {
        success: true,
        requiresApproval: true,
        approvalUrl,
        subscription: data,
      };
    }

    console.log("[PayPal Subscriptions API] Revision applied automatically (card payment)");
    return {
      success: true,
      requiresApproval: false,
      subscription: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error revising subscription:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function getPayPalProduct(
  productId: string
): Promise<PayPalProductResult> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/catalogs/products/${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch product: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      productId: data.id,
      product: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error fetching product:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function getPayPalBillingPlan(
  planId: string
): Promise<PayPalBillingPlanResult> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/plans/${planId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch billing plan: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      planId: data.id,
      plan: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error fetching billing plan:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function listPayPalSubscriptionTransactions(
  subscriptionId: string,
  startTime: string,
  endTime: string
): Promise<{ success: boolean; transactions?: any[]; error?: string }> {
  try {
    const token = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/transactions?start_time=${startTime}&end_time=${endTime}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch transactions: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      transactions: data.transactions || [],
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error fetching transactions:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export type PayPalUpdatePricingResult =
  | { success: true }
  | { success: false; error: string; status?: number; details?: any };

export async function updatePayPalBillingPlanPricing(params: {
  planId: string;
  billingCycleSequence: number;
  amount: string;
  currencyCode?: string;
}): Promise<PayPalUpdatePricingResult> {
  try {
    const token = await getPayPalAccessToken();
    const currencyCode = params.currencyCode || "USD";

    console.log(`[PayPal Subscriptions API] Updating pricing for plan ${params.planId}:`, {
      sequence: params.billingCycleSequence,
      amount: params.amount,
      currency: currencyCode,
    });

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/plans/${params.planId}/update-pricing-schemes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pricing_schemes: [
            {
              billing_cycle_sequence: params.billingCycleSequence,
              pricing_scheme: {
                fixed_price: {
                  value: params.amount,
                  currency_code: currencyCode,
                },
              },
            },
          ],
        }),
      }
    );

    if (response.status === 204) {
      console.log(`[PayPal Subscriptions API] ✅ Successfully updated pricing for plan ${params.planId}`);
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    console.error("[PayPal Subscriptions API] Error updating pricing:", data);
    return {
      success: false,
      error: data.message || `Failed to update pricing: ${response.status}`,
      status: response.status,
      details: data,
    };
  } catch (error: any) {
    console.error("[PayPal Subscriptions API] Fatal error updating pricing:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export const createSubscription = createPayPalSubscription;
export const getSubscription = getPayPalSubscription;
export const cancelSubscription = cancelPayPalSubscription;
