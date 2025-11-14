import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { organization_billing_cycles, organization_members } from "@shared/schema";

export function registerBillingRoutes(app: Express, deps: RouteDeps): void {
  const { createAuthenticatedClient, extractToken } = deps;

  // GET /api/billing/next-invoice/:organizationId
  app.get("/api/billing/next-invoice/:organizationId", async (req, res) => {
    try {
      const { organizationId } = req.params;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verificar que el usuario pertenece a la organización
      const member = await db.query.organization_members.findFirst({
        where: and(
          eq(organization_members.organization_id, organizationId),
          eq(organization_members.user_id, user.id),
          eq(organization_members.is_active, true)
        )
      });

      if (!member) {
        return res.status(403).json({ error: 'No tienes acceso a esta organización' });
      }

      // Contar billable members actuales
      const billableMembers = await db
        .select()
        .from(organization_members)
        .where(
          and(
            eq(organization_members.organization_id, organizationId),
            eq(organization_members.is_billable, true),
            eq(organization_members.is_active, true)
          )
        );

      const seats = billableMembers.length || 1;

      // Obtener último billing cycle para saber el precio
      const lastCycle = await db
        .select()
        .from(organization_billing_cycles)
        .where(eq(organization_billing_cycles.organization_id, organizationId))
        .orderBy(desc(organization_billing_cycles.created_at))
        .limit(1);

      const lastCycleData = lastCycle[0];
      const pricePerSeat = lastCycleData?.amount_per_seat ? Number(lastCycleData.amount_per_seat) : 20;
      const baseAmount = seats * pricePerSeat;

      // TODO: Calcular proration usando función PostgreSQL
      // const prorationAdjustment = await calculateProration(organizationId);
      const prorationAdjustment = 0;

      const totalAmount = baseAmount + prorationAdjustment;

      res.json({
        seats,
        pricePerSeat,
        baseAmount,
        prorationAdjustment,
        totalAmount,
        currency: lastCycleData?.currency_code || 'USD',
        nextBillingDate: lastCycleData?.period_end || null,
      });
    } catch (error) {
      console.error('[billing] Error calculating next invoice:', error);
      res.status(500).json({ error: 'Error calculating next invoice' });
    }
  });

  // GET /api/billing/cycles/:organizationId
  app.get("/api/billing/cycles/:organizationId", async (req, res) => {
    try {
      const { organizationId } = req.params;

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);
      const { data: { user }, error: userError } = await authenticatedSupabase.auth.getUser();
      
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verificar que el usuario pertenece a la organización
      const member = await db.query.organization_members.findFirst({
        where: and(
          eq(organization_members.organization_id, organizationId),
          eq(organization_members.user_id, user.id),
          eq(organization_members.is_active, true)
        )
      });

      if (!member) {
        return res.status(403).json({ error: 'No tienes acceso a esta organización' });
      }

      const cycles = await db
        .select()
        .from(organization_billing_cycles)
        .where(eq(organization_billing_cycles.organization_id, organizationId))
        .orderBy(desc(organization_billing_cycles.created_at))
        .limit(12);

      res.json(cycles);
    } catch (error) {
      console.error('[billing] Error fetching billing cycles:', error);
      res.status(500).json({ error: 'Error fetching billing cycles' });
    }
  });
}
