import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency } from '../../utils/responseFormatter.js';
import { convertCurrency } from '../../utils/currencyConverter.js';

/**
 * Obtiene los compromisos de pago de clientes y calcula cuánto han pagado vs cuánto falta.
 * 
 * Esta función es CRÍTICA para evitar que la IA invente datos financieros.
 * Consulta la tabla project_clients (compromisos) y movement_payments_view (pagos reales)
 * para calcular el avance real de los pagos de clientes.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param clientName - Nombre del cliente (opcional, si se omite muestra todos)
 * @param projectName - Nombre del proyecto (opcional)
 * @param currency - Código de moneda para filtrar (opcional)
 * @param convertTo - Código de moneda a la que convertir (opcional: 'USD', 'ARS')
 * @returns Mensaje con detalle de compromisos, pagos, saldo pendiente y % de avance
 */
export async function getClientCommitments(
  organizationId: string,
  supabase: SupabaseClient,
  clientName?: string,
  projectName?: string,
  currency?: string,
  convertTo?: string
): Promise<string> {
  
  try {
    // 1. Fetch all currencies for conversion
    const { data: allCurrencies, error: currenciesError } = await supabase
      .from('currencies')
      .select('id, code, name, symbol');
    
    if (currenciesError) {
      console.error('Error fetching currencies:', currenciesError);
      return `Error al buscar monedas: ${currenciesError.message}`;
    }

    // 2. Build query for project_clients (compromisos)
    let projectClientsQuery = supabase
      .from('project_clients')
      .select(`
        id,
        project_id,
        client_id,
        unit,
        committed_amount,
        currency_id,
        exchange_rate,
        created_at,
        contacts!inner(
          id,
          first_name,
          last_name,
          company_name,
          full_name
        ),
        projects!inner(
          id,
          name
        )
      `)
      .eq('organization_id', organizationId);

    // Filter by project if specified
    if (projectName) {
      // We'll filter in JavaScript after fetching to handle partial matches
    }

    const { data: projectClients, error: clientsError } = await projectClientsQuery;

    if (clientsError) {
      console.error('Error fetching project clients:', clientsError);
      return `Error al buscar compromisos de clientes: ${clientsError.message}`;
    }

    if (!projectClients || projectClients.length === 0) {
      return projectName 
        ? `No encontré compromisos de clientes en el proyecto **"${projectName}"**`
        : 'No encontré compromisos de clientes en tu organización';
    }

    // Filter by project name (JavaScript for partial match)
    let filteredClients = projectClients;
    if (projectName) {
      const projectNameLower = projectName.toLowerCase();
      filteredClients = projectClients.filter((pc: any) => 
        (pc.projects?.name ?? '').toLowerCase().includes(projectNameLower)
      );
      
      if (filteredClients.length === 0) {
        return `No encontré compromisos de clientes en el proyecto **"${projectName}"**`;
      }
    }

    // Filter by client name if specified
    if (clientName) {
      const clientNameLower = clientName.toLowerCase();
      filteredClients = filteredClients.filter((pc: any) => {
        const fullName = (pc.contacts?.full_name ?? '').toLowerCase();
        const firstName = (pc.contacts?.first_name ?? '').toLowerCase();
        const lastName = (pc.contacts?.last_name ?? '').toLowerCase();
        const companyName = (pc.contacts?.company_name ?? '').toLowerCase();
        
        return (
          fullName.includes(clientNameLower) ||
          firstName.includes(clientNameLower) ||
          lastName.includes(clientNameLower) ||
          companyName.includes(clientNameLower)
        );
      });
      
      if (filteredClients.length === 0) {
        return `No encontré compromisos de **"${clientName}"**${projectName ? ` en el proyecto **"${projectName}"**` : ''}`;
      }
    }

    // 3. Fetch all client payments
    const { data: clientPayments, error: paymentsError } = await supabase
      .from('movement_payments_view')
      .select('*')
      .eq('organization_id', organizationId);

    if (paymentsError) {
      console.error('Error fetching client payments:', paymentsError);
      return `Error al buscar pagos de clientes: ${paymentsError.message}`;
    }

    // 4. Calculate totals for each client commitment
    const clientCommitmentDetails = filteredClients.map((pc: any) => {
      const clientId = pc.client_id;
      const projectId = pc.project_id;
      const commitmentCurrencyId = pc.currency_id;
      const commitmentExchangeRate = pc.exchange_rate || 1;
      const committedAmount = Number(pc.committed_amount || 0);
      
      // Find all payments for this specific project_client commitment
      // FIX: Filter by project_client_id to avoid duplicating payments across multiple commitments
      const relevantPayments = (clientPayments || []).filter((payment: any) => 
        payment.project_client_id === pc.id
      );
      
      // Calculate total paid (with currency conversion if needed)
      let totalPaid = 0;
      relevantPayments.forEach((payment: any) => {
        const paymentAmount = Math.abs(Number(payment.amount || 0));
        const paymentCurrency = allCurrencies?.find((c: any) => c.id === payment.currency_id);
        const commitmentCurrency = allCurrencies?.find((c: any) => c.id === commitmentCurrencyId);
        
        const paymentCurrencyCode = paymentCurrency?.code || 'USD';
        const commitmentCurrencyCode = commitmentCurrency?.code || 'USD';
        
        if (paymentCurrencyCode === commitmentCurrencyCode) {
          // Same currency - no conversion needed
          totalPaid += paymentAmount;
        } else {
          // FIX: Use convertCurrency helper for any currency pair conversion
          const paymentRate = Number(payment.exchange_rate || 1);
          const commitmentRate = Number(commitmentExchangeRate);
          const convertedAmount = convertCurrency(paymentAmount, paymentRate, commitmentRate);
          totalPaid += convertedAmount;
        }
      });
      
      const remainingBalance = committedAmount - totalPaid;
      const paymentPercentage = committedAmount > 0 
        ? (totalPaid / committedAmount) * 100 
        : 0;
      const remainingPercentage = 100 - paymentPercentage;
      
      const commitmentCurrency = allCurrencies?.find((c: any) => c.id === commitmentCurrencyId);
      const currencySymbol = commitmentCurrency?.symbol || '$';
      const currencyCode = commitmentCurrency?.code || 'USD';
      
      // Get client display name
      const contact = pc.contacts;
      const displayName = contact?.full_name || 
        [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') ||
        contact?.company_name ||
        'Cliente desconocido';
      
      const projectName = pc.projects?.name || 'Proyecto desconocido';
      const unit = pc.unit ? ` (${pc.unit})` : '';
      
      return {
        projectClientId: pc.id,
        displayName,
        projectName,
        unit,
        committedAmount,
        totalPaid,
        remainingBalance,
        paymentPercentage,
        remainingPercentage,
        currencySymbol,
        currencyCode,
        exchangeRate: commitmentExchangeRate,
        paymentsCount: relevantPayments.length
      };
    });

    // 5. Filter by currency if specified
    let finalClients = clientCommitmentDetails;
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      finalClients = clientCommitmentDetails.filter(c => c.currencyCode === currencyUpper);
      
      if (finalClients.length === 0) {
        return `No encontré compromisos de clientes en **${currencyUpper}**`;
      }
    }

    // 6. Apply conversion if specified
    if (convertTo) {
      const convertToUpper = convertTo.toUpperCase();
      const targetCurrency = allCurrencies?.find((c: any) => c.code === convertToUpper);
      
      if (!targetCurrency) {
        return `No encontré la moneda **${convertToUpper}** para convertir`;
      }
      
      // FIX: Implement actual conversion using convertCurrency helper
      // Find a reference exchange rate for the target currency from commitments or payments
      let targetRate: number | null = null;
      
      // Try to find target rate from a commitment in that currency
      const referenceCommitment = filteredClients.find((pc: any) => {
        const pcCurrency = allCurrencies?.find((c: any) => c.id === pc.currency_id);
        return pcCurrency?.code === convertToUpper;
      });
      
      if (referenceCommitment) {
        targetRate = Number(referenceCommitment.exchange_rate || 1);
      } else {
        // Try to find target rate from a payment in that currency
        const referencePayment = (clientPayments || []).find((payment: any) => {
          const paymentCurrency = allCurrencies?.find((c: any) => c.id === payment.currency_id);
          return paymentCurrency?.code === convertToUpper;
        });
        
        if (referencePayment) {
          targetRate = Number(referencePayment.exchange_rate || 1);
        }
      }
      
      if (targetRate === null) {
        return `No encontré datos en **${convertToUpper}** para usar como referencia de conversión`;
      }
      
      // Convert all client commitment amounts to target currency
      finalClients = finalClients.map(c => {
        // Find the source exchange rate for this commitment using unique projectClientId
        const sourceCommitment = filteredClients.find((pc: any) => pc.id === c.projectClientId);
        
        const sourceRate = Number(sourceCommitment?.exchange_rate || 1);
        
        // Convert all amounts
        const convertedCommittedAmount = convertCurrency(c.committedAmount, sourceRate, targetRate);
        const convertedTotalPaid = convertCurrency(c.totalPaid, sourceRate, targetRate);
        const convertedRemainingBalance = convertedCommittedAmount - convertedTotalPaid;
        
        // Recalculate percentages based on converted amounts
        const paymentPercentage = convertedCommittedAmount > 0 
          ? (convertedTotalPaid / convertedCommittedAmount) * 100 
          : 0;
        const remainingPercentage = 100 - paymentPercentage;
        
        return {
          ...c,
          committedAmount: convertedCommittedAmount,
          totalPaid: convertedTotalPaid,
          remainingBalance: convertedRemainingBalance,
          paymentPercentage,
          remainingPercentage,
          currencySymbol: targetCurrency.symbol || '$',
          currencyCode: convertToUpper
        };
      });
    }

    // 7. Format response
    if (finalClients.length === 1) {
      // Single client - detailed response
      const c = finalClients[0];
      const percentageEmoji = c.paymentPercentage >= 100 ? '✅' : 
                             c.paymentPercentage >= 80 ? '🟢' :
                             c.paymentPercentage >= 50 ? '🟡' : '🔴';
      
      return `**${c.displayName}** en el proyecto **"${c.projectName}"**${c.unit}:\n\n` +
        `📊 **Resumen del compromiso**:\n` +
        `• Monto comprometido: **${formatCurrency(c.committedAmount, c.currencySymbol, c.currencyCode)}**\n` +
        `• Pagado a la fecha: **${formatCurrency(c.totalPaid, c.currencySymbol, c.currencyCode)}** (${c.paymentsCount} pago${c.paymentsCount !== 1 ? 's' : ''})\n` +
        `• Saldo pendiente: **${formatCurrency(c.remainingBalance, c.currencySymbol, c.currencyCode)}**\n\n` +
        `${percentageEmoji} **Avance de pago**: **${c.paymentPercentage.toFixed(1)}%** completado\n` +
        `• Falta pagar: **${c.remainingPercentage.toFixed(1)}%**`;
    } else {
      // Multiple clients - summary table
      const totalCommitted = finalClients.reduce((sum, c) => sum + c.committedAmount, 0);
      const totalPaid = finalClients.reduce((sum, c) => sum + c.totalPaid, 0);
      const totalRemaining = totalCommitted - totalPaid;
      const overallPercentage = totalCommitted > 0 ? (totalPaid / totalCommitted) * 100 : 0;
      
      // Group by currency
      const byCurrency: Record<string, typeof finalClients> = {};
      finalClients.forEach(c => {
        if (!byCurrency[c.currencyCode]) {
          byCurrency[c.currencyCode] = [];
        }
        byCurrency[c.currencyCode].push(c);
      });
      
      let response = `**Compromisos de pago de clientes**${projectName ? ` en **"${projectName}"**` : ''}:\n\n`;
      
      Object.entries(byCurrency).forEach(([code, clients]) => {
        const currSymbol = clients[0].currencySymbol;
        const currTotal = clients.reduce((sum, c) => sum + c.committedAmount, 0);
        const currPaid = clients.reduce((sum, c) => sum + c.totalPaid, 0);
        const currRemaining = currTotal - currPaid;
        const currPercentage = currTotal > 0 ? (currPaid / currTotal) * 100 : 0;
        
        response += `💰 **${code}**: ${formatCurrency(currTotal, currSymbol, code)} comprometidos, ` +
                   `${formatCurrency(currPaid, currSymbol, code)} pagados (${currPercentage.toFixed(1)}%)\n\n`;
        
        clients.forEach(c => {
          const emoji = c.paymentPercentage >= 100 ? '✅' : 
                       c.paymentPercentage >= 80 ? '🟢' :
                       c.paymentPercentage >= 50 ? '🟡' : '🔴';
          response += `${emoji} **${c.displayName}**${c.unit}: ${formatCurrency(c.committedAmount, currSymbol, code)} ` +
                     `(${formatCurrency(c.totalPaid, currSymbol, code)} pagado, ${c.paymentPercentage.toFixed(1)}%)\n`;
        });
        response += '\n';
      });
      
      return response.trim();
    }

  } catch (err) {
    console.error('Unexpected error in getClientCommitments:', err);
    return 'Error inesperado al buscar compromisos de clientes. Por favor intenta nuevamente.';
  }
}
