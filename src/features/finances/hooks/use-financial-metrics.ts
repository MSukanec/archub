import { useMemo } from 'react';
import type { FinancialMovementWithRelations } from '../types';

interface FinancialMetrics {
  totalInPrimaryCurrency: number;
  balanceByCurrency: Array<{
    currencyCode: string;
    currencySymbol: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  timeline: Array<{
    date: string;
    value: number;
  }>;
}

export function useFinancialMetrics(
  movements: FinancialMovementWithRelations[],
  primaryCurrencyCode?: string
): FinancialMetrics {
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
      income: number;
      expense: number;
    }>();

    movements.forEach(movement => {
      const code = movement.currency?.code || 'N/A';
      const symbol = movement.currency?.symbol || '$';
      
      if (!currencyMap.has(code)) {
        currencyMap.set(code, {
          currencyCode: code,
          currencySymbol: symbol,
          income: 0,
          expense: 0,
        });
      }

      const curr = currencyMap.get(code)!;
      if (movement.amount >= 0) {
        curr.income += movement.amount;
      } else {
        curr.expense += Math.abs(movement.amount);
      }
    });

    const balanceByCurrency = Array.from(currencyMap.values()).map(curr => ({
      ...curr,
      balance: curr.income - curr.expense,
    }));

    // Calcular total en moneda principal (convertir TODOS los movimientos)
    const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
      return sum + convertToPrimaryCurrency(movement);
    }, 0);

    // Crear timeline (últimos 14 días) - convertir a moneda principal
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyTotals = new Map<string, number>();
    movements.forEach(movement => {
      const date = movement.payment_date.split('T')[0];
      const current = dailyTotals.get(date) || 0;
      const convertedAmount = convertToPrimaryCurrency(movement);
      dailyTotals.set(date, current + convertedAmount);
    });

    const timeline = last14Days.map(date => ({
      date,
      value: dailyTotals.get(date) || 0,
    }));

    return {
      totalInPrimaryCurrency,
      balanceByCurrency,
      timeline,
    };
  }, [movements, primaryCurrencyCode]);
}
