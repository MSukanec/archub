import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { insertPersonnelRatesSchema } from "../../shared/schema";

/**
 * Register personnel-related endpoints (rates, payments, attendance)
 */
export function registerPersonnelRoutes(app: Express, deps: RouteDeps): void {
  const { createAuthenticatedClient, extractToken } = deps;

  // ========== PERSONNEL RATES ENDPOINTS ==========

  /**
   * GET /api/personnel/:personnelId/rates
   * Get all rates (active and historical) for a personnel
   */
  app.get("/api/personnel/:personnelId/rates", async (req, res) => {
    try {
      const { personnelId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: rates, error } = await authenticatedSupabase
        .from('personnel_rates')
        .select(`
          *,
          currency:currencies!currency_id(id, code, name, symbol),
          personnel:project_personnel!personnel_id(
            id,
            contact:contacts!contact_id(id, first_name, last_name, full_name)
          ),
          labor_type:labor_types!labor_type_id(id, name)
        `)
        .eq('personnel_id', personnelId)
        .eq('organization_id', organization_id)
        .order('valid_from', { ascending: false });

      if (error) {
        console.error("Error fetching personnel rates:", error);
        return res.status(500).json({ error: "Failed to fetch personnel rates" });
      }

      res.json(rates || []);
    } catch (error) {
      console.error("Error fetching personnel rates:", error);
      res.status(500).json({ error: "Failed to fetch personnel rates" });
    }
  });

  /**
   * GET /api/personnel/:personnelId/active-rate
   * Get the active rate for a personnel on a specific date
   * Query params: date (YYYY-MM-DD), organization_id
   */
  app.get("/api/personnel/:personnelId/active-rate", async (req, res) => {
    try {
      const { personnelId } = req.params;
      const { date, organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Get effective rate for the given date
      const effectiveRate = await getEffectiveRate(
        authenticatedSupabase,
        personnelId,
        date,
        organization_id as string
      );

      if (!effectiveRate) {
        return res.status(404).json({ error: "No active rate found for this date" });
      }

      res.json(effectiveRate);
    } catch (error) {
      console.error("Error fetching active rate:", error);
      res.status(500).json({ error: "Failed to fetch active rate" });
    }
  });

  /**
   * POST /api/personnel/:personnelId/rates
   * Create a new rate for a personnel
   * If there's an active rate, it closes it (sets valid_to) before creating the new one
   */
  app.post("/api/personnel/:personnelId/rates", async (req, res) => {
    try {
      const { personnelId } = req.params;
      const rateData = req.body;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Validate request body
      const validation = insertPersonnelRatesSchema.safeParse({
        ...rateData,
        personnel_id: personnelId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.errors 
        });
      }

      const validatedData = validation.data;

      // Verify that either personnel_id OR labor_type_id is present (not both, not neither)
      const hasPersonnelId = !!validatedData.personnel_id;
      const hasLaborTypeId = !!validatedData.labor_type_id;

      if (hasPersonnelId && hasLaborTypeId) {
        return res.status(400).json({ 
          error: "Cannot specify both personnel_id and labor_type_id" 
        });
      }

      if (!hasPersonnelId && !hasLaborTypeId) {
        return res.status(400).json({ 
          error: "Must specify either personnel_id or labor_type_id" 
        });
      }

      // Validate valid_from <= valid_to if valid_to exists
      if (validatedData.valid_to && validatedData.valid_from > validatedData.valid_to) {
        return res.status(400).json({ 
          error: "valid_from must be less than or equal to valid_to" 
        });
      }

      // Check if there's an active rate for this personnel
      const { data: existingActiveRate } = await authenticatedSupabase
        .from('personnel_rates')
        .select('id, valid_from')
        .eq('personnel_id', personnelId)
        .eq('organization_id', validatedData.organization_id)
        .eq('is_active', true)
        .is('valid_to', null)
        .maybeSingle();

      // If there's an active rate, close it by setting valid_to to one day before the new rate
      if (existingActiveRate) {
        const newValidFrom = new Date(validatedData.valid_from);
        const closingDate = new Date(newValidFrom);
        closingDate.setDate(closingDate.getDate() - 1);
        const closingDateStr = closingDate.toISOString().split('T')[0];

        await authenticatedSupabase
          .from('personnel_rates')
          .update({ valid_to: closingDateStr })
          .eq('id', existingActiveRate.id);
      }

      // Create the new rate
      const { data: newRate, error } = await authenticatedSupabase
        .from('personnel_rates')
        .insert(validatedData)
        .select(`
          *,
          currency:currencies!currency_id(id, code, name, symbol),
          personnel:project_personnel!personnel_id(
            id,
            contact:contacts!contact_id(id, first_name, last_name, full_name)
          ),
          labor_type:labor_types!labor_type_id(id, name)
        `)
        .single();

      if (error) {
        console.error("Error creating personnel rate:", error);
        return res.status(500).json({ error: "Failed to create personnel rate" });
      }

      res.json(newRate);
    } catch (error) {
      console.error("Error creating personnel rate:", error);
      res.status(500).json({ error: "Failed to create personnel rate" });
    }
  });

  /**
   * PATCH /api/personnel/rates/:rateId
   * Update an existing rate
   */
  app.patch("/api/personnel/rates/:rateId", async (req, res) => {
    try {
      const { rateId } = req.params;
      const updateData = req.body;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Validate valid_from <= valid_to if both are present
      if (updateData.valid_from && updateData.valid_to && updateData.valid_from > updateData.valid_to) {
        return res.status(400).json({ 
          error: "valid_from must be less than or equal to valid_to" 
        });
      }

      const { data: updatedRate, error } = await authenticatedSupabase
        .from('personnel_rates')
        .update(updateData)
        .eq('id', rateId)
        .select(`
          *,
          currency:currencies!currency_id(id, code, name, symbol),
          personnel:project_personnel!personnel_id(
            id,
            contact:contacts!contact_id(id, first_name, last_name, full_name)
          ),
          labor_type:labor_types!labor_type_id(id, name)
        `)
        .single();

      if (error) {
        console.error("Error updating personnel rate:", error);
        return res.status(500).json({ error: "Failed to update personnel rate" });
      }

      res.json(updatedRate);
    } catch (error) {
      console.error("Error updating personnel rate:", error);
      res.status(500).json({ error: "Failed to update personnel rate" });
    }
  });

  /**
   * DELETE /api/personnel/rates/:rateId
   * Deactivate a rate (set is_active = false)
   */
  app.delete("/api/personnel/rates/:rateId", async (req, res) => {
    try {
      const { rateId } = req.params;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const { data: deactivatedRate, error } = await authenticatedSupabase
        .from('personnel_rates')
        .update({ is_active: false })
        .eq('id', rateId)
        .select()
        .single();

      if (error) {
        console.error("Error deactivating personnel rate:", error);
        return res.status(500).json({ error: "Failed to deactivate personnel rate" });
      }

      res.json({ success: true, rate: deactivatedRate });
    } catch (error) {
      console.error("Error deactivating personnel rate:", error);
      res.status(500).json({ error: "Failed to deactivate personnel rate" });
    }
  });

  /**
   * GET /api/personnel/:personnelId/pending-payments
   * Calculate pending payments based on attendance records
   * Query params: project_id, organization_id
   */
  app.get("/api/personnel/:personnelId/pending-payments", async (req, res) => {
    try {
      const { personnelId } = req.params;
      const { project_id, organization_id } = req.query;

      if (!project_id || !organization_id) {
        return res.status(400).json({ 
          error: "project_id and organization_id are required" 
        });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      const pendingPayments = await calculatePendingPayments(
        authenticatedSupabase,
        project_id as string,
        personnelId,
        organization_id as string
      );

      res.json(pendingPayments);
    } catch (error) {
      console.error("Error calculating pending payments:", error);
      res.status(500).json({ error: "Failed to calculate pending payments" });
    }
  });

  /**
   * GET /api/personnel/batch
   * Batch endpoint to get active rates and pending payments for multiple personnel
   * Query params: personnelIds[] (array), organization_id, project_id, date (optional, defaults to today)
   * Returns: { rates: { [personnelId]: rate | null }, pending: { [personnelId]: pendingData } }
   */
  app.get("/api/personnel/batch", async (req, res) => {
    try {
      const { personnelIds, organization_id, project_id, date } = req.query;

      // Validate required params
      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      if (!project_id) {
        return res.status(400).json({ error: "project_id is required" });
      }

      if (!personnelIds) {
        return res.status(400).json({ error: "personnelIds is required" });
      }

      // Parse personnelIds (can be single string or array)
      const personnelIdsArray = Array.isArray(personnelIds) 
        ? personnelIds 
        : [personnelIds];

      if (personnelIdsArray.length === 0) {
        return res.json({ rates: {}, pending: {} });
      }

      // Extract and validate auth token
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Validate that all personnelIds belong to the specified organization
      const { data: personnelRecords, error: validateError } = await authenticatedSupabase
        .from('project_personnel')
        .select('id, organization_id, project_id')
        .in('id', personnelIdsArray);

      if (validateError) {
        console.error("Error validating personnel:", validateError);
        return res.status(500).json({ error: "Failed to validate personnel" });
      }

      // Check that all personnel belong to the same organization and project
      const invalidPersonnel = personnelRecords?.filter(
        p => p.organization_id !== organization_id || p.project_id !== project_id
      );

      if (invalidPersonnel && invalidPersonnel.length > 0) {
        return res.status(403).json({ 
          error: "One or more personnel do not belong to the specified organization or project" 
        });
      }

      // Use today's date if not provided
      const effectiveDate = (date as string) || new Date().toISOString().split('T')[0];

      // Fetch active rates for all personnel
      const rates: Record<string, any> = {};
      await Promise.all(
        personnelIdsArray.map(async (personnelId) => {
          try {
            const rate = await getEffectiveRate(
              authenticatedSupabase,
              personnelId as string,
              effectiveDate,
              organization_id as string
            );
            rates[personnelId as string] = rate;
          } catch (error) {
            console.error(`Error fetching rate for personnel ${personnelId}:`, error);
            rates[personnelId as string] = null;
          }
        })
      );

      // Fetch pending payments for all personnel
      const pending: Record<string, any> = {};
      await Promise.all(
        personnelIdsArray.map(async (personnelId) => {
          try {
            const pendingData = await calculatePendingPayments(
              authenticatedSupabase,
              project_id as string,
              personnelId as string,
              organization_id as string
            );
            pending[personnelId as string] = pendingData;
          } catch (error) {
            console.error(`Error fetching pending for personnel ${personnelId}:`, error);
            pending[personnelId as string] = {
              total_owed_by_currency: {},
              total_paid_by_currency: {},
              pending_by_currency: {},
              details: []
            };
          }
        })
      );

      res.json({ rates, pending });
    } catch (error) {
      console.error("Error in batch personnel endpoint:", error);
      res.status(500).json({ error: "Failed to fetch personnel batch data" });
    }
  });
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get the effective rate for a personnel on a specific date
 * Searches for personnel-specific rate first, then falls back to labor_type rate
 */
async function getEffectiveRate(
  supabaseClient: any,
  personnelId: string,
  date: string,
  organizationId: string
): Promise<any | null> {
  // First, try to find a personnel-specific rate
  const { data: personnelRate } = await supabaseClient
    .from('personnel_rates')
    .select(`
      *,
      currency:currencies!currency_id(id, code, name, symbol),
      personnel:project_personnel!personnel_id(
        id,
        contact:contacts!contact_id(id, first_name, last_name, full_name)
      ),
      labor_type:labor_types!labor_type_id(id, name)
    `)
    .eq('personnel_id', personnelId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .lte('valid_from', date)
    .or(`valid_to.is.null,valid_to.gte.${date}`)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (personnelRate) {
    return personnelRate;
  }

  // If no personnel-specific rate, try labor_type rate
  // First get the personnel's labor_type_id
  const { data: personnel } = await supabaseClient
    .from('project_personnel')
    .select('labor_type_id')
    .eq('id', personnelId)
    .single();

  if (!personnel?.labor_type_id) {
    return null;
  }

  const { data: laborTypeRate } = await supabaseClient
    .from('personnel_rates')
    .select(`
      *,
      currency:currencies!currency_id(id, code, name, symbol),
      labor_type:labor_types!labor_type_id(id, name)
    `)
    .eq('labor_type_id', personnel.labor_type_id)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .is('personnel_id', null)
    .lte('valid_from', date)
    .or(`valid_to.is.null,valid_to.gte.${date}`)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  return laborTypeRate || null;
}

/**
 * Calculate pending payments for a personnel based on attendance records
 * Returns amounts grouped by currency
 */
async function calculatePendingPayments(
  supabaseClient: any,
  projectId: string,
  personnelId: string,
  organizationId: string
): Promise<any> {
  // Get all attendance records for this personnel in this project
  const { data: attendances, error: attendanceError } = await supabaseClient
    .from('personnel_attendees')
    .select(`
      id,
      hours_worked,
      created_at,
      site_log:site_logs!site_log_id(date)
    `)
    .eq('personnel_id', personnelId)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);

  if (attendanceError) {
    console.error("Error fetching attendances:", attendanceError);
    throw new Error("Failed to fetch attendances");
  }

  if (!attendances || attendances.length === 0) {
    return {
      total_owed_by_currency: {},
      total_paid_by_currency: {},
      pending_by_currency: {},
      details: []
    };
  }

  // Calculate total owed based on rates
  const totalOwedByCurrency: Record<string, number> = {};
  const details: any[] = [];

  for (const attendance of attendances) {
    // Get the date from site_log or use created_at
    const attendanceDate = attendance.site_log?.date || 
                          attendance.created_at.split('T')[0];

    // Get effective rate for this date
    const rate = await getEffectiveRate(
      supabaseClient,
      personnelId,
      attendanceDate,
      organizationId
    );

    if (rate) {
      let amountOwed = 0;
      const hoursWorked = attendance.hours_worked || 0;

      // Calculate based on pay_type
      switch (rate.pay_type) {
        case 'hour':
          amountOwed = hoursWorked * parseFloat(rate.rate_hour || '0');
          break;
        case 'day':
          // Assume 8 hours = 1 day
          const days = hoursWorked / 8;
          amountOwed = days * parseFloat(rate.rate_day || '0');
          break;
        case 'month':
          // Assume 160 hours = 1 month (20 days * 8 hours)
          const months = hoursWorked / 160;
          amountOwed = months * parseFloat(rate.rate_month || '0');
          break;
      }

      const currencyCode = rate.currency?.code || 'ARS';

      if (!totalOwedByCurrency[currencyCode]) {
        totalOwedByCurrency[currencyCode] = 0;
      }
      totalOwedByCurrency[currencyCode] += amountOwed;

      details.push({
        attendance_id: attendance.id,
        date: attendanceDate,
        hours_worked: hoursWorked,
        rate_used: {
          pay_type: rate.pay_type,
          rate_value: rate[`rate_${rate.pay_type}`],
          currency: rate.currency
        },
        amount_owed: amountOwed
      });
    }
  }

  // Get total paid from movement_payments_view
  // First get the contact_id from project_personnel
  const { data: personnel } = await supabaseClient
    .from('project_personnel')
    .select('contact_id')
    .eq('id', personnelId)
    .single();

  const totalPaidByCurrency: Record<string, number> = {};

  if (personnel?.contact_id) {
    const { data: payments } = await supabaseClient
      .from('movement_payments_view')
      .select('amount, currency_name, currency_code')
      .eq('project_id', projectId)
      .eq('contact_id', personnel.contact_id)
      .eq('movement_type', 'expense')
      .eq('contact_role', 'personnel');

    if (payments) {
      for (const payment of payments) {
        const currencyCode = payment.currency_code || payment.currency_name || 'ARS';
        if (!totalPaidByCurrency[currencyCode]) {
          totalPaidByCurrency[currencyCode] = 0;
        }
        totalPaidByCurrency[currencyCode] += payment.amount || 0;
      }
    }
  }

  // Calculate pending by currency
  const pendingByCurrency: Record<string, number> = {};
  const allCurrencies = Array.from(new Set([
    ...Object.keys(totalOwedByCurrency),
    ...Object.keys(totalPaidByCurrency)
  ]));

  for (const currency of allCurrencies) {
    const owed = totalOwedByCurrency[currency] || 0;
    const paid = totalPaidByCurrency[currency] || 0;
    pendingByCurrency[currency] = owed - paid;
  }

  return {
    total_owed_by_currency: totalOwedByCurrency,
    total_paid_by_currency: totalPaidByCurrency,
    pending_by_currency: pendingByCurrency,
    details
  };
}
