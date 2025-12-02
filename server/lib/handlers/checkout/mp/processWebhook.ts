import type { Request } from "express";
import { createServiceSupabaseClient } from "../shared/auth.js";
import { logPaymentEvent } from "../shared/events.js";
import { insertPayment } from "../shared/payments.js";
import { upsertEnrollment } from "../shared/enrollments.js";
import { upgradeOrganizationPlan } from "../shared/subscriptions.js";
import { getCourseIdBySlug, getPlanIdBySlug } from "../shared/helpers.js";
import { markCouponAsUsed } from "../shared/coupons.js";
import { getMPPayment, getMPMerchantOrder } from "./api.js";
import { getMPPreapproval } from "./subscriptions-api.js";
import { extractMetadata, decodeExternalReference } from "./encoding.js";
import { MP_WEBHOOK_SECRET } from "./config.js";

export type ProcessWebhookResult =
  | { success: true; processed: string; id: string }
  | { success: false; error: string };

async function parseBody(req: Request): Promise<any> {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {}
    }
  } catch {}
  try {
    // @ts-ignore
    const raw: string = await new Promise((resolve) => {
      let data = "";
      // @ts-ignore
      req.on("data", (c: Buffer) => (data += c.toString("utf8")));
      // @ts-ignore
      req.on("end", () => resolve(data));
    });
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {}
    const p = new URLSearchParams(raw);
    const obj = Object.fromEntries(p.entries());
    const id = p.get("data.id") || p.get("id");
    if (!obj["data"] && id) (obj as any).data = { id };
    return obj;
  } catch {
    return {};
  }
}

