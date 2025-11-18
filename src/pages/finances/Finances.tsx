import { useState } from "react";
import { Layout } from "@/components/layout/desktop/Layout";
import { DollarSign } from "lucide-react";
import { MovementsTab } from "./MovementsTab";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function Finances() {
  const [activeTab, setActiveTab] = useState("movements");
  const { data: userData } = useCurrentUser();

  const tabs = [
    { id: "movements", label: "Movimientos", isActive: activeTab === "movements" },
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
      {activeTab === "movements" && <MovementsTab />}
    </Layout>
  );
}
