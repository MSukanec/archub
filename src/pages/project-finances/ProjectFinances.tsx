import { useState, useMemo } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { DollarSign, Plus, Calendar, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { Button } from "@/components/ui/button";
import { useGlobalModalStore } from "@/components/modal";
import { useUnifiedMovements } from "@/features/finances/hooks/use-unified-movements";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectFinancesView } from "@/features/finances/views/ProjectFinancesView";
import { calculateAvailablePeriods, type PeriodFilter } from "@/features/organization";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
];

const FINANCES_TABS = [
  { id: "dashboard", label: "Visión General" },
  { id: "movements", label: "Movimientos" },
];

export default function ProjectFinances() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const organizationId = currentOrganizationId || userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const { data: allMovements = [] } = useUnifiedMovements(organizationId, selectedProjectId || undefined);
  const availablePeriods = useMemo(() => calculateAvailablePeriods(allMovements), [allMovements]);
  
  const validSelectedPeriod = useMemo(() => {
    if (availablePeriods[selectedPeriod]) return selectedPeriod;
    return 'all';
  }, [selectedPeriod, availablePeriods]);

  const secondaryRightContent = (
    <div className="flex items-center gap-3">
      {activeTab === "dashboard" && (
        <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
          <PopoverTrigger asChild>
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
                    {!isAvailable && option.value !== 'all' && <span className="ml-auto text-xs text-muted-foreground">(sin datos)</span>}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {activeTab === "movements" && (
        <Button
          size="sm"
          onClick={() => openModal('unified-payment', {
            organizationId,
            projectId: selectedProjectId || undefined,
            isProjectContext: true,
          })}
          data-testid="button-add-movement"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      )}
    </div>
  );

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas del Proyecto",
    description: "Movimientos financieros de este proyecto",
    tabs: FINANCES_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: true,
    showProjectSelector: true,
    secondaryRightContent,
  };

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
        <ProjectFinancesView activeTab={activeTab} onTabChange={setActiveTab} />
      </LabLayout>
    );
  }

  return (
    <Layout wide={false} headerProps={headerProps}>
      <ProjectFinancesView activeTab={activeTab} onTabChange={setActiveTab} />
    </Layout>
  );
}
