import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Building2, FolderOpen, DollarSign, Coins } from "lucide-react";
import { useMovementKPIs, CurrencyBalance } from "@/hooks/use-movement-kpis";

interface MovementKPICardsProps {
  organizationId?: string;
  projectId?: string;
}

// Component to render a single currency balance
const CurrencyBalanceBadge: React.FC<{ balance: CurrencyBalance, index: number }> = ({ balance, index }) => {
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
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className="flex items-center justify-between py-1"
    >
      <span className="text-xs font-medium text-muted-foreground">
        {balance.currencyCode}
      </span>
      <span className={`text-xs font-bold ${getBalanceColor(balance.balance)}`}>
        {getBalanceSign(balance.balance)}{formatAmount(balance.balance)}
      </span>
    </motion.div>
  );
};

export function MovementKPICards({ organizationId, projectId }: MovementKPICardsProps) {
  const { projectBalances, organizationBalances, isLoading } = useMovementKPIs(organizationId, projectId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
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

  // Filter out cards that have no movements
  const cardsWithMovements = kpiCards.filter(card => card.balances.length > 0);

  // If no cards have movements, don't render anything
  if (cardsWithMovements.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-4 mb-6 ${cardsWithMovements.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 md:grid-cols-2'}`}>
      {cardsWithMovements.map((card, cardIndex) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: cardIndex * 0.1 }}
        >
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20`, color: card.color }}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Balances por moneda
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {card.balances.length === 0 ? (
                  <div className="text-center py-4">
                    <Coins className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {card.emptyMessage}
                    </p>
                  </div>
                ) : (
                  card.balances.slice(0, 3).map((balance, index) => (
                    <CurrencyBalanceBadge 
                      key={balance.currency} 
                      balance={balance} 
                      index={index} 
                    />
                  ))
                )}

                {card.balances.length > 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="pt-2 mt-2 border-t border-border"
                  >
                    <Badge variant="secondary" className="text-xs">
                      +{card.balances.length - 3} moneda{card.balances.length - 3 > 1 ? 's' : ''} más
                    </Badge>
                  </motion.div>
                )}
              </div>

              {card.balances.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 pt-3 border-t border-border"
                >
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total movimientos:</span>
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