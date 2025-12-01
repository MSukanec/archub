import type { Request } from "express";
import { getAuthenticatedClient } from "../shared/auth.js";
import {
  createPayPalProduct,
  createPayPalBillingPlan,
  getPayPalProduct,
  getPayPalBillingPlan,
} from "./subscriptions-api.js";

export type SyncPlansResult =
  | {
      success: true;
      results: Array<{
        planSlug: string;
        productId: string;
        monthlyPlanId: string | null;
        annualPlanId: string | null;
        created: boolean;
      }>;
    }
  | { success: false; error: string; status?: number };

export async function syncPayPalPlans(req: Request): Promise<SyncPlansResult> {
  try {
    const authResult = getAuthenticatedClient(req);
    if (!authResult.success) {
      return { success: false, error: authResult.error, status: 401 };
    }

    const { supabase } = authResult;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Authentication failed", status: 401 };
    }

    // Verify admin using admin_users table
    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("auth_id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!adminCheck) {
      return { success: false, error: "Admin access required", status: 403 };
    }

    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, name, slug, monthly_amount, annual_amount, is_active, paypal_product_id, paypal_plan_monthly_id, paypal_plan_annual_id")
      .eq("is_active", true)
      .neq("slug", "free");

    if (plansError) {
      console.error("[PayPal sync-plans] Error fetching plans:", plansError);
      return { success: false, error: "Failed to fetch plans", status: 500 };
    }

    if (!plans || plans.length === 0) {
      return { success: false, error: "No active paid plans found", status: 404 };
    }

    const results: Array<{
      planSlug: string;
      productId: string;
      monthlyPlanId: string | null;
      annualPlanId: string | null;
      created: boolean;
    }> = [];

    for (const plan of plans) {
      let productId = plan.paypal_product_id;
      let monthlyPlanId = plan.paypal_plan_monthly_id;
      let annualPlanId = plan.paypal_plan_annual_id;
      let created = false;

      if (productId) {
        const existingProduct = await getPayPalProduct(productId);
        if (!existingProduct.success) {
          console.log(`[PayPal sync-plans] Product ${productId} not found in PayPal, creating new one`);
          productId = null;
        }
      }

      if (!productId) {
        const productResult = await createPayPalProduct({
          name: `Seencel ${plan.name}`,
          description: `Subscription plan for Seencel ${plan.name}`,
          type: "SERVICE",
          category: "SOFTWARE",
        });

        if (!productResult.success) {
          console.error(`[PayPal sync-plans] Failed to create product for ${plan.slug}:`, productResult.error);
          results.push({
            planSlug: plan.slug,
            productId: "",
            monthlyPlanId: null,
            annualPlanId: null,
            created: false,
          });
          continue;
        }

        productId = productResult.productId;
        created = true;
        console.log(`[PayPal sync-plans] Created product ${productId} for ${plan.slug}`);
      }

      if (monthlyPlanId) {
        const existingPlan = await getPayPalBillingPlan(monthlyPlanId);
        if (!existingPlan.success) {
          console.log(`[PayPal sync-plans] Monthly plan ${monthlyPlanId} not found, creating new one`);
          monthlyPlanId = null;
        }
      }

      if (!monthlyPlanId && plan.monthly_amount && Number(plan.monthly_amount) > 0) {
        const monthlyResult = await createPayPalBillingPlan({
          productId: productId,
          name: `${plan.name} - Monthly`,
          description: `Monthly subscription to Seencel ${plan.name} plan`,
          billingCycles: [
            {
              frequency: {
                interval_unit: "MONTH",
                interval_count: 1,
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: String(plan.monthly_amount),
                  currency_code: "USD",
                },
              },
            },
          ],
          paymentPreferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
          },
        });

        if (monthlyResult.success) {
          monthlyPlanId = monthlyResult.planId;
          created = true;
          console.log(`[PayPal sync-plans] Created monthly plan ${monthlyPlanId} for ${plan.slug}`);
        } else {
          console.error(`[PayPal sync-plans] Failed to create monthly plan for ${plan.slug}:`, monthlyResult.error);
        }
      }

      if (annualPlanId) {
        const existingPlan = await getPayPalBillingPlan(annualPlanId);
        if (!existingPlan.success) {
          console.log(`[PayPal sync-plans] Annual plan ${annualPlanId} not found, creating new one`);
          annualPlanId = null;
        }
      }

      if (!annualPlanId && plan.annual_amount && Number(plan.annual_amount) > 0) {
        const annualResult = await createPayPalBillingPlan({
          productId: productId,
          name: `${plan.name} - Annual`,
          description: `Annual subscription to Seencel ${plan.name} plan`,
          billingCycles: [
            {
              frequency: {
                interval_unit: "YEAR",
                interval_count: 1,
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: String(plan.annual_amount),
                  currency_code: "USD",
                },
              },
            },
          ],
          paymentPreferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
          },
        });

        if (annualResult.success) {
          annualPlanId = annualResult.planId;
          created = true;
          console.log(`[PayPal sync-plans] Created annual plan ${annualPlanId} for ${plan.slug}`);
        } else {
          console.error(`[PayPal sync-plans] Failed to create annual plan for ${plan.slug}:`, annualResult.error);
        }
      }

      if (created) {
        const { error: updateError } = await supabase
          .from("plans")
          .update({
            paypal_product_id: productId,
            paypal_plan_monthly_id: monthlyPlanId,
            paypal_plan_annual_id: annualPlanId,
          })
          .eq("id", plan.id);

        if (updateError) {
          console.error(`[PayPal sync-plans] Failed to update plan ${plan.slug}:`, updateError);
        }
      }

      results.push({
        planSlug: plan.slug,
        productId: productId || "",
        monthlyPlanId,
        annualPlanId,
        created,
      });
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("[PayPal sync-plans] Fatal error:", error);
    return { success: false, error: error.message || "Unknown error", status: 500 };
  }
}
