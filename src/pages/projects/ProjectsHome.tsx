import { useEffect } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { Layout } from "@/components/layout/desktop/Layout";
import { OrganizationProjects } from "@/pages/organization/OrganizationProjects";

export default function ProjectsHome() {
  const { setSidebarContext } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  return (
    <Layout
      headerProps={{
        title: "Proyectos",
        description: "Gestiona todos tus proyectos de construcción",
      }}
    >
      <OrganizationProjects />
    </Layout>
  );
}