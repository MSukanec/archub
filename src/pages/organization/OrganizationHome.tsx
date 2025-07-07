import { useEffect } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { Layout } from "@/components/layout/desktop/Layout";
import { OrganizationDashboard } from "@/pages/organization/OrganizationDashboard";

export default function OrganizationHome() {
  const { setSidebarContext } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  return (
    <Layout
      headerProps={{
        title: "Organización",
        description: "Gestiona tu organización, miembros y configuración",
      }}
    >
      <OrganizationDashboard />
    </Layout>
  );
}