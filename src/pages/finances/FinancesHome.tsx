import { useEffect } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { Layout } from "@/components/layout/desktop/Layout";
import { FinancesDashboard } from "@/pages/finances/FinancesDashboard";

export default function FinancesHome() {
  const { setSidebarContext } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('finances');
  }, [setSidebarContext]);

  return (
    <Layout
      headerProps={{
        title: "Finanzas",
        description: "Control financiero y presupuestario de proyectos",
      }}
    >
      <FinancesDashboard />
    </Layout>
  );
}