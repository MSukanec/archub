import { useState } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancesMovementsTab } from "./FinancesMovementsTab";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useGlobalModalStore } from "@/components/modal/state/globalModalStore";

export default function Finances() {
  const [activeTab, setActiveTab] = useState("movements");
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();

  const handleAddMovement = () => {
    openModal('unified-payment', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
    });
  };

  const tabs = [
    { id: "movements", label: "Movimientos", isActive: activeTab === "movements" },
  ];

  return (
    <Layout
      wide
      headerProps={{
        icon: DollarSign,
        title: "Finanzas",
        description: "Gestión financiera unificada",
        tabs,
        onTabChange: setActiveTab,
        organizationId: userData?.organization?.id,
        showMembers: true,
        showProjectSelector: true,
        actions: [
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
        ].filter(Boolean),
      }}
    >
      {activeTab === "movements" && <FinancesMovementsTab />}
    </Layout>
  );
}
