import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Building2, FolderOpen, DollarSign, Coins } from "lucide-react";
import { useMovementKPIs, CurrencyBalance } from "@/hooks/use-movement-kpis";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface MovementKPICardsProps {
  organizationId?: string;
  projectId?: string;
}

// Component to render a single currency balance
const CurrencyBalanceBadge: React.FC<{ balance: CurrencyBalance, index: number, isMobile: boolean }> = ({ balance, index, isMobile }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getBalanceColor = (amount: number) => {
    return "text-foreground";
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
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className={`flex items-center justify-between ${isMobile ? 'py-0.5' : 'py-1'}`}
    >
      <span className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
        {balance.currencyCode}
      </span>
      <span className={`font-bold ${getBalanceColor(balance.balance)} ${isMobile ? 'text-xs' : 'text-xs'}`}>
        {getBalanceSign(balance.balance)}{formatAmount(balance.balance)}
      </span>
    </motion.div>
  );
};

export function MovementKPICards({ organizationId, projectId }: MovementKPICardsProps) {
  const { projectBalances, organizationBalances, isLoading } = useMovementKPIs(organizationId, projectId);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className={`grid gap-3 mb-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className={isMobile ? "p-3" : "p-6"}>
            <div className={`animate-pulse ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
              <div className={`bg-muted rounded ${isMobile ? 'h-3 w-1/2' : 'h-4 w-1/3'}`}></div>
              <div className={`bg-muted rounded ${isMobile ? 'h-6 w-3/4' : 'h-8 w-1/2'}`}></div>
              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
                <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className={isMobile ? "p-3" : "p-6"}>
            <div className={`animate-pulse ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
              <div className={`bg-muted rounded ${isMobile ? 'h-3 w-1/2' : 'h-4 w-1/3'}`}></div>
              <div className={`bg-muted rounded ${isMobile ? 'h-6 w-3/4' : 'h-8 w-1/2'}`}></div>
              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
                <div className={`bg-muted rounded ${isMobile ? 'h-2' : 'h-3'}`}></div>
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
      balances: projectBalances,
      emptyMessage: "Sin movimientos en el proyecto",
      color: "#84cc16",
    },
    {
      title: "Balance de la Organización",
      icon: Building2,
      balances: organizationBalances,
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
              <div className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-4'}`}>
                <div className="flex-shrink-0">
                  <div 
                    className={`rounded-lg flex items-center justify-center ${isMobile ? 'w-7 h-7' : 'w-10 h-10'}`}
                    style={{ backgroundColor: `${card.color}20`, color: card.color }}
                  >
                    <card.icon className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-foreground ${isMobile ? 'text-xs leading-tight' : 'text-sm'}`}>
                    {isMobile ? card.title.replace('Balance del ', '').replace('Balance de la ', '') : card.title}
                  </h3>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Balances por moneda
                    </p>
                  )}
                </div>
              </div>

              <div className={isMobile ? "space-y-0.5" : "space-y-1"}>
                {card.balances.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-2' : 'py-4'}`}>
                    <Coins className={`mx-auto text-muted-foreground mb-1 ${isMobile ? 'w-5 h-5' : 'w-8 h-8 mb-2'}`} />
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {isMobile ? 'Sin movimientos' : card.emptyMessage}
                    </p>
                  </div>
                ) : (
                  card.balances.slice(0, isMobile ? 2 : 3).map((balance, index) => (
                    <CurrencyBalanceBadge 
                      key={balance.currency} 
                      balance={balance} 
                      index={index}
                      isMobile={isMobile}
                    />
                  ))
                )}

                {card.balances.length > (isMobile ? 2 : 3) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`border-t border-border ${isMobile ? 'pt-1 mt-1' : 'pt-2 mt-2'}`}
                  >
                    <Badge variant="secondary" className={isMobile ? "text-xs px-1 py-0" : "text-xs"}>
                      +{card.balances.length - (isMobile ? 2 : 3)} más
                    </Badge>
                  </motion.div>
                )}
              </div>

              {card.balances.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`border-t border-border ${isMobile ? 'mt-2 pt-1' : 'mt-4 pt-3'}`}
                >
                  <div className={`flex justify-between text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <span>{isMobile ? 'Total:' : 'Total movimientos:'}</span>
                    <span className="font-medium">
                      {card.balances.reduce((sum, b) => sum + b.movementCount, 0)}
                    </span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}