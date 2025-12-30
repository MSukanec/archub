import type { Request, Response } from "express";
import { supabaseAdmin } from "../../lib/supabase/admin.js";
import { verifyAdminUser, HttpError } from "../../lib/auth/helpers.js";
import { refreshPayPalModeCache } from "../../lib/handlers/checkout/paypal/config.js";
import crypto from "crypto";
import { 
  executeOpsRepairAction as executeRepairActionService,
  getAvailableRepairActions 
} from "../../lib/services/ops-repair.service.js";

function generateFingerprint(type: string, ...parts: string[]): string {
  const data = [type, ...parts.filter(Boolean)].join("|");
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 32);
}

interface CheckResult {
  alerts_created: number;
  alerts_skipped: number;
  items_scanned: number;
  errors: string[];
}

async function checkPaymentPlanMismatch(): Promise<{ results: any[]; stats: CheckResult }> {
  const stats: CheckResult = { alerts_created: 0, alerts_skipped: 0, items_scanned: 0, errors: [] };
  const results: any[] = [];

  try {
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        organization_id,
        user_id,
        product_type,
        product_id,
        status,
        provider,
        provider_payment_id,
        amount,
        currency,
        created_at,
        organizations!payments_organization_id_fkey(id, name, plan_id, plans!organizations_plan_id_fkey(id, slug, name))
      `)
      .eq("status", "approved")
      .in("product_type", ["subscription", "plan_upgrade"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42703" || error.code === "42P01") {
        console.warn("[OpsCenter] checkPaymentPlanMismatch: Table or column not found, skipping check");
        return { results, stats };
      }
      stats.errors.push(`Error fetching payments: ${error.message}`);
      return { results, stats };
    }

    stats.items_scanned = payments?.length || 0;

    for (const payment of payments || []) {
      const org = payment.organizations as any;
      if (!org) continue;

      const orgPlanId = org.plan_id;
      const purchasedPlanId = payment.product_id;

      if (orgPlanId !== purchasedPlanId) {
        const fingerprint = generateFingerprint("payment.plan_mismatch", payment.id, purchasedPlanId);

        const { data: existing } = await supabaseAdmin
          .from("ops_alerts")
          .select("id")
          .eq("fingerprint", fingerprint)
          .in("status", ["open", "ack"])
          .maybeSingle();

        if (existing) {
          stats.alerts_skipped++;
          continue;
        }

        const { error: insertError } = await supabaseAdmin
          .from("ops_alerts")
          .insert({
            severity: "high",
            alert_type: "payment.approved_but_not_applied",
            title: `Pago aprobado pero plan no aplicado`,
            description: `Organización "${org.name}" pagó plan ${purchasedPlanId} pero tiene plan ${orgPlanId}`,
            organization_id: payment.organization_id,
            user_id: payment.user_id,
            provider: payment.provider,
            provider_payment_id: payment.provider_payment_id,
            payment_id: payment.id,
            fingerprint,
            evidence: {
              payment_id: payment.id,
              purchased_plan_id: purchasedPlanId,
              current_plan_id: orgPlanId,
              current_plan_name: org.plans?.name || "unknown",
              amount: payment.amount,
              currency: payment.currency,
              payment_date: payment.created_at,
            },
          });

        if (insertError) {
          stats.errors.push(`Error creating alert for payment ${payment.id}: ${insertError.message}`);
        } else {
          stats.alerts_created++;
          results.push({
            type: "payment.approved_but_not_applied",
            payment_id: payment.id,
            org_name: org.name,
          });
        }
      }
    }
  } catch (err: any) {
    stats.errors.push(`Unexpected error in checkPaymentPlanMismatch: ${err.message}`);
  }

  return { results, stats };
}

async function checkStuckPaymentEvents(): Promise<{ results: any[]; stats: CheckResult }> {
  const stats: CheckResult = { alerts_created: 0, alerts_skipped: 0, items_scanned: 0, errors: [] };
  const results: any[] = [];

  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: events, error } = await supabaseAdmin
      .from("payment_events")
      .select("id, provider, provider_event_type, provider_payment_id, status, custom_id, payment_id, created_at")
      .eq("status", "RECEIVED")
      .lt("created_at", tenMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42703") {
        console.warn("[OpsCenter] checkStuckPaymentEvents: Table or column not found, skipping check");
        return { results, stats };
      }
      stats.errors.push(`Error fetching payment events: ${error.message}`);
      return { results, stats };
    }

    stats.items_scanned = events?.length || 0;

    for (const event of events || []) {
      const fingerprint = generateFingerprint("event.stuck", event.id);

      const { data: existing } = await supabaseAdmin
        .from("ops_alerts")
        .select("id")
        .eq("fingerprint", fingerprint)
        .in("status", ["open", "ack"])
        .maybeSingle();

      if (existing) {
        stats.alerts_skipped++;
        continue;
      }

      const { error: insertError } = await supabaseAdmin
        .from("ops_alerts")
        .insert({
          severity: "high",
          alert_type: "webhook.stuck_received",
          title: `Webhook atascado en RECEIVED`,
          description: `Evento ${event.provider_event_type} de ${event.provider} sin procesar hace más de 10 min`,
          provider: event.provider,
          provider_payment_id: event.provider_payment_id,
          event_id: event.id,
          fingerprint,
          evidence: {
            event_id: event.id,
            provider: event.provider,
            event_type: event.provider_event_type,
            custom_id: event.custom_id,
            payment_id: event.payment_id,
            received_at: event.created_at,
          },
        });

      if (insertError) {
        stats.errors.push(`Error creating alert for event ${event.id}: ${insertError.message}`);
      } else {
        stats.alerts_created++;
        results.push({
          type: "webhook.stuck_received",
          event_id: event.id,
          provider: event.provider,
        });
      }
    }
  } catch (err: any) {
    stats.errors.push(`Unexpected error in checkStuckPaymentEvents: ${err.message}`);
  }

  return { results, stats };
}

async function checkFailedSystemJobs(): Promise<{ results: any[]; stats: CheckResult }> {
  const stats: CheckResult = { alerts_created: 0, alerts_skipped: 0, items_scanned: 0, errors: [] };
  const results: any[] = [];

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: jobs, error } = await supabaseAdmin
      .from("system_job_logs")
      .select("id, job_type, status, error_message, created_at")
      .in("status", ["error", "failed"])
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42703" || error.code === "42P01") {
        console.warn("[OpsCenter] checkFailedSystemJobs: Table or column not found, skipping check");
        return { results, stats };
      }
      stats.errors.push(`Error fetching system job logs: ${error.message}`);
      return { results, stats };
    }

    stats.items_scanned = jobs?.length || 0;

    for (const job of jobs || []) {
      const fingerprint = generateFingerprint("job.failed", job.id);

      const { data: existing } = await supabaseAdmin
        .from("ops_alerts")
        .select("id")
        .eq("fingerprint", fingerprint)
        .in("status", ["open", "ack"])
        .maybeSingle();

      if (existing) {
        stats.alerts_skipped++;
        continue;
      }

      const { error: insertError } = await supabaseAdmin
        .from("ops_alerts")
        .insert({
          severity: "medium",
          alert_type: "job.failed",
          title: `Job del sistema falló: ${job.job_type}`,
          description: job.error_message || `Job ${job.job_type} terminó con status ${job.status}`,
          fingerprint,
          evidence: {
            job_id: job.id,
            job_type: job.job_type,
            status: job.status,
            error_message: job.error_message,
            failed_at: job.created_at,
          },
        });

      if (insertError) {
        stats.errors.push(`Error creating alert for job ${job.id}: ${insertError.message}`);
      } else {
        stats.alerts_created++;
        results.push({
          type: "job.failed",
          job_id: job.id,
          job_type: job.job_type,
        });
      }
    }
  } catch (err: any) {
    stats.errors.push(`Unexpected error in checkFailedSystemJobs: ${err.message}`);
  }

  return { results, stats };
}

async function checkSystemIntegrity(): Promise<{ results: any[]; stats: CheckResult }> {
  const stats: CheckResult = { alerts_created: 0, alerts_skipped: 0, items_scanned: 0, errors: [] };
  const results: any[] = [];

  try {
    const { data: systemErrors, error } = await supabaseAdmin
      .from("system_errors")
      .select("id, entity, operation, error_message, severity, context, occurred_at, resolved_at")
      .eq("severity", "critical")
      .is("resolved_at", null)
      .order("occurred_at", { ascending: false })
      .limit(200);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42703" || error.code === "42P01") {
        console.warn("[OpsCenter] checkSystemIntegrity: Table or column not found, skipping check");
        return { results, stats };
      }
      stats.errors.push(`Error fetching system_errors: ${error.message}`);
      return { results, stats };
    }

    stats.items_scanned = systemErrors?.length || 0;

    interface SystemError {
      id: string;
      entity: string | null;
      operation: string | null;
      error_message: string | null;
      severity: string | null;
      context: Record<string, any> | null;
      occurred_at: string | null;
      resolved_at: string | null;
    }

    const grouped: Record<string, SystemError[]> = {};
    for (const err of (systemErrors || []) as SystemError[]) {
      const key = `${err.entity || "unknown"}|${err.operation || "unknown"}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(err);
    }

    for (const groupKey of Object.keys(grouped)) {
      const errors = grouped[groupKey];
      const [entity, operation] = groupKey.split("|");
      const latestError = errors[0];
      const errorCount = errors.length;

      const fingerprint = generateFingerprint("system.integrity.failed", entity, operation);

      const { data: existing } = await supabaseAdmin
        .from("ops_alerts")
        .select("id")
        .eq("fingerprint", fingerprint)
        .in("status", ["open", "ack"])
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("ops_alerts")
          .update({
            evidence: {
              entity,
              operation,
              error_count: errorCount,
              error_ids: errors.map((e: SystemError) => e.id),
              latest_error: {
                id: latestError.id,
                error_message: latestError.error_message,
                occurred_at: latestError.occurred_at,
                context: latestError.context,
              },
              all_errors: errors.slice(0, 10).map((e: SystemError) => ({
                id: e.id,
                error_message: e.error_message,
                occurred_at: e.occurred_at,
                context: e.context,
              })),
            },
          })
          .eq("id", existing.id);

        stats.alerts_skipped++;
        continue;
      }

      const { error: insertError } = await supabaseAdmin
        .from("ops_alerts")
        .insert({
          severity: "critical",
          alert_type: "system.integrity.failed",
          title: `Operaciones críticas bloqueadas`,
          description: `${errorCount} error(es) crítico(s) en ${entity} → ${operation}`,
          fingerprint,
          evidence: {
            entity,
            operation,
            error_count: errorCount,
            error_ids: errors.map((e: SystemError) => e.id),
            latest_error: {
              id: latestError.id,
              error_message: latestError.error_message,
              occurred_at: latestError.occurred_at,
              context: latestError.context,
            },
            all_errors: errors.slice(0, 10).map((e: SystemError) => ({
              id: e.id,
              error_message: e.error_message,
              occurred_at: e.occurred_at,
              context: e.context,
            })),
          },
        });

      if (insertError) {
        stats.errors.push(`Error creating alert for ${groupKey}: ${insertError.message}`);
      } else {
        stats.alerts_created++;
        results.push({
          type: "system.integrity.failed",
          entity,
          operation,
          error_count: errorCount,
        });
      }
    }
  } catch (err: any) {
    stats.errors.push(`Unexpected error in checkSystemIntegrity: ${err.message}`);
  }

  return { results, stats };
}

