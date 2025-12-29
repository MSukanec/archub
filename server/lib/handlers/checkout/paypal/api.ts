import { getPayPalAccessToken } from "./auth.js";
import { PAYPAL_BASE_URL } from "./config.js";

export type PayPalOrderBody = {
  intent: string;
  purchase_units: Array<{
    invoice_id: string;
    custom_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
  application_context?: {
    brand_name?: string;
    landing_page?: string;
    user_action?: string;
    return_url?: string;
    cancel_url?: string;
  };
};

export type PayPalOrderResult = 
  | { success: true; orderId: string; approvalUrl: string }
  | { success: false; error: string; status: number; body?: any };

export async function createPayPalOrder(
  orderBody: PayPalOrderBody
): Promise<PayPalOrderResult> {
  const token = await getPayPalAccessToken();
  
  const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderBody),
  });

  const responseData = await r.json();

  if (!r.ok || !responseData.id) {
    console.error("[PayPal API] Error creating order:", responseData);
    return { 
      success: false, 
      error: "Error creating PayPal order", 
      status: r.status,
      body: responseData 
    };
  }

  const approvalUrl = responseData.links?.find((l: any) => l.rel === "approve")?.href;
  
  if (!approvalUrl) {
    console.error("[PayPal API] No approval URL found:", responseData);
    return { 
      success: false, 
      error: "No approval URL in PayPal response", 
      status: r.status,
      body: responseData 
    };
  }

  return { 
    success: true, 
    orderId: responseData.id, 
    approvalUrl 
  };
}

export async function capturePayPalOrder(orderId: string): Promise<any> {
  const token = await getPayPalAccessToken();
  
  const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!r.ok) {
    const errorData = await r.json();
    throw new Error(`capturePayPalOrder ${orderId} -> ${r.status}: ${JSON.stringify(errorData)}`);
  }

  return r.json();
}

export async function getPayPalOrder(orderId: string): Promise<any> {
  const token = await getPayPalAccessToken();
  
  const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!r.ok) {
    throw new Error(`getPayPalOrder ${orderId} -> ${r.status}`);
  }

  return r.json();
}
