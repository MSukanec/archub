import { useMemo } from 'react';
import { convertToBaseCurrency } from '@/lib/money';
import type { FinancialMovementWithRelations } from '../types';

interface PartnerBalance {
  partnerId: string;
  partnerName: string;
  balance: number;
  contributions: number;
  withdrawals: number;
  linkedUser?: { avatar_url?: string | null } | null;
}

interface CurrencyBreakdownItem {
  currencyCode: string;
  currencySymbol: string;
  amount: number;
}

interface PartnerMetrics {
  totalInPrimaryCurrency: number;
  totalContributions: number;
  totalWithdrawals: number;
  contributionsByCurrency: CurrencyBreakdownItem[];
  withdrawalsByCurrency: CurrencyBreakdownItem[];
  balanceByCurrency: Array<{
    currencyCode: string;
    currencySymbol: string;
    contributions: number;
    withdrawals: number;
    balance: number;
  }>;
  balanceByPartner: PartnerBalance[];
}

export function usePartnerMetrics(
  movements: FinancialMovementWithRelations[],
  primaryCurrencyCode?: string
): PartnerMetrics {
  return useMemo(() => {
    // Calcular balance por moneda (sin conversión)
    const currencyMap = new Map<string, {
      currencyCode: string;
      currencySymbol: string;
      contributions: number;
      withdrawals: number;
    }>();

    movements.forEach(movement => {
      const code = movement.currency?.code || 'N/A';
      const symbol = movement.currency?.symbol || '$';
      
      if (!currencyMap.has(code)) {
        currencyMap.set(code, {
          currencyCode: code,
          currencySymbol: symbol,
          contributions: 0,
          withdrawals: 0,
        });
      }

      const curr = currencyMap.get(code)!;
      
      // Partner contributions are positive (income)
      // Partner withdrawals are negative (expense)
      if (movement.amount >= 0) {
        curr.contributions += movement.amount;
      } else {
        curr.withdrawals += Math.abs(movement.amount);
      }
    });

    const balanceByCurrency = Array.from(currencyMap.values()).map(curr => ({
      ...curr,
      balance: curr.contributions - curr.withdrawals,
    }));

    // Extraer breakdowns por moneda para contribuciones y retiros
    const contributionsByCurrency: CurrencyBreakdownItem[] = Array.from(currencyMap.values())
      .filter(curr => curr.contributions > 0)
      .map(curr => ({
        currencyCode: curr.currencyCode,
        currencySymbol: curr.currencySymbol,
        amount: curr.contributions,
      }));

    const withdrawalsByCurrency: CurrencyBreakdownItem[] = Array.from(currencyMap.values())
      .filter(curr => curr.withdrawals > 0)
      .map(curr => ({
        currencyCode: curr.currencyCode,
        currencySymbol: curr.currencySymbol,
        amount: curr.withdrawals,
      }));

    // Calcular total en moneda principal (convertir TODOS los movimientos)
    // Usar onMissingBase: 'zero' para evitar mezclar monedas cuando no hay moneda base
    const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
      return sum + convertToBaseCurrency(movement, primaryCurrencyCode, { onMissingBase: 'zero' });
    }, 0);

    // Calcular total de aportes en moneda principal
    const totalContributions = movements
      .filter(m => m.amount >= 0)
      .reduce((sum, movement) => {
        return sum + convertToBaseCurrency(movement, primaryCurrencyCode, { onMissingBase: 'zero' });
      }, 0);

    // Calcular total de retiros en moneda principal
    const totalWithdrawals = Math.abs(
      movements
        .filter(m => m.amount < 0)
        .reduce((sum, movement) => {
          return sum + convertToBaseCurrency(movement, primaryCurrencyCode, { onMissingBase: 'zero' });
        }, 0)
    );

    // Calcular balance por socio (en moneda principal)
    const partnerMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      contributions: number;
      withdrawals: number;
      linkedUser: { avatar_url?: string | null } | null;
    }>();

    movements.forEach(movement => {
      // Get partner info from movement
      const partnerId = movement.partner_id || 'sin-socio';
      const partnerName = movement.partner?.name || movement.movement_category || 'Sin Socio';

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName,
          contributions: 0,
          withdrawals: 0,
          linkedUser: null,
        });
      }

      const partner = partnerMap.get(partnerId)!;
      const convertedAmount = convertToBaseCurrency(movement, primaryCurrencyCode, { onMissingBase: 'zero' });

      if (movement.amount >= 0) {
        partner.contributions += convertedAmount;
      } else {
        partner.withdrawals += Math.abs(convertedAmount);
      }
    });

    const balanceByPartner = Array.from(partnerMap.values())
      .map(p => ({
        ...p,
        balance: p.contributions - p.withdrawals,
      }))
      .sort((a, b) => b.balance - a.balance);

    return {
      totalInPrimaryCurrency,
      totalContributions,
      totalWithdrawals,
      contributionsByCurrency,
      withdrawalsByCurrency,
      balanceByCurrency,
      balanceByPartner,
    };
  }, [movements, primaryCurrencyCode]);
}
