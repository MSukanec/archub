import { useState, useMemo } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { DollarSign, Plus, Calendar, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { useGlobalModalStore } from "@/components/modal";
import { useUnifiedMovements } from "@/features/finances/hooks/use-unified-movements";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrganizationFinancesView } from "@/features/finances/views/OrganizationFinancesView";
import { calculateAvailablePeriods, type PeriodFilter } from "@/pages/organization-finances/OrganizationFinancesDashboardTab";

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

export default function OrganizationFinances() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const { data: allMovements = [] } = useUnifiedMovements(organizationId, null);
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allMovements), [allMovements]);
  
  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod;
    return 'all';
  }, [selectedPeriod, availablePeriods]);

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas",
    description: "Gestión financiera de toda la organización",
    tabs: FINANCES_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: true,
    showProjectSelector: false,
  };

  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      {activeTab === "dashboard" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="select-period"
            >
              <Calendar className="h-4 w-4" />
              <span>{PERIOD_OPTIONS.find(opt => opt.value === validSelectedPeriod)?.label || 'Período'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {PERIOD_OPTIONS.map((option) => {
              const isAvailable = availablePeriods[option.value];
              return (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => isAvailable && setSelectedPeriod(option.value)}
                  disabled={!isAvailable}
                  className={validSelectedPeriod === option.value ? "font-medium" : ""}
                  data-testid={`option-period-${option.value}`}
                >
                  {option.label}
                  {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {activeTab === "movements" && (
        <Button
          size="sm"
          onClick={() => openModal('unified-payment', {
            organizationId,
            projectId: undefined,
            isProjectContext: false,
          })}
          data-testid="button-add-movement"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      )}
    </div>
  );

  if (isLabLayout) {
    return (
      <LabLayout 
        showToolbar={true} 
        organizationId={organizationId}
        showMembers={true}
        tabs={FINANCES_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: secondaryRightContent,
        }}
      >
        <OrganizationFinancesView 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      </LabLayout>
    );
  }

  return (
    <Layout wide={false} headerProps={headerProps}>
      <OrganizationFinancesView activeTab={activeTab} onTabChange={setActiveTab} />
    </Layout>
  );
}
