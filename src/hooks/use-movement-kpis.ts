import { useMemo } from "react";
import { useMovements } from "./use-movements";

export interface CurrencyBalance {
  currency: string;
  currencyCode: string;
  currencyName: string;
  balance: number;
  positiveTotal: number;
  negativeTotal: number;
  movementCount: number;
}

export interface MovementKPIs {
  projectBalances: CurrencyBalance[];
  organizationBalances: CurrencyBalance[];
  isLoading: boolean;
}

export function useMovementKPIs(organizationId?: string, projectId?: string): MovementKPIs {
  // Get all organization movements (without project filter)
  const { data: organizationMovements, isLoading: isLoadingOrgMovements } = useMovements(
    organizationId,
    undefined // No project filter to get all movements
  );

  // Get project-specific movements
  const { data: projectMovements, isLoading: isLoadingProjectMovements } = useMovements(
    organizationId,
    projectId
  );

  const isLoading = isLoadingOrgMovements || isLoadingProjectMovements;

  const kpis = useMemo(() => {
    // Helper function to calculate balances by currency
    const calculateCurrencyBalances = (movements: any[]): CurrencyBalance[] => {
      if (!movements || movements.length === 0) return [];

      const currencyTotals = new Map<string, {
        currency: string;
        currencyCode: string;
        currencyName: string;
        balance: number;
        positiveTotal: number;
        negativeTotal: number;
        movementCount: number;
      }>();

      movements.forEach(movement => {
        if (!movement.movement_data?.currency) return;

        const currency = movement.movement_data.currency;
        const currencyId = currency.id;
        const amount = movement.amount || 0;

        if (!currencyTotals.has(currencyId)) {
          currencyTotals.set(currencyId, {
            currency: currencyId,
            currencyCode: currency.code || currency.name,
            currencyName: currency.name,
            balance: 0,
            positiveTotal: 0,
            negativeTotal: 0,
            movementCount: 0,
          });
        }

        const currencyData = currencyTotals.get(currencyId)!;
        currencyData.balance += amount;
        currencyData.movementCount += 1;

        if (amount > 0) {
          currencyData.positiveTotal += amount;
        } else {
          currencyData.negativeTotal += Math.abs(amount);
        }
      });

      return Array.from(currencyTotals.values()).sort((a, b) => 
        Math.abs(b.balance) - Math.abs(a.balance)
      );
    };

    // Calculate project balances
    const projectBalances = projectMovements ? calculateCurrencyBalances(projectMovements) : [];

    // Calculate organization balances
    const organizationBalances = organizationMovements ? calculateCurrencyBalances(organizationMovements) : [];

    return {
      projectBalances,
      organizationBalances,
      isLoading,
    };
  }, [organizationMovements, projectMovements, isLoading]);

  return kpis;
}