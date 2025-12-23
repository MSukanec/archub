import { useState } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from "@/layouts/lab/LabLayout";
import { DollarSign } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { OrganizationFinancesView } from "@/features/finances/views/OrganizationFinancesView";

const FINANCES_TABS = [
  { id: "dashboard", label: "Visión General" },
  { id: "movements", label: "Movimientos" },
];

export default function OrganizationFinances() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

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
        <OrganizationFinancesView activeTab={activeTab} onTabChange={setActiveTab} />
      </LabLayout>
    );
  }

  return (
    <Layout wide={false} headerProps={headerProps}>
      <OrganizationFinancesView activeTab={activeTab} onTabChange={setActiveTab} />
    </Layout>
  );
}
