import { useState, useMemo } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign, Plus, Calendar, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import { useGlobalModalStore } from "@/components/modal";
import { useUnifiedMovements } from "@/features/finances/hooks/use-unified-movements";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  OrganizationFinancesDashboardView,
  OrganizationFinancesMovementsView,
  calculateAvailablePeriods,
  type PeriodFilter
} from "@/features/finances";

const FINANCES_TABS = [
  { id: "dashboard", label: "Visión General" },
  { id: "movements", label: "Movimientos" },
];

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
];

export function OrganizationFinancesPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id;

  const { data: allMovements = [] } = useUnifiedMovements(organizationId, null);
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allMovements), [allMovements]);
  
  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod;
    return 'all';
  }, [selectedPeriod, availablePeriods]);

  const periodContent = (
    <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="select-period"
        >
          <Calendar className="h-4 w-4" />
          <span>{PERIOD_OPTIONS.find(opt => opt.value === validSelectedPeriod)?.label || 'Período'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="min-w-[180px] p-2">
        <div className="flex flex-col gap-1">
          {PERIOD_OPTIONS.map((option) => {
            const isAvailable = availablePeriods[option.value];
            return (
              <button
                key={option.value}
                onClick={() => {
                  if (isAvailable) {
                    setSelectedPeriod(option.value);
                    setPeriodPopoverOpen(false);
                  }
                }}
                disabled={!isAvailable}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left w-full ${
                  validSelectedPeriod === option.value 
                    ? "font-medium bg-accent/10" 
                    : "hover:bg-accent/5"
                } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid={`option-period-${option.value}`}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas",
    description: "Gestión financiera de toda la organización",
    tabs: FINANCES_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: true,
    showProjectSelector: false,
    actions: activeTab === "dashboard" ? [periodContent] : [],
    actionButton: activeTab === "movements" ? {
      label: "Nuevo Movimiento",
      icon: Plus,
      onClick: () => openModal('unified-payment', {}),
    } : undefined,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <OrganizationFinancesDashboardView
            movements={allMovements}
            selectedPeriod={validSelectedPeriod}
            onNavigateToMovements={() => setActiveTab("movements")}
          />
        );
      case "movements":
        return <OrganizationFinancesMovementsView />;
      default:
        return (
          <OrganizationFinancesDashboardView
            movements={allMovements}
            selectedPeriod={validSelectedPeriod}
            onNavigateToMovements={() => setActiveTab("movements")}
          />
        );
    }
  };

  return (
    <Layout 
      headerProps={headerProps}
      wide={activeTab === "movements"}
    >
      {renderTabContent()}
    </Layout>
  );
}
