import { useState } from "react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { DollarSign } from "lucide-react";
import { OrgMovementsTab } from "./OrgMovementsTab";
import { PartnerMovementsTab } from "./PartnerMovementsTab";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function Finances() {
  const [activeTab, setActiveTab] = useState("movements");
  const { data: userData } = useCurrentUser();

  const tabs = [
    { id: "movements", label: "Movimientos", isActive: activeTab === "movements" },
    { id: "partner_movements", label: "Movimientos de Socios", isActive: activeTab === "partner_movements" },
  ];

  return (
    <Layout
      headerProps={{
        icon: DollarSign,
        title: "Finanzas",
        description: "Gestión financiera de la organización",
        tabs,
        onTabChange: setActiveTab,
        organizationId: userData?.organization?.id,
        showMembers: true,
        showProjectSelector: true,
      }}
    >
      {activeTab === "movements" && <OrgMovementsTab />}
      {activeTab === "partner_movements" && <PartnerMovementsTab />}
    </Layout>
  );
}
