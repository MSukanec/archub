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

// Component for mobile - simplified display (only totals)
const CurrencyMobileSimple: React.FC<{ 
  currency: CurrencyGroupedData; 
  index: number; 
}> = ({ currency, index }) => {
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
      {/* Row layout: Currency Code + Amount */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground text-sm">
          {currency.currencyCode}
        </h4>
        
        <span className={`font-bold text-base ${getBalanceColor(currency.totalBalance)}`}>
          {getBalanceSign(currency.totalBalance)}{formatAmount(currency.totalBalance)}
        </span>
      </div>
    </motion.div>
  );
};

// Component to render currency column with wallets (desktop)
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
  const { projectBalances, organizationBalances, isLoading } = useWalletCurrencyBalances(organizationId, projectId);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className={`grid gap-3 mb-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className={isMobile ? "p-3" : "p-6"}>
            <div className={`animate-pulse ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
              <div className={`bg-muted rounded ${isMobile ? 'h-3 w-1/2' : 'h-4 w-1/3'}`}></div>
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
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className={isMobile ? "p-3" : "p-6"}>
            <div className={`animate-pulse ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
              <div className={`bg-muted rounded ${isMobile ? 'h-3 w-1/2' : 'h-4 w-1/3'}`}></div>
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

  const kpiCards = [
    {
      title: "Balance del Proyecto",
      icon: FolderOpen,
      balances: projectBalances.slice(0, 2), // Top 2 currencies by movement count
      emptyMessage: "Sin movimientos en el proyecto",
      color: "#84cc16",
    },
    {
      title: "Balance de la Organización",
      icon: Building2,
      balances: organizationBalances.slice(0, 2), // Top 2 currencies by movement count
      emptyMessage: "Sin movimientos en la organización",
      color: "#3b82f6",
    }
  ];

  // If viewing a specific project and it has no movements, hide all KPIs
  if (projectId && projectBalances.length === 0) {
    return null;
  }

  // Otherwise, filter out cards that have no movements
  const cardsWithMovements = kpiCards.filter(card => card.balances.length > 0);

  // If no cards have movements, don't render anything
  if (cardsWithMovements.length === 0) {
    return null;
  }

  const getGridClasses = () => {
    if (isMobile) {
      return 'grid-cols-2';
    }
    return cardsWithMovements.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 md:grid-cols-2';
  };

  return (
    <div className={`grid gap-3 mb-4 ${getGridClasses()}`}>
      {cardsWithMovements.map((card, cardIndex) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: cardIndex * 0.1 }}
        >
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className={isMobile ? "p-3" : "p-6"}>
              {/* Header */}
              <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                <div 
                  className={`rounded-lg flex items-center justify-center ${isMobile ? 'w-7 h-7' : 'w-10 h-10'}`}
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  <card.icon className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-foreground ${isMobile ? 'text-xs leading-tight' : 'text-sm'}`}>
                    {isMobile ? card.title.replace('Balance del ', '').replace('Balance de la ', '') : card.title}
                  </h3>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Balances por billetera
                    </p>
                  )}
                </div>
              </div>

              {/* Currency columns or empty state */}
              {card.balances.length === 0 ? (
                <div className={`text-center ${isMobile ? 'py-2' : 'py-4'}`}>
                  <Wallet className={`mx-auto text-muted-foreground mb-1 ${isMobile ? 'w-5 h-5' : 'w-8 h-8 mb-2'}`} />
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    {isMobile ? 'Sin movimientos' : card.emptyMessage}
                  </p>
                </div>
              ) : (
                <div className={isMobile ? "space-y-2" : "flex gap-4"}>
                  {card.balances.map((currency, index) => (
                    isMobile ? (
                      <CurrencyMobileSimple
                        key={currency.currencyCode}
                        currency={currency}
                        index={index}
                      />
                    ) : (
                      <CurrencyColumn
                        key={currency.currencyCode}
                        currency={currency}
                        index={index}
                        isMobile={isMobile}
                      />
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}