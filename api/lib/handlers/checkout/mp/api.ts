import { MP_ACCESS_TOKEN } from "./config.js";

export type MPPreferenceBody = {
  items: Array<{
    id: string;
    category_id: string;
    title: string;
    description: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  external_reference: string;
  payer: {
    email: string | null;
    first_name: string;
    last_name: string;
  };
  notification_url: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  binary_mode: boolean;
  statement_descriptor: string;
  metadata: any;
};

export type MPPreferenceResult = 
  | { success: true; initPoint: string; preferenceId: string }
  | { success: false; error: string; status: number; body?: any };

export async function createMPPreference(
  prefBody: MPPreferenceBody
): Promise<MPPreferenceResult> {
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prefBody),
  });

  const responseText = await r.text();
  let pref: any;
  
  try {
    pref = JSON.parse(responseText);
  } catch {
    pref = { raw: responseText };
  }

  if (!r.ok || !pref?.init_point) {
    console.error("[MP API] Error creating preference:", pref);
    return { 
      success: false, 
      error: "Error al crear preferencia en Mercado Pago", 
      status: r.status,
      body: pref 
    };
  }

  return { 
    success: true, 
    initPoint: pref.init_point, 
    preferenceId: pref.id 
  };
}

export async function getMPPayment(id: string): Promise<any> {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  
  if (!r.ok) {
    const errorBody = await r.text();
    console.error(`[MP API] getMPPayment failed:`, {
      payment_id: id,
      status: r.status,
      statusText: r.statusText,
      body: errorBody
    });
    throw new Error(`getMPPayment ${id} -> ${r.status}: ${r.statusText}`);
  }
  
  return r.json();
}

export async function getMPMerchantOrder(id: string): Promise<any> {
  const r = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  
  if (!r.ok) {
    const errorBody = await r.text();
    console.error(`[MP API] getMPMerchantOrder failed:`, {
      order_id: id,
      status: r.status,
      statusText: r.statusText,
      body: errorBody
    });
    throw new Error(`getMPMerchantOrder ${id} -> ${r.status}: ${r.statusText}`);
  }
  
  return r.json();
}
