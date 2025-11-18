import { useMemo } from 'react';
import type { FinancialMovementWithRelations } from '../types';

interface PartnerMetrics {
  totalInPrimaryCurrency: number;
  totalContributions: number;
  totalWithdrawals: number;
  balanceByCurrency: Array<{
    currencyCode: string;
    currencySymbol: string;
    contributions: number;
    withdrawals: number;
    balance: number;
  }>;
}

export function usePartnerMetrics(
  movements: FinancialMovementWithRelations[],
  primaryCurrencyCode?: string
): PartnerMetrics {
  return useMemo(() => {
    // Helper: Convert amount to primary currency using exchange rate
    const convertToPrimaryCurrency = (movement: FinancialMovementWithRelations): number => {
      if (!primaryCurrencyCode) return movement.amount;
      
      // If already in primary currency, return as-is
      if (movement.currency?.code === primaryCurrencyCode) {
        return movement.amount;
      }
      
      // Convert using exchange_rate (stored rate converts this currency to primary)
      const exchangeRate = movement.exchange_rate || 1;
      return movement.amount * exchangeRate;
    };

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

    // Calcular total en moneda principal (convertir TODOS los movimientos)
    const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
      return sum + convertToPrimaryCurrency(movement);
    }, 0);

    // Calcular total de aportes en moneda principal
    const totalContributions = movements
      .filter(m => m.amount >= 0)
      .reduce((sum, movement) => {
        return sum + convertToPrimaryCurrency(movement);
      }, 0);

    // Calcular total de retiros en moneda principal
    const totalWithdrawals = Math.abs(
      movements
        .filter(m => m.amount < 0)
        .reduce((sum, movement) => {
          return sum + convertToPrimaryCurrency(movement);
        }, 0)
    );

    return {
      totalInPrimaryCurrency,
      totalContributions,
      totalWithdrawals,
      balanceByCurrency,
    };
  }, [movements, primaryCurrencyCode]);
}
