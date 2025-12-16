import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancesMovementsTab } from "./FinancesMovementsTab";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from "@/components/modal/state/globalModalStore";
import { useProjectContext } from "@/stores/projectContext";
import { useNavigationStore } from "@/stores/navigationStore";

export default function Finances() {
  const [activeTab, setActiveTab] = useState("movements");
  const [location] = useLocation();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { setSidebarLevel } = useNavigationStore();

  const isProjectContext = location.startsWith('/project/');

  useEffect(() => {
    setSidebarLevel(isProjectContext ? 'project' : 'organization');
  }, [isProjectContext, setSidebarLevel]);

  const handleAddMovement = () => {
    openModal('unified-payment', {
      organizationId: userData?.organization?.id,
      projectId: isProjectContext ? selectedProjectId : undefined,
      isProjectContext,
    });
  };

  const tabs = [
    { id: "movements", label: "Movimientos", isActive: activeTab === "movements" },
  ];

  // En contexto de proyecto, esperar a tener el selectedProjectId antes de renderizar el tab
  // Esto garantiza aislamiento de cache y evita mostrar datos de organización en contexto de proyecto
  const isProjectReady = !isProjectContext || (isProjectContext && !!selectedProjectId);

  return (
    <Layout
      wide
      headerProps={{
        icon: DollarSign,
        title: isProjectContext ? "Finanzas del Proyecto" : "Finanzas",
        description: isProjectContext 
          ? "Movimientos financieros de este proyecto" 
          : "Gestión financiera de toda la organización",
        tabs,
        onTabChange: setActiveTab,
        organizationId: userData?.organization?.id,
        showMembers: true,
        showProjectSelector: false,
        actions: [
          activeTab === "movements" && isProjectReady && (
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
      {activeTab === "movements" && isProjectReady && (
        <FinancesMovementsTab 
          isProjectContext={isProjectContext}
          projectId={isProjectContext ? selectedProjectId : null}
        />
      )}
      {activeTab === "movements" && !isProjectReady && (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando datos del proyecto...</div>
        </div>
      )}
    </Layout>
  );
}
