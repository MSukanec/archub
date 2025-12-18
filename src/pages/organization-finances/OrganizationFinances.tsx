import { useState, useEffect } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationFinancesMovementsTab } from "./OrganizationFinancesMovementsTab";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from "@/components/modal/state/globalModalStore";
import { useNavigationStore } from "@/stores/navigationStore";

export default function OrganizationFinances() {
  const [activeTab, setActiveTab] = useState("movements");
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const handleAddMovement = () => {
    openModal('unified-payment', {
      organizationId: userData?.organization?.id,
      projectId: undefined,
      isProjectContext: false,
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
        description: "Gestión financiera de toda la organización",
        tabs,
        onTabChange: setActiveTab,
        organizationId: userData?.organization?.id,
        showMembers: true,
        showProjectSelector: false,
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
      {activeTab === "movements" && <OrganizationFinancesMovementsTab />}
    </Layout>
  );
}