export async function runOpsChecks(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    await verifyAdminUser(req.headers.authorization);

    console.log("[OpsCenter] Running ops checks...");

    const [paymentCheck, eventCheck, jobCheck, integrityCheck] = await Promise.all([
      checkPaymentPlanMismatch(),
      checkStuckPaymentEvents(),
      checkFailedSystemJobs(),
      checkSystemIntegrity(),
    ]);

    const totalCreated = paymentCheck.stats.alerts_created + eventCheck.stats.alerts_created + jobCheck.stats.alerts_created + integrityCheck.stats.alerts_created;
    const totalScanned = paymentCheck.stats.items_scanned + eventCheck.stats.items_scanned + jobCheck.stats.items_scanned + integrityCheck.stats.items_scanned;
    const allErrors = [...paymentCheck.stats.errors, ...eventCheck.stats.errors, ...jobCheck.stats.errors, ...integrityCheck.stats.errors];

    const duration = Date.now() - startTime;
    const runStatus = allErrors.length > 0 ? "warning" : "success";

    const { error: logError } = await supabaseAdmin
      .from("ops_check_runs")
      .insert({
        check_suite: "ops_core",
        status: runStatus,
        duration_ms: duration,
        stats: {
          alerts_opened: totalCreated,
          scanned: totalScanned,
          checks: {
            payment_mismatch: paymentCheck.stats,
            stuck_events: eventCheck.stats,
            failed_jobs: jobCheck.stats,
            system_integrity: integrityCheck.stats,
          },
        },
        error_message: allErrors.length > 0 ? allErrors.join("; ") : null,
      });

    if (logError) {
      console.error("[OpsCenter] Error logging check run:", logError);
    }

    if (totalCreated > 0) {
      const { data: criticalAlerts } = await supabaseAdmin
        .from("ops_alerts")
        .select("id, severity, title")
        .in("severity", ["high", "critical"])
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      if (criticalAlerts && criticalAlerts.length > 0) {
        try {
          await fetch(`${process.env.VITE_APP_URL || "http://localhost:5000"}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notifyAdmin: true,
              subject: `[OpsCenter] ${totalCreated} nuevas alertas detectadas`,
              text: `Se detectaron ${totalCreated} nuevas alertas en el sistema.\n\nAlertas críticas/altas:\n${criticalAlerts.map((a) => `- ${a.title}`).join("\n")}\n\nRevisa el Operations Center para más detalles.`,
            }),
          });
          console.log("[OpsCenter] Admin notification sent");
        } catch (emailErr) {
          console.error("[OpsCenter] Error sending admin notification:", emailErr);
        }
      }
    }

    console.log(`[OpsCenter] Checks completed in ${duration}ms. Created ${totalCreated} alerts.`);

    return res.json({
      success: true,
      duration_ms: duration,
      stats: {
        total_created: totalCreated,
        total_scanned: totalScanned,
        checks: {
          payment_mismatch: paymentCheck.stats,
          stuck_events: eventCheck.stats,
          failed_jobs: jobCheck.stats,
          system_integrity: integrityCheck.stats,
        },
      },
      errors: allErrors,
    });
  } catch (error: any) {
    console.error("[OpsCenter] Error running checks:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getOpsAlerts(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);

    const status = req.query.status as string | undefined;
    const alertType = req.query.alert_type as string | undefined;
    const severity = req.query.severity as string | undefined;

    let query = supabaseAdmin
      .from("ops_alerts")
      .select(`
        *,
        organizations(id, name),
        users!ops_alerts_user_id_fkey(id, email, full_name),
        payments(id, amount, currency, status),
        payment_events(id, provider_event_type, status)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq("status", status);
    }
    if (alertType) {
      query = query.eq("alert_type", alertType);
    }
    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error("[OpsCenter] Error fetching alerts:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(alerts || []);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function updateOpsAlert(req: Request, res: Response) {
  try {
    const user = await verifyAdminUser(req.headers.authorization);
    const { id } = req.params;
    const { action } = req.body;

    if (!["ack", "resolve", "dismiss", "reopen"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updateData: Record<string, any> = {};

    switch (action) {
      case "ack":
        updateData.status = "ack";
        updateData.ack_by = user.id;
        updateData.ack_at = new Date().toISOString();
        break;
      case "resolve":
        updateData.status = "resolved";
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
        break;
      case "dismiss":
        updateData.status = "dismissed";
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
        break;
      case "reopen":
        updateData.status = "open";
        updateData.ack_by = null;
        updateData.ack_at = null;
        updateData.resolved_by = null;
        updateData.resolved_at = null;
        break;
    }

    const { error } = await supabaseAdmin.from("ops_alerts").update(updateData).eq("id", id);

    if (error) {
      console.error("[OpsCenter] Error updating alert:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getOpsCheckRuns(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);

    const { data: runs, error } = await supabaseAdmin
      .from("ops_check_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[OpsCenter] Error fetching check runs:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(runs || []);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getOpsRunbooks(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);

    const { data: runbooks, error } = await supabaseAdmin
      .from("ops_runbooks")
      .select("*")
      .order("alert_type", { ascending: true });

    if (error) {
      console.error("[OpsCenter] Error fetching runbooks:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(runbooks || []);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function upsertOpsRunbook(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);

    const { alert_type, title, steps_md, links } = req.body;

    if (!alert_type || !title || !steps_md) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { error } = await supabaseAdmin.from("ops_runbooks").upsert(
      {
        alert_type,
        title,
        steps_md,
        links: links || [],
      },
      { onConflict: "alert_type" }
    );

    if (error) {
      console.error("[OpsCenter] Error upserting runbook:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

interface RepairAction {
  id: string;
  label: string;
  description: string;
  dangerous: boolean;
  requiredEvidence?: string[];
}

const REPAIR_ACTIONS: Record<string, RepairAction[]> = {
  "system.integrity.failed": [
    {
      id: "acknowledge_alert",
      label: "Reconocer Alerta",
      description: "Marca la alerta como reconocida. El equipo está al tanto del problema.",
      dangerous: false,
    },
    {
      id: "mark_resolved",
      label: "Marcar como Resuelta",
      description: "Indica que el problema subyacente fue solucionado manualmente.",
      dangerous: false,
    },
    {
      id: "test_signup_flow",
      label: "Probar Flujo de Registro (Dry-Run)",
      description: "Ejecuta una validación del flujo de registro sin crear usuarios reales.",
      dangerous: false,
    },
  ],
  "system.signup.blocked": [
    {
      id: "acknowledge_alert",
      label: "Reconocer Alerta",
      description: "Marca la alerta como reconocida. El equipo está al tanto del problema.",
      dangerous: false,
    },
    {
      id: "mark_resolved",
      label: "Marcar como Resuelta",
      description: "Indica que el problema subyacente fue solucionado manualmente.",
      dangerous: false,
    },
    {
      id: "test_signup_flow",
      label: "Probar Flujo de Registro (Dry-Run)",
      description: "Ejecuta una validación del flujo de registro sin crear usuarios reales.",
      dangerous: false,
    },
  ],
  "payment.approved_but_not_applied": [
    {
      id: "acknowledge_alert",
      label: "Reconocer Alerta",
      description: "Marca la alerta como reconocida. El equipo está investigando.",
      dangerous: false,
    },
    {
      id: "apply_plan_to_org",
      label: "Aplicar Plan a la Organización",
      description: "Actualiza el plan de la organización al plan que pagaron.",
      dangerous: false,
      requiredEvidence: ["organization_id", "purchased_plan_id"],
    },
    {
      id: "create_missing_subscription",
      label: "Crear Suscripción Faltante",
      description: "Crea el registro de suscripción que debería haberse creado con el pago.",
      dangerous: false,
      requiredEvidence: ["organization_id", "payment_id"],
    },
    {
      id: "mark_resolved",
      label: "Marcar como Resuelta",
      description: "Indica que el problema fue solucionado y cierra la alerta.",
      dangerous: false,
    },
  ],
  "payment.approved_not_applied": [
    {
      id: "acknowledge_alert",
      label: "Reconocer Alerta",
      description: "Marca la alerta como reconocida. El equipo está investigando.",
      dangerous: false,
    },
    {
      id: "apply_plan_to_org",
      label: "Aplicar Plan a la Organización",
      description: "Actualiza el plan de la organización al plan que pagaron.",
      dangerous: false,
      requiredEvidence: ["organization_id", "purchased_plan_id"],
    },
    {
      id: "create_missing_subscription",
      label: "Crear Suscripción Faltante",
      description: "Crea el registro de suscripción que debería haberse creado con el pago.",
      dangerous: false,
      requiredEvidence: ["organization_id", "payment_id"],
    },
    {
      id: "mark_resolved",
      label: "Marcar como Resuelta",
      description: "Indica que el problema fue solucionado y cierra la alerta.",
      dangerous: false,
    },
  ],
  "webhook.stuck_received": [
    {
      id: "acknowledge_alert",
      label: "Reconocer Alerta",
      description: "Marca la alerta como reconocida.",
      dangerous: false,
    },
    {
      id: "retry_webhook_processing",
      label: "Reintentar Procesamiento",
      description: "Marca el evento para reprocesamiento en el siguiente ciclo.",
      dangerous: false,
    },
    {
      id: "mark_resolved",
      label: "Marcar como Resuelta",
      description: "Cierra la alerta sin más acción.",
      dangerous: false,
    },
  ],
  "job.failed": [
    {
      id: "acknowledge_alert",
      label: "Reconocer Alerta",
      description: "Marca la alerta como reconocida.",
      dangerous: false,
    },
    {
      id: "mark_resolved",
      label: "Marcar como Resuelta",
      description: "Cierra la alerta tras verificar que el job se ejecutó correctamente.",
      dangerous: false,
    },
  ],
};

export async function getRepairActions(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    const { alertType } = req.params;

    const actions = REPAIR_ACTIONS[alertType] || [
      {
        id: "acknowledge_alert",
        label: "Reconocer Alerta",
        description: "Marca la alerta como reconocida.",
        dangerous: false,
      },
      {
        id: "mark_resolved",
        label: "Marcar como Resuelta",
        description: "Cierra la alerta.",
        dangerous: false,
      },
    ];

    return res.json({ actions });
  } catch (error: any) {
    console.error("[OpsCenter] Error getting repair actions:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function executeRepairAction(req: Request, res: Response) {
  try {
    const user = await verifyAdminUser(req.headers.authorization);
    const { id: alertId } = req.params;
    const { actionId } = req.body;

    if (!actionId) {
      return res.status(400).json({ error: "actionId is required" });
    }

    const result = await executeRepairActionService(alertId, actionId, user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error("[OpsCenter] Error executing repair action:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getRepairLogs(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    const { alertId } = req.query;

    let query = supabaseAdmin
      .from("ops_repair_logs")
      .select(`
        *,
        users!ops_repair_logs_executed_by_fkey(id, email, full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (alertId) {
      query = query.eq("alert_id", alertId);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("[OpsCenter] Error fetching repair logs:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(logs || []);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function getOpsStats(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);

    const [alertsResult, runsResult] = await Promise.all([
      supabaseAdmin
        .from("ops_alerts")
        .select("status, severity", { count: "exact" }),
      supabaseAdmin
        .from("ops_check_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const alerts = alertsResult.data || [];
    const lastRun = runsResult.data;

    const stats = {
      open: alerts.filter((a) => a.status === "open").length,
      ack: alerts.filter((a) => a.status === "ack").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
      critical: alerts.filter((a) => a.severity === "critical" && a.status === "open").length,
      high: alerts.filter((a) => a.severity === "high" && a.status === "open").length,
      last_run: lastRun,
    };

    return res.json(stats);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

// ==================== FEATURE FLAGS ====================

export async function getFeatureFlags(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);

    const { data: flags, error } = await supabaseAdmin
      .from("feature_flags")
      .select("*")
      .order("category")
      .order("key");

    if (error) {
      console.error("[OpsCenter] Error fetching feature flags:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(flags || []);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function updateFeatureFlag(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    const { id } = req.params;
    const { value } = req.body;

    if (typeof value !== "boolean") {
      return res.status(400).json({ error: "value must be a boolean" });
    }

    // Fetch the flag to get its key
    const { data: existingFlag, error: fetchError } = await supabaseAdmin
      .from("feature_flags")
      .select("key")
      .eq("id", id)
      .single();

    if (fetchError || !existingFlag) {
      console.error("[OpsCenter] Error fetching flag:", fetchError);
      return res.status(404).json({ error: "Flag not found" });
    }

    const { data: flag, error } = await supabaseAdmin
      .from("feature_flags")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[OpsCenter] Error updating feature flag:", error);
      return res.status(500).json({ error: error.message });
    }

    // Refresh PayPal cache if updating paypal_test_mode flag
    if (existingFlag.key === "paypal_test_mode") {
      console.log("[OpsCenter] Refreshing PayPal test mode cache after flag update");
      refreshPayPalModeCache();
    }

    return res.json(flag);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function createFeatureFlag(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    const { key, value, description, category } = req.body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "key is required" });
    }

    const { data: flag, error } = await supabaseAdmin
      .from("feature_flags")
      .insert({
        key,
        value: value ?? true,
        description: description || null,
        category: category || "general",
      })
      .select()
      .single();

    if (error) {
      console.error("[OpsCenter] Error creating feature flag:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(flag);
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function deleteFeatureFlag(req: Request, res: Response) {
  try {
    await verifyAdminUser(req.headers.authorization);
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("feature_flags")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[OpsCenter] Error deleting feature flag:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error("[OpsCenter] Error:", error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal error" });
  }
}