export async function processWebhook(req: Request): Promise<ProcessWebhookResult> {
  const supabase = createServiceSupabaseClient();

  try {
    // 1. Validación de secret (TEMPORALMENTE DESHABILITADA PARA DEBUG)
    if (MP_WEBHOOK_SECRET) {
      const q = String(req.query?.secret ?? "");
      
      if (!q || q !== MP_WEBHOOK_SECRET) {
        console.warn("[mp/webhook] secret mismatch - PERO CONTINUANDO PARA DEBUG");
        // TEMPORALMENTE COMENTADO: return { success: true, processed: "ignored", id: "secret_mismatch" };
      }
    }

    // 2. Parse body
    const body = await parseBody(req);
    const type =
      body?.type ||
      body?.topic ||
      (typeof body?.action === "string"
        ? String(body.action).split(".")[0]
        : undefined);

    const idFromBody = body?.data?.id || body?.id || null;
    const idFromQuery =
      (req.query?.["data.id"] as string) ||
      (req.query?.["id"] as string) ||
      null;
    const finalId = idFromBody || idFromQuery || null;

    // === PAYMENT ===
    if (type === "payment" && finalId) {
      const pay = await getMPPayment(String(finalId));
      const md = extractMetadata(pay);
      const externalRef = md.external_reference || "";
      
      // NUEVO: Buscar datos en mp_course_preferences si es un ID corto (empieza con "mp_")
      // UPGRADE: Buscar datos en mp_subscription_preferences si es un ID corto (empieza con "mpu_")
      let fromDb: any = null;
      if (externalRef.startsWith("mpu_")) {
        console.log("[MP webhook] Looking up upgrade preference:", externalRef);
        const { data: prefData, error: prefError } = await supabase
          .from("mp_subscription_preferences")
          .select("*")
          .eq("id", externalRef)
          .maybeSingle();
        
        if (prefData && !prefError) {
          fromDb = {
            user_id: prefData.user_id,
            organization_id: prefData.organization_id,
            plan_slug: prefData.plan_slug,
            billing_period: prefData.billing_period,
            product_type: prefData.product_type || 'subscription_upgrade',
          };
          console.log("[MP webhook] Found upgrade preference data:", fromDb);
        } else {
          console.warn("[MP webhook] ⚠️ No upgrade preference data found:", prefError);
        }
      } else if (externalRef.startsWith("mp_")) {
        const { data: prefData, error: prefError } = await supabase
          .from("mp_course_preferences")
          .select("*, courses!inner(slug)")
          .eq("id", externalRef)
          .maybeSingle();
        
        if (prefData && !prefError) {
          fromDb = {
            user_id: prefData.user_id,
            course_slug: prefData.courses?.slug,
            months: prefData.access_months,
            coupon_code: prefData.coupon_code,
            coupon_id: prefData.coupon_id,
            product_type: 'course',
          };
        } else {
          console.warn("[MP webhook] ⚠️ No se encontraron datos en BD:", prefError);
        }
      }
      
      // Fallback al viejo método (base64) si no hay datos en BD
      const fromExt = fromDb || decodeExternalReference(externalRef);
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug = md.course_slug ?? fromExt.course_slug ?? null;

      const providerPaymentId = String(pay?.id ?? "");
      const status = String(pay?.status ?? "");
      const statusDetail = String(pay?.status_detail ?? "");
      const amount = Number(pay?.transaction_amount ?? 0);
      const currency = String(pay?.currency_id ?? "ARS");

      const productType = md.product_type || fromExt.product_type || 'course';
      const organizationId = md.organization_id || fromExt.organization_id;
      const planIdFromMetadata = md.plan_id;
      const planSlug = md.plan_slug || fromExt.plan_slug;
      const billingPeriod = md.billing_period || fromExt.billing_period;
      const couponCode = md.coupon_code || fromExt.coupon_code || null;
      const couponId = md.coupon_id || fromExt.coupon_id || null;

      // CRITICAL: Get user_id for payment record
      // For subscription_upgrade: user_id from mp_subscription_preferences is ALREADY public.users.id
      // For other types (courses): user_id might be auth_id and needs conversion
      let publicUserId: string | null = null;
      
      if (productType === 'subscription_upgrade') {
        // For upgrades, user_id from the preference IS the public.users.id (no conversion needed)
        publicUserId = resolvedUserId;
      } else if (resolvedUserId) {
        // For courses and regular subscriptions, convert auth_id to public.users.id
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", resolvedUserId)
          .maybeSingle();

        if (profileError || !userProfile) {
          console.error('[MP webhook] ❌ Failed to resolve auth_id to user_id:', {
            auth_id: resolvedUserId,
            error: profileError
          });
        } else {
          publicUserId = userProfile.id;
        }
      }

      // 1. Insertar en payment_events
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: providerPaymentId,
        providerEventType: "payment.webhook",
        status: "PROCESSED",
        rawPayload: pay,
        orderId: String(pay?.order?.id ?? ""),
        customId: md.external_reference ?? null,
        userHint: resolvedUserId,
        courseHint: resolvedSlug,
        providerPaymentId: providerPaymentId,
        amount: amount || null,
        currency: currency,
      });

      // 2. Si está aprobado, procesar según product_type
      if (status === "approved") {
        // UPGRADE: Handle subscription_upgrade - just record payment, actual upgrade happens in handleUpgradeReturn
        if (productType === 'subscription_upgrade') {
          console.log("[MP webhook] Processing subscription upgrade payment:", {
            externalRef,
            organizationId,
            planSlug,
            amount,
          });
          
          let resolvedPlanId: string | null = null;
          if (planSlug) {
            resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
          }
          
          const upgradePaymentResult = await insertPayment(supabase, "mercadopago", {
            providerPaymentId: providerPaymentId,
            userId: publicUserId,
            amount: amount || null,
            currency: currency,
            status: "completed",
            productType: 'subscription_upgrade',
            organizationId: organizationId || undefined,
            productId: resolvedPlanId || undefined,
          });
          
          if (upgradePaymentResult.inserted) {
            console.log("[MP webhook] ✅ Upgrade payment recorded:", upgradePaymentResult.paymentId);
          } else {
            console.log("[MP webhook] Upgrade payment already existed (duplicate webhook)");
          }
          
          return { success: true, processed: "subscription_upgrade_payment", id: finalId };
        }
        
        if (productType === 'subscription') {
          if (organizationId && billingPeriod) {
            let resolvedPlanId = planIdFromMetadata;
            
            if (!resolvedPlanId && planSlug) {
              resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
              
              if (!resolvedPlanId) {
                console.error(`[MP webhook] ❌ Failed to resolve plan_id from slug "${planSlug}"`);
                return { success: true, processed: "error", id: 'plan_not_found' };
              }
            }
            
            if (!resolvedPlanId) {
              console.error(`[MP webhook] ❌ Missing both plan_id and plan_slug`);
              return { success: true, processed: "error", id: 'missing_plan_data' };
            }
            
            // Insert payment (subscription) - userId is REQUIRED even for subscriptions
            const subPaymentResult = await insertPayment(supabase, "mercadopago", {
              providerPaymentId: providerPaymentId,
              userId: publicUserId, // ✅ CRITICAL: Required for payments table
              amount: amount || null,
              currency: currency,
              status: "completed",
              productType: 'subscription',
              organizationId: organizationId,
              productId: resolvedPlanId,
            });

            // IDEMPOTENT: Only upgrade organization plan if payment was NEWLY inserted
            if (subPaymentResult.inserted && subPaymentResult.paymentId) {
              await upgradeOrganizationPlan(supabase, {
                organizationId: organizationId,
                planId: resolvedPlanId,
                billingPeriod: billingPeriod as 'monthly' | 'annual',
                paymentId: subPaymentResult.paymentId, // ✅ UUID from payments table
                amount: amount,
                currency: currency,
                userId: publicUserId, // ✅ For Founders Program
              });
            } else if (!subPaymentResult.inserted) {
              // Duplicate webhook - payment already processed
            } else {
              console.error(`[MP webhook] ❌ No payment ID returned for subscription`);
            }
          } else {
            console.error(`[MP webhook] ❌ Missing subscription data:`, { organizationId, billingPeriod });
          }
        } else {
          // course_id si podemos
          let course_id: string | null = null;
          if (resolvedSlug) course_id = await getCourseIdBySlug(supabase, resolvedSlug);

          if (publicUserId && course_id) {
            // Insert payment (course) - using publicUserId from public.users table
            const paymentResult = await insertPayment(supabase, "mercadopago", {
              providerPaymentId: providerPaymentId,
              userId: publicUserId,
              courseId: course_id,
              amount: amount || null,
              currency: currency,
              status: "completed",
              productType: 'course',
              couponCode: couponCode,
              couponId: couponId,
            });

            // IDEMPOTENT: Only mark coupon as used if payment was NEWLY inserted (not duplicate)
            if (paymentResult.inserted && paymentResult.paymentId && couponId && couponCode) {
              // Calculate amount saved (we need to store original price in metadata for this)
              // For now, use 0 as placeholder - ideally we'd store original_price in metadata
              const amountSaved = 0; // TODO: Store original_price in metadata to calculate discount
              const couponResult = await markCouponAsUsed(
                supabase, 
                couponId,
                publicUserId,
                course_id,
                paymentResult.paymentId, // ✅ Usar UUID de payments table, no el ID de MP
                amountSaved,
                currency
              );
              if (!couponResult.success) {
                console.error(`[MP webhook] ⚠️ Failed to redeem coupon:`, couponResult.error);
              }
            }

            // Upsert enrollment - using publicUserId
            await upsertEnrollment(supabase, publicUserId, course_id, effectiveMonths);
          } else {
            console.error(`[MP webhook] ❌ Missing course data:`, { 
              auth_id: resolvedUserId, 
              publicUserId, 
              course_id, 
              resolvedSlug 
            });
          }
        }
      }

      return { success: true, processed: "payment", id: finalId };
    }

    // === MERCHANT ORDER ===
    if (type === "merchant_order" && finalId) {
      const mo = await getMPMerchantOrder(String(finalId));
      const md = extractMetadata(mo);
      const externalRefMo = md.external_reference || "";
      
      // NUEVO: Buscar datos en mp_course_preferences si es un ID corto (empieza con "mp_")
      // UPGRADE: Buscar datos en mp_subscription_preferences si es un ID corto (empieza con "mpu_")
      let fromDbMo: any = null;
      if (externalRefMo.startsWith("mpu_")) {
        console.log("[MP webhook MO] Looking up upgrade preference:", externalRefMo);
        const { data: prefDataMo, error: prefErrorMo } = await supabase
          .from("mp_subscription_preferences")
          .select("*")
          .eq("id", externalRefMo)
          .maybeSingle();
        
        if (prefDataMo && !prefErrorMo) {
          fromDbMo = {
            user_id: prefDataMo.user_id,
            organization_id: prefDataMo.organization_id,
            plan_slug: prefDataMo.plan_slug,
            billing_period: prefDataMo.billing_period,
            product_type: prefDataMo.product_type || 'subscription_upgrade',
          };
          console.log("[MP webhook MO] Found upgrade preference data:", fromDbMo);
        } else {
          console.warn("[MP webhook MO] ⚠️ No upgrade preference data found:", prefErrorMo);
        }
      } else if (externalRefMo.startsWith("mp_")) {
        const { data: prefDataMo, error: prefErrorMo } = await supabase
          .from("mp_course_preferences")
          .select("*, courses!inner(slug)")
          .eq("id", externalRefMo)
          .maybeSingle();
        
        if (prefDataMo && !prefErrorMo) {
          fromDbMo = {
            user_id: prefDataMo.user_id,
            course_slug: prefDataMo.courses?.slug,
            months: prefDataMo.access_months,
            coupon_code: prefDataMo.coupon_code,
            coupon_id: prefDataMo.coupon_id,
            product_type: 'course',
          };
        } else {
          console.warn("[MP webhook MO] ⚠️ No se encontraron datos en BD:", prefErrorMo);
        }
      }
      
      const fromExt = fromDbMo || decodeExternalReference(externalRefMo);
      const effectiveMonths = md.months ?? fromExt.months ?? 12;
      const resolvedUserId = md.user_id ?? fromExt.user_id ?? null;
      const resolvedSlug =
        md.course_slug ??
        fromExt.course_slug ??
        mo?.items?.[0]?.category_id ??
        null;

      const productType = md.product_type || fromExt.product_type || 'course';
      const organizationId = md.organization_id || fromExt.organization_id;
      const planIdFromMetadata = md.plan_id;
      const planSlug = md.plan_slug || fromExt.plan_slug;
      const billingPeriod = md.billing_period || fromExt.billing_period;
      const couponCode = md.coupon_code || fromExt.coupon_code || null;
      const couponId = md.coupon_id || fromExt.coupon_id || null;

      // CRITICAL: Get user_id for payment record (merchant_order)
      // For subscription_upgrade: user_id from mp_subscription_preferences is ALREADY public.users.id
      // For other types (courses): user_id might be auth_id and needs conversion
      let moPublicUserId: string | null = null;
      
      if (productType === 'subscription_upgrade') {
        // For upgrades, user_id from the preference IS the public.users.id (no conversion needed)
        moPublicUserId = resolvedUserId;
      } else if (resolvedUserId) {
        // For courses and regular subscriptions, convert auth_id to public.users.id
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", resolvedUserId)
          .maybeSingle();

        if (profileError || !userProfile) {
          console.error('[MP webhook] ❌ Failed to resolve auth_id to user_id (MO):', {
            auth_id: resolvedUserId,
            error: profileError
          });
        } else {
          moPublicUserId = userProfile.id;
        }
      }

      // ¿Hay pago aprobado?
      const approved = Array.isArray(mo?.payments)
        ? mo.payments.some((p: any) => String(p?.status) === "approved")
        : false;

      const orderId = String(mo?.id ?? "");
      const amount = Number(mo?.total_amount ?? 0);

      // 1. Insertar en payment_events
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: orderId,
        providerEventType: "merchant_order.webhook",
        status: "PROCESSED",
        rawPayload: mo,
        orderId: orderId,
        customId: md.external_reference ?? null,
        userHint: resolvedUserId,
        courseHint: resolvedSlug,
        providerPaymentId: null,
        amount: amount || null,
        currency: null,
      });

      // 2. Si está aprobado, procesar según product_type
      if (approved) {
        const approvedPayment = mo?.payments?.find((p: any) => String(p?.status) === "approved");
        const providerPaymentId = approvedPayment ? String(approvedPayment.id) : null;

        if (providerPaymentId) {
          // UPGRADE: Handle subscription_upgrade (MO) - just record payment, actual upgrade happens in handleUpgradeReturn
          if (productType === 'subscription_upgrade') {
            console.log("[MP webhook MO] Processing subscription upgrade payment:", {
              externalRef: externalRefMo,
              organizationId,
              planSlug,
              amount,
            });
            
            let resolvedPlanId: string | null = null;
            if (planSlug) {
              resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
            }
            
            const upgradePaymentResult = await insertPayment(supabase, "mercadopago", {
              providerPaymentId: providerPaymentId,
              userId: moPublicUserId,
              amount: amount || null,
              currency: "ARS",
              status: "completed",
              productType: 'subscription_upgrade',
              organizationId: organizationId || undefined,
              productId: resolvedPlanId || undefined,
            });
            
            if (upgradePaymentResult.inserted) {
              console.log("[MP webhook MO] ✅ Upgrade payment recorded:", upgradePaymentResult.paymentId);
            } else {
              console.log("[MP webhook MO] Upgrade payment already existed (duplicate webhook)");
            }
            
            return { success: true, processed: "subscription_upgrade_mo", id: finalId };
          }
          
          if (productType === 'subscription') {
            if (organizationId && billingPeriod) {
              let resolvedPlanId = planIdFromMetadata;
              
              if (!resolvedPlanId && planSlug) {
                resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
                
                if (!resolvedPlanId) {
                  console.error(`[MP webhook] ❌ Failed to resolve plan_id from slug "${planSlug}"`);
                  return { success: true, processed: "error", id: 'plan_not_found' };
                }
              }
              
              if (!resolvedPlanId) {
                console.error(`[MP webhook] ❌ Missing both plan_id and plan_slug`);
                return { success: true, processed: "error", id: 'missing_plan_data' };
              }
              
              // Insert payment (subscription) - userId is REQUIRED even for subscriptions
              const moSubPaymentResult = await insertPayment(supabase, "mercadopago", {
                providerPaymentId: providerPaymentId,
                userId: moPublicUserId, // ✅ CRITICAL: Required for payments table
                amount: amount || null,
                currency: "ARS",
                status: "completed",
                productType: 'subscription',
                organizationId: organizationId,
                productId: resolvedPlanId,
              });

              // IDEMPOTENT: Only upgrade organization plan if payment was NEWLY inserted
              if (moSubPaymentResult.inserted && moSubPaymentResult.paymentId) {
                await upgradeOrganizationPlan(supabase, {
                  organizationId: organizationId,
                  planId: resolvedPlanId,
                  billingPeriod: billingPeriod as 'monthly' | 'annual',
                  paymentId: moSubPaymentResult.paymentId, // ✅ UUID from payments table
                  amount: amount,
                  currency: "ARS",
                  userId: moPublicUserId, // ✅ For Founders Program
                });
              } else if (!moSubPaymentResult.inserted) {
                // Duplicate merchant_order webhook - payment already processed
              } else {
                console.error(`[MP webhook] ❌ No payment ID returned for subscription (MO)`);
              }
            } else {
              console.error(`[MP webhook] ❌ Missing subscription data in merchant order:`, { organizationId, billingPeriod });
            }
          } else {
            // course_id si podemos
            let course_id: string | null = null;
            if (resolvedSlug) course_id = await getCourseIdBySlug(supabase, resolvedSlug);

            if (moPublicUserId && course_id) {
              const paymentResult = await insertPayment(supabase, "mercadopago", {
                providerPaymentId: providerPaymentId,
                userId: moPublicUserId,
                courseId: course_id,
                amount: amount || null,
                currency: "ARS",
                status: "completed",
                productType: 'course',
                couponCode: couponCode,
                couponId: couponId,
              });

              // IDEMPOTENT: Only mark coupon as used if payment was NEWLY inserted
              if (paymentResult.inserted && paymentResult.paymentId && couponId && couponCode) {
                const amountSaved = 0; // TODO: Store original_price in metadata to calculate discount
                const couponResult = await markCouponAsUsed(
                  supabase,
                  couponId,
                  moPublicUserId,
                  course_id,
                  paymentResult.paymentId, // ✅ Usar UUID de payments table, no el ID de MP
                  amountSaved,
                  "ARS"
                );
                if (!couponResult.success) {
                  console.error(`[MP webhook] ⚠️ Failed to redeem coupon (MO):`, couponResult.error);
                }
              }

              await upsertEnrollment(supabase, moPublicUserId, course_id, effectiveMonths);
            } else {
              console.error(`[MP webhook] ❌ Missing course data in merchant order:`, { 
                auth_id: resolvedUserId, 
                moPublicUserId, 
                course_id, 
                resolvedSlug 
              });
            }
          }
        }
      }

      return { success: true, processed: "merchant_order", id: finalId };
    }

    // === SUBSCRIPTION PREAPPROVAL (Recurring Subscriptions) ===
    if ((type === "subscription_preapproval" || type === "preapproval") && finalId) {
      console.log("[MP webhook] Processing preapproval event:", finalId);
      
      const preapprovalResult = await getMPPreapproval(String(finalId));
      
      if (!preapprovalResult.success) {
        console.error("[MP webhook] Failed to get preapproval:", preapprovalResult.error);
        await logPaymentEvent(supabase, "mercadopago", {
          providerEventId: finalId,
          providerEventType: "preapproval.error",
          status: "ERROR",
          rawPayload: { body, error: preapprovalResult.error },
          orderId: null,
          customId: null,
          userHint: null,
          courseHint: null,
          providerPaymentId: null,
          amount: null,
          currency: null,
        });
        return { success: true, processed: "preapproval_error", id: finalId };
      }
      
      const preapproval = preapprovalResult.preapproval;
      const preapprovalStatus = preapproval.status; // 'pending', 'authorized', 'paused', 'cancelled'
      const externalRef = preapproval.external_reference || "";
      
      // NEW: Lookup subscription data from mp_subscription_preferences if short ID format (mps_...)
      let fromDb: any = null;
      if (externalRef.startsWith("mps_")) {
        console.log("[MP webhook preapproval] Looking up subscription preference:", externalRef);
        const { data: prefData, error: prefError } = await supabase
          .from("mp_subscription_preferences")
          .select("*")
          .eq("id", externalRef)
          .maybeSingle();
        
        if (prefData && !prefError) {
          fromDb = {
            user_id: prefData.user_id,
            organization_id: prefData.organization_id,
            plan_slug: prefData.plan_slug,
            billing_period: prefData.billing_period,
            product_type: 'subscription',
          };
          console.log("[MP webhook preapproval] Found preference data:", fromDb);
        } else {
          console.warn("[MP webhook preapproval] ⚠️ No preference data found:", prefError);
        }
      }
      
      // Fallback to old Base64 method if no DB data
      const fromExt = fromDb || decodeExternalReference(externalRef);
      
      const resolvedUserId = fromExt.user_id || null;
      const organizationId = fromExt.organization_id;
      const planSlug = fromExt.plan_slug;
      const billingPeriod = fromExt.billing_period;
      const amount = preapproval.auto_recurring?.transaction_amount || 0;
      const currency = preapproval.auto_recurring?.currency_id || "ARS";
      
      console.log("[MP webhook preapproval] Resolved data:", {
        externalRef,
        resolvedUserId,
        organizationId,
        planSlug,
        billingPeriod,
        preapprovalStatus,
      });
      
      // Resolve public user ID
      let publicUserId: string | null = null;
      if (resolvedUserId) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", resolvedUserId)
          .maybeSingle();
        publicUserId = userProfile?.id || null;
      }
      
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: finalId,
        providerEventType: `preapproval.${preapprovalStatus}`,
        status: "PROCESSED",
        rawPayload: preapproval,
        orderId: null,
        customId: externalRef,
        userHint: resolvedUserId,
        courseHint: null,
        providerPaymentId: null,
        amount: amount || null,
        currency: currency,
      });
      
      // Handle authorized preapproval (user confirmed recurring subscription)
      if (preapprovalStatus === "authorized" && organizationId && planSlug && billingPeriod) {
        let resolvedPlanId = await getPlanIdBySlug(supabase, planSlug);
        
        if (!resolvedPlanId) {
          console.error(`[MP webhook preapproval] Plan not found: ${planSlug}`);
          return { success: true, processed: "preapproval_plan_not_found", id: finalId };
        }
        
        // Check if subscription already exists to avoid duplicates
        const { data: existingSub } = await supabase
          .from("organization_subscriptions")
          .select("id, provider_subscription_id")
          .eq("organization_id", organizationId)
          .eq("plan_id", resolvedPlanId)
          .eq("status", "active")
          .maybeSingle();
        
        if (existingSub && existingSub.provider_subscription_id === finalId) {
          console.log(`[MP webhook preapproval] Subscription already exists: ${existingSub.id}`);
          return { success: true, processed: "preapproval_duplicate", id: finalId };
        }
        
        // Insert payment for initial subscription
        const paymentResult = await insertPayment(supabase, "mercadopago", {
          providerPaymentId: `preapproval_${finalId}`,
          userId: publicUserId,
          amount: amount || null,
          currency: currency,
          status: "completed",
          productType: 'subscription',
          organizationId: organizationId,
          productId: resolvedPlanId,
        });
        
        if (paymentResult.inserted && paymentResult.paymentId) {
          await upgradeOrganizationPlan(supabase, {
            organizationId: organizationId,
            planId: resolvedPlanId,
            billingPeriod: billingPeriod as 'monthly' | 'annual',
            paymentId: paymentResult.paymentId,
            amount: amount,
            currency: currency,
            userId: publicUserId,
            providerSubscriptionId: finalId, // Store MP preapproval ID for renewals
          });
          
          console.log(`[MP webhook preapproval] ✅ Subscription activated for org ${organizationId}`);
        }
      }
      
      return { success: true, processed: "preapproval", id: finalId };
    }
    
    // === SUBSCRIPTION AUTHORIZED PAYMENT (Automatic Renewal) ===
    if (type === "subscription_authorized_payment" && finalId) {
      console.log("[MP webhook] Processing subscription renewal payment:", finalId);
      
      // Get payment details
      const pay = await getMPPayment(String(finalId));
      const preapprovalId = pay.preapproval_id;
      const status = pay.status;
      const amount = pay.transaction_amount || 0;
      const currency = pay.currency_id || "ARS";
      
      await logPaymentEvent(supabase, "mercadopago", {
        providerEventId: finalId,
        providerEventType: "subscription_authorized_payment",
        status: "PROCESSED",
        rawPayload: pay,
        orderId: null,
        customId: preapprovalId,
        userHint: null,
        courseHint: null,
        providerPaymentId: String(finalId),
        amount: amount || null,
        currency: currency,
      });
      
      if (status === "approved" && preapprovalId) {
        // Find existing subscription by provider_subscription_id
        const { data: existingSub, error: subError } = await supabase
          .from("organization_subscriptions")
          .select("id, organization_id, plan_id, billing_period, expires_at")
          .eq("provider_subscription_id", preapprovalId)
          .eq("status", "active")
          .maybeSingle();
        
        if (subError || !existingSub) {
          console.warn(`[MP webhook renewal] No active subscription found for preapproval ${preapprovalId}`);
          return { success: true, processed: "renewal_no_subscription", id: finalId };
        }
        
        // Check for duplicate payment
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("provider_payment_id", String(finalId))
          .maybeSingle();
        
        if (existingPayment) {
          console.log(`[MP webhook renewal] Payment already processed: ${finalId}`);
          return { success: true, processed: "renewal_duplicate", id: finalId };
        }
        
        // Insert renewal payment
        const { data: newPayment } = await supabase
          .from("payments")
          .insert({
            provider: "mercadopago",
            provider_payment_id: String(finalId),
            user_id: null, // Renewal doesn't need user_id
            amount: amount,
            currency: currency,
            status: "completed",
            product_type: "subscription",
            organization_id: existingSub.organization_id,
            product_id: existingSub.plan_id,
          })
          .select()
          .single();
        
        // Extend subscription expiration
        const currentExpires = new Date(existingSub.expires_at || new Date());
        const newExpires = new Date(currentExpires);
        if (existingSub.billing_period === 'monthly') {
          newExpires.setMonth(newExpires.getMonth() + 1);
        } else {
          newExpires.setFullYear(newExpires.getFullYear() + 1);
        }
        
        const { error: updateError } = await supabase
          .from("organization_subscriptions")
          .update({
            expires_at: newExpires.toISOString(),
            payment_id: newPayment?.id,
          })
          .eq("id", existingSub.id);
        
        if (updateError) {
          console.error(`[MP webhook renewal] Failed to extend subscription:`, updateError);
        } else {
          console.log(`[MP webhook renewal] ✅ Subscription ${existingSub.id} renewed until ${newExpires.toISOString()}`);
        }
      }
      
      return { success: true, processed: "subscription_renewal", id: finalId };
    }

    // === OTROS / DESCONOCIDOS ===
    await logPaymentEvent(supabase, "mercadopago", {
      providerEventId: finalId ?? null,
      providerEventType: type || "unknown.webhook",
      status: "PROCESSED",
      rawPayload: body,
      orderId: null,
      customId: null,
      userHint: null,
      courseHint: null,
      providerPaymentId: null,
      amount: null,
      currency: null,
    });

    return { success: true, processed: "received", id: type ?? 'null' };
  } catch (e: any) {
    console.error("[mp/webhook] error:", e);
    return { success: false, error: e.message || String(e) };
  }
}
