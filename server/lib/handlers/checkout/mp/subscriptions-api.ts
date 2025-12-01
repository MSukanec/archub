import { MP_ACCESS_TOKEN } from "./config.js";

const MP_BASE_URL = "https://api.mercadopago.com";

export type MPAutoRecurring = {
  frequency: number;
  frequency_type: "days" | "months";
  transaction_amount: number;
  currency_id: string;
  start_date?: string;
  end_date?: string;
  free_trial?: {
    frequency: number;
    frequency_type: "days" | "months";
  };
};

export type MPPreapprovalPlanResult =
  | { success: true; planId: string; plan: any }
  | { success: false; error: string; status?: number; details?: any };

export type MPPreapprovalResult =
  | { success: true; preapprovalId: string; initPoint: string; preapproval: any }
  | { success: false; error: string; status?: number; details?: any };

export type MPPreapprovalDetailsResult =
  | { success: true; preapproval: any }
  | { success: false; error: string; status?: number };

export type MPPreapprovalUpdateResult =
  | { success: true; preapproval: any }
  | { success: false; error: string; status?: number; details?: any };

export async function createMPPreapprovalPlan(params: {
  reason: string;
  auto_recurring: MPAutoRecurring;
  back_url: string;
  external_reference?: string;
}): Promise<MPPreapprovalPlanResult> {
  try {
    const response = await fetch(`${MP_BASE_URL}/preapproval_plan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: params.reason,
        auto_recurring: params.auto_recurring,
        back_url: params.back_url,
        external_reference: params.external_reference,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error("[MP Subscriptions API] Error creating preapproval plan:", data);
      return {
        success: false,
        error: data.message || "Error creating MercadoPago preapproval plan",
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
    console.error("[MP Subscriptions API] Fatal error creating preapproval plan:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function getMPPreapprovalPlan(
  planId: string
): Promise<MPPreapprovalPlanResult> {
  try {
    const response = await fetch(`${MP_BASE_URL}/preapproval_plan/${planId}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[MP Subscriptions API] Error fetching preapproval plan:", response.status, errorData);
      return {
        success: false,
        error: `Failed to fetch preapproval plan: ${response.status}`,
        status: response.status,
        details: errorData,
      };
    }

    const data = await response.json();

    return {
      success: true,
      planId: data.id,
      plan: data,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error fetching preapproval plan:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function createMPPreapproval(params: {
  preapproval_plan_id?: string;
  reason: string;
  external_reference: string;
  payer_email: string;
  auto_recurring?: MPAutoRecurring;
  back_url: string;
  status?: "pending" | "authorized" | "paused" | "cancelled";
  card_token_id?: string;
}): Promise<MPPreapprovalResult> {
  try {
    const body: any = {
      reason: params.reason,
      external_reference: params.external_reference,
      payer_email: params.payer_email,
      back_url: params.back_url,
      status: params.status || "pending",
    };

    if (params.preapproval_plan_id) {
      body.preapproval_plan_id = params.preapproval_plan_id;
    }

    if (params.auto_recurring) {
      body.auto_recurring = params.auto_recurring;
    }

    if (params.card_token_id) {
      body.card_token_id = params.card_token_id;
    }

    const response = await fetch(`${MP_BASE_URL}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error("[MP Subscriptions API] Error creating preapproval:", data);
      return {
        success: false,
        error: data.message || "Error creating MercadoPago preapproval",
        status: response.status,
        details: data,
      };
    }

    const initPoint = data.init_point;

    if (!initPoint) {
      console.error("[MP Subscriptions API] No init_point in response:", data);
      return {
        success: false,
        error: "No init_point in MercadoPago response",
        status: response.status,
        details: data,
      };
    }

    return {
      success: true,
      preapprovalId: data.id,
      initPoint,
      preapproval: data,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error creating preapproval:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function getMPPreapproval(
  preapprovalId: string
): Promise<MPPreapprovalDetailsResult> {
  try {
    const response = await fetch(`${MP_BASE_URL}/preapproval/${preapprovalId}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[MP Subscriptions API] Error fetching preapproval:", response.status, errorData);
      return {
        success: false,
        error: `Failed to fetch preapproval: ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      preapproval: data,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error fetching preapproval:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export type MPPreapprovalSearchResult =
  | { success: true; preapprovalId: string; preapproval: any }
  | { success: false; error: string };

export async function searchMPPreapprovalByExternalRef(
  externalReference: string
): Promise<MPPreapprovalSearchResult> {
  try {
    // Search preapprovals with the given external_reference
    const response = await fetch(
      `${MP_BASE_URL}/preapproval/search?external_reference=${encodeURIComponent(externalReference)}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[MP Subscriptions API] Error searching preapproval:", response.status, errorData);
      return {
        success: false,
        error: `Failed to search preapproval: ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log("[MP Subscriptions API] No preapproval found for external_reference:", externalReference);
      return {
        success: false,
        error: "No preapproval found",
      };
    }

    // Return the first (most recent) result
    const preapproval = data.results[0];
    console.log("[MP Subscriptions API] Found preapproval:", preapproval.id, "status:", preapproval.status);

    return {
      success: true,
      preapprovalId: preapproval.id,
      preapproval,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error searching preapproval:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function updateMPPreapproval(
  preapprovalId: string,
  updates: {
    reason?: string;
    external_reference?: string;
    auto_recurring?: Partial<MPAutoRecurring>;
    back_url?: string;
    status?: "pending" | "authorized" | "paused" | "cancelled";
  }
): Promise<MPPreapprovalUpdateResult> {
  try {
    const response = await fetch(`${MP_BASE_URL}/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MP Subscriptions API] Error updating preapproval:", data);
      return {
        success: false,
        error: data.message || "Error updating MercadoPago preapproval",
        status: response.status,
        details: data,
      };
    }

    return {
      success: true,
      preapproval: data,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error updating preapproval:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function cancelMPPreapproval(
  preapprovalId: string
): Promise<{ success: boolean; error?: string; preapproval?: any }> {
  try {
    const response = await fetch(`${MP_BASE_URL}/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[MP Subscriptions API] Error cancelling preapproval:", data);
      return {
        success: false,
        error: data.message || `Failed to cancel preapproval: ${response.status}`,
      };
    }

    return { 
      success: true,
      preapproval: data,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error cancelling preapproval:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export async function searchMPPreapprovals(params: {
  payer_email?: string;
  external_reference?: string;
  status?: "pending" | "authorized" | "paused" | "cancelled";
  preapproval_plan_id?: string;
  offset?: number;
  limit?: number;
}): Promise<{ success: boolean; results?: any[]; paging?: any; error?: string }> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.payer_email) queryParams.set("payer_email", params.payer_email);
    if (params.external_reference) queryParams.set("external_reference", params.external_reference);
    if (params.status) queryParams.set("status", params.status);
    if (params.preapproval_plan_id) queryParams.set("preapproval_plan_id", params.preapproval_plan_id);
    if (params.offset !== undefined) queryParams.set("offset", params.offset.toString());
    if (params.limit !== undefined) queryParams.set("limit", params.limit.toString());

    const response = await fetch(`${MP_BASE_URL}/preapproval/search?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[MP Subscriptions API] Error searching preapprovals:", response.status, errorData);
      return {
        success: false,
        error: `Failed to search preapprovals: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      results: data.results || [],
      paging: data.paging,
    };
  } catch (error: any) {
    console.error("[MP Subscriptions API] Fatal error searching preapprovals:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

export const createPreapproval = createMPPreapproval;
export const getPreapproval = getMPPreapproval;
export const updatePreapproval = updateMPPreapproval;
export const cancelPreapproval = cancelMPPreapproval;
