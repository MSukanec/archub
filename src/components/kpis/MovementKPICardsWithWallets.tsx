import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Building2, FolderOpen, DollarSign, Wallet } from "lucide-react";
import { useWalletCurrencyBalances, CurrencyGroupedData } from "@/hooks/use-wallet-currency-balances";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface MovementKPICardsWithWalletsProps {
  organizationId?: string;
  projectId?: string;
}

// Component to render wallet balances within a currency
const WalletBalanceItem: React.FC<{ 
  wallet: string; 
  balance: number; 
  index: number; 
  isMobile: boolean;
}> = ({ wallet, balance, index, isMobile }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getBalanceSign = (amount: number) => {
    if (amount > 0) return "+";
    if (amount < 0) return "-";
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={`flex items-center justify-between ${isMobile ? 'py-0.5' : 'py-1'}`}
    >
      <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'} truncate flex-1 pr-2`}>
        {wallet}
      </span>
      <span className={`font-medium ${getBalanceColor(balance)} ${isMobile ? 'text-xs' : 'text-xs'} flex-shrink-0`}>
        {getBalanceSign(balance)}{formatAmount(balance)}
      </span>
    </motion.div>
  );
};

// Component to render currency column with wallets
const CurrencyColumn: React.FC<{ 
  currency: CurrencyGroupedData; 
  index: number; 
  isMobile: boolean;
}> = ({ currency, index, isMobile }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getBalanceSign = (amount: number) => {
    if (amount > 0) return "+";
    if (amount < 0) return "-";
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex-1 min-w-0"
    >
      {/* Currency header */}
      <div className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
        <div 
          className={`rounded-md flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
          style={{ backgroundColor: `${index === 0 ? '#84cc16' : '#3b82f6'}20`, color: index === 0 ? '#84cc16' : '#3b82f6' }}
        >
          <DollarSign className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </div>
        <h4 className={`font-bold text-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
          {currency.currencyCode}
        </h4>
      </div>

      {/* Wallet balances */}
      <div className={isMobile ? "space-y-0.5 mb-2" : "space-y-1 mb-3"}>
        {currency.wallets.map((wallet, walletIndex) => (
          <WalletBalanceItem
            key={`${wallet.wallet}-${wallet.currencyCode}`}
            wallet={wallet.wallet}
            balance={wallet.balance}
            index={walletIndex}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Divider and total */}
      <div className={`border-t border-border ${isMobile ? 'pt-1' : 'pt-2'}`}>
        <div className="flex items-center justify-between">
          <span className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Total:
          </span>
          <span className={`font-bold ${getBalanceColor(currency.totalBalance)} ${isMobile ? 'text-sm' : 'text-base'}`}>
            {getBalanceSign(currency.totalBalance)}{formatAmount(currency.totalBalance)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export function MovementKPICardsWithWallets({ organizationId, projectId }: MovementKPICardsWithWalletsProps) {
  const { topTwoCurrencies, projectBalances, isLoading } = useWalletCurrencyBalances(organizationId, projectId);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className={`mb-4`}>
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className={isMobile ? "p-3" : "p-6"}>
            <div className={`animate-pulse ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className={`bg-muted rounded ${isMobile ? 'h-3 w-8 mb-2' : 'h-4 w-12 mb-3'}`}></div>
                  <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                    <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
                    <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`bg-muted rounded ${isMobile ? 'h-3 w-8 mb-2' : 'h-4 w-12 mb-3'}`}></div>
                  <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                    <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
                    <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If viewing a specific project with no movements, hide KPI
  if (projectId && (!projectBalances || projectBalances.length === 0)) {
    return null;
  }

  // If no currencies have movements, don't render
  if (!topTwoCurrencies || topTwoCurrencies.length === 0) {
    return null;
  }

  return (
    <div className={`mb-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className={isMobile ? "p-3" : "p-6"}>
            {/* Header */}
            <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
              <div 
                className={`rounded-lg flex items-center justify-center ${isMobile ? 'w-7 h-7' : 'w-10 h-10'}`}
                style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
              >
                <Building2 className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-foreground ${isMobile ? 'text-sm leading-tight' : 'text-base'}`}>
                  {isMobile ? 'Balances' : 'Balances por Billetera'}
                </h3>
                {!isMobile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Principales monedas de la organización
                  </p>
                )}
              </div>
            </div>

            {/* Currency columns */}
            <div className="flex gap-4">
              {topTwoCurrencies.map((currency, index) => (
                <CurrencyColumn
                  key={currency.currencyCode}
                  currency={currency}
                  index={index}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}