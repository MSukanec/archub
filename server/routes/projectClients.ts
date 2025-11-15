import type { Express } from "express";
import type { RouteDeps } from "./_base";

export function registerProjectClientsRoutes(app: Express, deps: RouteDeps) {
  const { extractToken, createAuthenticatedClient } = deps;

  // GET /api/project-clients/:projectId - Get all clients for a project
  app.get("/api/project-clients/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = createAuthenticatedClient(token);

      // Fetch project clients with contact and role information
      const { data: projectClients, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          contacts:client_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            postal_code,
            website,
            organization_id,
            contact_type,
            tax_id,
            company_name,
            notes
          ),
          roles:client_role_id (
            id,
            name,
            is_default
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching project clients:", error);
        return res.status(500).json({ error: "Failed to fetch project clients" });
      }

      return res.json(projectClients || []);
    } catch (error) {
      console.error("Error in /api/project-clients/:projectId:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/project-clients-summary/:projectId - Get financial summary for project clients
  app.get("/api/project-clients-summary/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = createAuthenticatedClient(token);

      // Fetch organization plan
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          plan_id,
          plan:plan_id (
            id,
            slug,
            name
          )
        `)
        .eq('id', organization_id as string)
        .single();

      if (orgError) {
        console.error("Error fetching organization plan:", orgError);
        return res.status(500).json({ error: "Failed to fetch organization plan" });
      }

      const planSlug = orgData?.plan?.slug?.toUpperCase() || 'FREE';
      const isMultiCurrency = planSlug === 'PRO' || planSlug === 'TEAMS' || planSlug === 'ENTERPRISE';

      // Query the financial overview view
      const { data: financialData, error: viewError } = await supabase
        .from('client_financial_overview')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string);

      if (viewError) {
        console.error("Error fetching client financial overview:", viewError);
        return res.status(500).json({ error: "Failed to fetch client financial data" });
      }

      if (!financialData || financialData.length === 0) {
        return res.json({
          plan: {
            slug: planSlug,
            isMultiCurrency
          },
          clients: []
        });
      }

      // Get unique project_client_ids
      const projectClientIds = Array.from(new Set(financialData.map((item: any) => item.project_client_id)));

      // Fetch contact and role data
      const { data: projectClients, error: pcError } = await supabase
        .from('project_clients')
        .select(`
          id,
          client_id,
          client_role_id,
          is_primary,
          notes,
          contacts:client_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            company_name
          ),
          roles:client_role_id (
            id,
            name,
            is_default
          )
        `)
        .in('id', projectClientIds);

      if (pcError) {
        console.error("Error fetching project client details:", pcError);
        return res.status(500).json({ error: "Failed to fetch client details" });
      }

      // Fetch currencies
      const currencyIds = Array.from(new Set(financialData.map((item: any) => item.currency_id).filter(Boolean)));
      
      let currencies: any[] = [];
      if (currencyIds.length > 0) {
        const { data: currencyData, error: currencyError } = await supabase
          .from('currencies')
          .select('*')
          .in('id', currencyIds);
        
        if (!currencyError && currencyData) {
          currencies = currencyData;
        }
      }

      // Create a currency lookup
      const currencyLookup = currencies.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr;
        return acc;
      }, {});

      // Group financial data by project_client_id and currency
      const clientFinancialMap = new Map<string, any>();

      financialData.forEach((row: any) => {
        const pcId = row.project_client_id;
        const currencyId = row.currency_id || 'USD';
        
        if (!clientFinancialMap.has(pcId)) {
          clientFinancialMap.set(pcId, {
            financialByCurrency: []
          });
        }
        
        const clientData = clientFinancialMap.get(pcId);
        
        // Find or create currency entry
        let currencyEntry = clientData.financialByCurrency.find((f: any) => 
          f.currency_id === currencyId
        );
        
        if (!currencyEntry) {
          currencyEntry = {
            currency_id: currencyId,
            currency: currencyLookup[currencyId] || { code: 'USD', symbol: '$' },
            total_committed_amount: 0,
            total_paid_amount: 0,
            balance_due: 0,
            next_due: null,
            last_payment_date: null
          };
          clientData.financialByCurrency.push(currencyEntry);
        }
        
        // Update financial values
        currencyEntry.total_committed_amount = parseFloat(row.total_committed_amount || 0);
        currencyEntry.total_paid_amount = parseFloat(row.total_paid_amount || 0);
        currencyEntry.balance_due = parseFloat(row.balance_due || 0);
        currencyEntry.next_due = row.next_due ? parseFloat(row.next_due) : null;
        currencyEntry.last_payment_date = row.last_payment_date;
      });

      // Build the final client list
      const clients = projectClients?.map((pc: any) => {
        const clientFinancial = clientFinancialMap.get(pc.id) || { financialByCurrency: [] };
        
        // Calculate totals across all currencies (for sorting)
        const totals = clientFinancial.financialByCurrency.reduce((acc: any, curr: any) => {
          acc.total_committed_amount += curr.total_committed_amount;
          acc.total_paid_amount += curr.total_paid_amount;
          acc.balance_due += curr.balance_due;
          if (curr.next_due !== null) {
            acc.next_due = (acc.next_due || 0) + curr.next_due;
          }
          return acc;
        }, {
          total_committed_amount: 0,
          total_paid_amount: 0,
          balance_due: 0,
          next_due: null
        });
        
        return {
          ...pc,
          financialByCurrency: clientFinancial.financialByCurrency,
          ...totals
        };
      }) || [];

      return res.json({
        plan: {
          slug: planSlug,
          isMultiCurrency
        },
        clients
      });

    } catch (error) {
      console.error("Error in /api/project-clients-summary/:projectId:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/project-clients-payments/:projectId - Get payment data for a project
  app.get("/api/project-clients-payments/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { organization_id } = req.query;

      if (!organization_id) {
        return res.status(400).json({ error: "organization_id is required" });
      }

      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const supabase = createAuthenticatedClient(token);

      // First, get project clients for this project
      const { data: projectClients, error: pcError } = await supabase
        .from('project_clients')
        .select('id, client_id')
        .eq('project_id', projectId)
        .eq('organization_id', organization_id as string);

      if (pcError) {
        console.error("Error fetching project clients:", pcError);
        return res.status(500).json({ error: "Failed to fetch project clients" });
      }

      if (!projectClients || projectClients.length === 0) {
        return res.json([]);
      }

      // Get client IDs
      const clientIds = projectClients.map(pc => pc.client_id);

      // Fetch payment records for these clients (without joins to avoid ambiguity)
      const { data: payments, error } = await supabase
        .from('client_payments')
        .select('*')
        .in('client_id', clientIds)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error("Error fetching project payments:", error);
        return res.status(500).json({ error: "Failed to fetch payment data" });
      }

      if (!payments || payments.length === 0) {
        return res.json([]);
      }

      // Fetch additional data separately to avoid ambiguity
      const paymentClientIds = Array.from(new Set(payments.map((p: any) => p.client_id)));
      const currencyIds = Array.from(new Set(payments.map((p: any) => p.currency_id).filter(Boolean)));
      const methodIds = Array.from(new Set(payments.map((p: any) => p.payment_method_id).filter(Boolean)));

      // Fetch contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company_name')
        .in('id', paymentClientIds);

      // Fetch currencies
      const { data: currencies } = await supabase
        .from('currencies')
        .select('id, code, symbol')
        .in('id', currencyIds);

      // Fetch payment methods
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('id, name')
        .in('id', methodIds);

      // Create lookup maps
      const contactMap = (contacts || []).reduce((acc: any, c: any) => {
        acc[c.id] = c;
        return acc;
      }, {});

      const currencyMap = (currencies || []).reduce((acc: any, c: any) => {
        acc[c.id] = c;
        return acc;
      }, {});

      const methodMap = (paymentMethods || []).reduce((acc: any, m: any) => {
        acc[m.id] = m;
        return acc;
      }, {});

      // Transform the data for frontend consumption
      const transformedPayments = payments.map((payment: any) => ({
        id: payment.id,
        amount: parseFloat(payment.amount || 0),
        payment_date: payment.payment_date,
        description: payment.description,
        status: payment.status || 'pending',
        currency: currencyMap[payment.currency_id] || { code: 'USD', symbol: '$' },
        payment_method: methodMap[payment.payment_method_id] || null,
        client: contactMap[payment.client_id] ? {
          id: payment.client_id,
          name: contactMap[payment.client_id].company_name || 
                `${contactMap[payment.client_id].first_name || ''} ${contactMap[payment.client_id].last_name || ''}`.trim()
        } : null,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }));

      return res.json(transformedPayments);

    } catch (error) {
      console.error("Error in /api/project-clients-payments/:projectId:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}