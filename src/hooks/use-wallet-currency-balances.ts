import { useMemo } from "react";
import { useMovements } from "./use-movements";

export interface WalletCurrencyBalance {
  wallet: string;
  currency: string;
  currencyCode: string;
  balance: number;
  movementCount: number;
}

export interface CurrencyGroupedData {
  currencyCode: string;
  currencyName: string;
  wallets: WalletCurrencyBalance[];
  totalBalance: number;
  totalMovements: number;
}

export interface WalletCurrencyKPIs {
  projectBalances: CurrencyGroupedData[];
  organizationBalances: CurrencyGroupedData[];
  topTwoCurrencies: CurrencyGroupedData[];
  isLoading: boolean;
}

export function useWalletCurrencyBalances(organizationId?: string, projectId?: string): WalletCurrencyKPIs {
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
    // Helper function to calculate wallet-currency balances
    const calculateWalletCurrencyBalances = (movements: any[]): CurrencyGroupedData[] => {
      if (!movements || movements.length === 0) return [];

      const walletCurrencyMap = new Map<string, WalletCurrencyBalance>();
      const currencyMovementCounts = new Map<string, number>();

      movements.forEach(movement => {
        if (!movement.movement_data?.currency || !movement.movement_data?.wallet || !movement.movement_data?.type) return;

        const currency = movement.movement_data.currency;
        const wallet = movement.movement_data.wallet;
        const currencyCode = currency.code || currency.name;
        const walletName = wallet.name;
        const amount = movement.amount || 0;
        const typeName = movement.movement_data.type?.name?.toLowerCase() || '';

        // Count movements per currency
        currencyMovementCounts.set(currencyCode, (currencyMovementCounts.get(currencyCode) || 0) + 1);

        const key = `${walletName}-${currencyCode}`;

        if (!walletCurrencyMap.has(key)) {
          walletCurrencyMap.set(key, {
            wallet: walletName,
            currency: currency.name,
            currencyCode: currencyCode,
            balance: 0,
            movementCount: 0,
          });
        }

        const walletCurrencyData = walletCurrencyMap.get(key)!;
        walletCurrencyData.movementCount += 1;

        // Calculate balance correctly based on movement type
        if (typeName.includes('ingreso')) {
          // Ingresos suman al balance
          walletCurrencyData.balance += Math.abs(amount);
        } else if (typeName.includes('egreso')) {
          // Egresos restan del balance
          walletCurrencyData.balance -= Math.abs(amount);
        }
      });

      // Group by currency and filter out wallets with 0 balance
      const currencyGroups = new Map<string, CurrencyGroupedData>();
      
      walletCurrencyMap.forEach(walletCurrency => {
        // Skip wallets with 0 balance to avoid showing empty wallets
        if (walletCurrency.balance === 0) return;
        
        const currencyCode = walletCurrency.currencyCode;
        
        if (!currencyGroups.has(currencyCode)) {
          currencyGroups.set(currencyCode, {
            currencyCode: currencyCode,
            currencyName: walletCurrency.currency,
            wallets: [],
            totalBalance: 0,
            totalMovements: currencyMovementCounts.get(currencyCode) || 0,
          });
        }

        const currencyGroup = currencyGroups.get(currencyCode)!;
        currencyGroup.wallets.push(walletCurrency);
        currencyGroup.totalBalance += walletCurrency.balance;
      });

      // Sort currencies by total movement count (most movements first)
      return Array.from(currencyGroups.values()).sort((a, b) => b.totalMovements - a.totalMovements);
    };

    // Calculate project balances
    const projectBalances = projectMovements ? calculateWalletCurrencyBalances(projectMovements) : [];

    // Calculate organization balances  
    const organizationBalances = organizationMovements ? calculateWalletCurrencyBalances(organizationMovements) : [];

    // Get top 2 currencies with most movements from organization balances
    const topTwoCurrencies = organizationBalances.slice(0, 2);

    return {
      projectBalances,
      organizationBalances,
      topTwoCurrencies,
      isLoading,
    };
  }, [organizationMovements, projectMovements, isLoading]);

  return kpis;
}