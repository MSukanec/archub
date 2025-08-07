import { Layout } from "@/components/layout/desktop/Layout";

export default function OrganizationDashboard() {
  const headerProps = {
    title: "Resumen de Organización",
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
