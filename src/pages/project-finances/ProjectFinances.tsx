import { useState } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { DollarSign } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { ProjectFinancesView } from "@/features/finances/views/ProjectFinancesView";

const FINANCES_TABS = [
  { id: "dashboard", label: "Visión General" },
  { id: "movements", label: "Movimientos" },
];

export default function ProjectFinances() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: userData } = useCurrentUser();
  const { currentOrganizationId } = useProjectContext();
  const organizationId = currentOrganizationId || userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas del Proyecto",
    description: "Movimientos financieros de este proyecto",
    tabs: FINANCES_TABS.map(tab => ({ ...tab, isActive: activeTab === tab.id })),
    onTabChange: setActiveTab,
    organizationId,
    showMembers: true,
    showProjectSelector: true,
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
