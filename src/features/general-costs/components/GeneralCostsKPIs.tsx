import { useMemo } from 'react';
import { Receipt, TrendingUp, Building, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMobile } from '@/hooks/use-mobile';
import type { GeneralCost } from '../types';

interface GeneralCostsKPIsProps {
  generalCosts: GeneralCost[];
}

export function GeneralCostsKPIs({ generalCosts }: GeneralCostsKPIsProps) {
  const isMobile = useMobile();

  const kpiData = useMemo(() => {
    if (generalCosts.length === 0) return null;

    const totalGeneralCosts = generalCosts.length;
    const activeGeneralCosts = generalCosts.filter(gc => gc.is_active);
    
    const categoryCounts = generalCosts.reduce((acc, cost) => {
      const category = cost.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalGeneralCosts) * 100
    }));

    return {
      totalGeneralCosts,
      activeCount: activeGeneralCosts.length,
      categoryDistribution,
      categoryCounts
    };
  }, [generalCosts]);

  if (!kpiData) return null;

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
      {/* Total Gastos Generales */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className={`space-y-${isMobile ? '2' : '4'}`}>
            <div className="flex items-center justify-between">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {isMobile ? 'Gastos' : 'Total Gastos'}
              </p>
              <Building className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
            </div>
            
            <div className={`flex items-end gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm flex-1"
                  style={{
                    backgroundColor: 'var(--accent)',
                    height: `${Math.max(30, Math.random() * 100)}%`,
                    opacity: i < kpiData.totalGeneralCosts ? 1 : 0.3
                  }}
                />
              ))}
            </div>
            
            <div>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalGeneralCosts}</p>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {kpiData.activeCount} activos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorías */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className={`space-y-${isMobile ? '2' : '4'}`}>
            <div className="flex items-center justify-between">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {isMobile ? 'Categorías' : 'Categorías'}
              </p>
              <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
            </div>
            
            <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
              <div className="flex h-full w-full rounded-full overflow-hidden">
                {kpiData.categoryDistribution.map((category, index) => (
                  <div
                    key={index}
                    className="h-full"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                {Object.keys(kpiData.categoryCounts).length}
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                Diferentes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado General */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className={`space-y-${isMobile ? '2' : '4'}`}>
            <div className="flex items-center justify-between">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {isMobile ? 'Estado' : 'Estado General'}
              </p>
              <CreditCard className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
            </div>
            
            <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
              <svg className="w-full h-full" viewBox="0 0 100 32">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,32 L 0,${32 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 30)} Q 25,${20 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 0.2)} 50,${16 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 0.25)} T 100,${12 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 0.2)} L 100,32 Z`}
                  fill="url(#areaGradient)"
                />
              </svg>
            </div>
            
            <div>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                {((kpiData.activeCount / kpiData.totalGeneralCosts) * 100).toFixed(0)}%
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                Activos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organización */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className={`space-y-${isMobile ? '2' : '4'}`}>
            <div className="flex items-center justify-between">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {isMobile ? 'Scope' : 'Alcance'}
              </p>
              <Receipt className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
            </div>
            
            <div className={`${isMobile ? 'h-6' : 'h-8'} relative flex items-center`}>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
            
            <div>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                Org.
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                General
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
