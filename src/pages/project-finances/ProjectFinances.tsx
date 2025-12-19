import { useState, useEffect } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectFinancesMovementsTab } from "./ProjectFinancesMovementsTab";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from "@/components/modal/state/globalModalStore";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";

export default function ProjectFinances() {
  const [activeTab, setActiveTab] = useState("movements");
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('project');
  }, [setSidebarLevel]);

  const handleAddMovement = () => {
    openModal('unified-payment', {
      organizationId: currentOrganizationId,
      projectId: selectedProjectId,
      isProjectContext: true,
    });
  };

  const tabs = [
    { id: "movements", label: "Movimientos", isActive: activeTab === "movements" },
  ];

  const isProjectReady = !!selectedProjectId;

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas del Proyecto",
    description: "Movimientos financieros de este proyecto",
    tabs,
    onTabChange: setActiveTab,
    organizationId: userData?.organization?.id,
    showMembers: true,
    showProjectSelector: false,
    actions: isProjectReady ? [
      activeTab === "movements" && (
        <Button
          key="add-movement"
          onClick={handleAddMovement}
          className="h-8 px-3 text-xs"
          data-testid="button-add-movement"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      ),
    ].filter(Boolean) : [],
  };

  if (!isProjectReady) {
    return (
      <Layout wide={false} headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout wide={false} headerProps={headerProps}>
      {activeTab === "movements" && (
        <ProjectFinancesMovementsTab projectId={selectedProjectId} />
      )}
    </Layout>
  );
}
