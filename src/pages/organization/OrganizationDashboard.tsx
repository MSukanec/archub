import { Layout } from "@/components/layout/desktop/Layout";
import { Building } from "lucide-react";

export default function OrganizationDashboard() {
  const headerProps = {
    title: "Resumen de Organización",
    icon: Building,
    breadcrumb: [
      { name: "Organización", href: "/organization/dashboard" }
    ],
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Página vacía - contenido será agregado más adelante */}
      </div>
    </Layout>
  );
}
